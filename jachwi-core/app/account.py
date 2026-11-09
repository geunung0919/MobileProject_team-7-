"""1번 모듈 회원 정보: 닉네임(AC-05~07), 거주 지역(AC-08~09), 회원 탈퇴(AC-11).

- 닉네임 규칙은 앱(UIUX/src/utils/nickname.js)과 같다. 바꿀 때는 두 곳을 함께 바꾼다.
- 지역은 법정동 코드(10자리) 중 현재 존재하는 읍·면·동만 받는다. 상세 주소와 위치 추적은 받지 않는다.
- 새 테이블만 추가한다(create_all 은 기존 테이블에 열을 추가하지 않으므로 기존 테이블 구조는 바꾸지 않음).
"""
import json
import re
import secrets
import time
import unicodedata
from functools import lru_cache
from pathlib import Path

from fastapi import Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import String, Integer, delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base, ProfileRow, SnapshotRow, NotificationSettingsRow, InventoryRow
from .google_auth import LoginAttempt, LoginSession, begin_attempt, digest, ATTEMPT_SECONDS

# ---------- 닉네임 (AC-06, AC-07) ----------
NICKNAME_PATTERN = re.compile(r'^[가-힣A-Za-z0-9]{2,10}$')

def normalize_nickname(raw):
    """앞뒤 공백 제거 + 유니코드 NFC. 규칙에 맞지 않으면 (None, 이유)."""
    if not isinstance(raw, str):
        return None, '닉네임을 입력해 주세요.'
    nickname = unicodedata.normalize('NFC', raw.strip())
    if len(nickname) < 2 or len(nickname) > 10:
        return None, '닉네임은 2~10자로 입력해 주세요.'
    if not NICKNAME_PATTERN.fullmatch(nickname):
        return None, '한글(완성형), 영문, 숫자만 쓸 수 있어요. 공백과 특수문자는 안 돼요.'
    return nickname, ''

def nickname_key(nickname):
    """중복 판단용 키: 영문 대소문자를 구분하지 않는다 (Abc 와 abc 는 같은 닉네임)."""
    return nickname.casefold()

# ---------- 지역 (AC-08, AC-09) ----------
@lru_cache(maxsize=1)
def regions():
    data = json.loads((Path(__file__).parent / 'data' / 'legal_dong.json').read_text(encoding='utf-8'))
    items = {}
    for code, dong in data['emd']:
        sido = data['sido'].get(code[:2], '')
        sigungu = data['sgg'].get(code[:5], '')
        label = ' '.join(x for x in (sido, sigungu, dong) if x)
        items[code] = {'code': code, 'sido': sido, 'sigungu': sigungu, 'dong': dong, 'label': label}
    return {'version': data['version'], 'items': items}

def region_info(code):
    return regions()['items'].get(code) if isinstance(code, str) else None

def search_regions(query, limit=20):
    """띄어쓰기로 나눈 단어가 모두 '시도 시군구 동' 이름에 들어 있는 동을 찾는다. 동 이름이 정확히 같은 것을 먼저."""
    words = [w for w in unicodedata.normalize('NFC', query or '').split() if w]
    if not words:
        return []
    hits = []
    for item in regions()['items'].values():
        if all(w in item['label'] for w in words):
            exact = any(item['dong'] == w or item['dong'].startswith(w) for w in words)
            hits.append((0 if exact else 1, item['label'], item))
    hits.sort(key=lambda h: (h[0], h[1]))
    return [h[2] for h in hits[:limit]]

# ---------- 저장 구조 ----------
class MemberRow(Base):
    __tablename__ = 'core_members'
    user_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    nickname: Mapped[str] = mapped_column(String(10))
    nickname_key: Mapped[str] = mapped_column(String(40), unique=True)  # 동시 가입에서도 유일성 보장 (AC-07)
    region_code: Mapped[str | None] = mapped_column(String(10), nullable=True)
    updated_at: Mapped[int] = mapped_column(Integer)

class WithdrawalRequest(Base):
    __tablename__ = 'core_withdrawal_requests'
    state: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(64))
    created: Mapped[int] = mapped_column(Integer)

class MemberWrite(BaseModel):
    nickname: str = Field(max_length=40)
    region_code: str | None = Field(default=None, pattern=r'^[0-9]{10}$')

class WithdrawalConfirm(BaseModel):
    state: str = Field(min_length=32, max_length=64)
    secret: str = Field(min_length=32, max_length=128)

def member_view(row):
    return {'nickname': row.nickname, 'region': region_info(row.region_code) if row.region_code else None,
            'updated_at': row.updated_at}

def user_tables():
    """회원 탈퇴 때 지울 사용자별 테이블. 새 사용자 테이블을 만들면 여기에 추가한다."""
    from .fintech import LedgerRow
    from .ui_state import UIStateRow
    return [MemberRow, ProfileRow, SnapshotRow, NotificationSettingsRow, InventoryRow, LedgerRow, UIStateRow, LoginSession]

def register_account(app, current_user, sessions):
    def db():
        with sessions() as session:
            yield session

    @app.get('/api/v1/regions/search', tags=['1번 회원'])
    def region_search(q: str = Query('', max_length=40)):
        """GPS 없이 이름으로 읍·면·동 검색 (AC-08). 같은 동 이름은 시도·시군구까지 붙은 label 로 구분."""
        return {'version': regions()['version'], 'items': search_regions(q)}

    @app.get('/api/v1/nicknames/availability', tags=['1번 회원'])
    def nickname_availability(nickname: str = Query('', max_length=40), user=Depends(current_user), session=Depends(db)):
        normalized, reason = normalize_nickname(nickname)
        if not normalized:
            return {'nickname': nickname.strip(), 'valid': False, 'available': False, 'message': reason}
        owner = session.scalar(select(MemberRow.user_id).where(MemberRow.nickname_key == nickname_key(normalized)))
        available = owner is None or owner == user  # 내 기존 닉네임은 그대로 쓸 수 있음
        return {'nickname': normalized, 'valid': True, 'available': available,
                'message': '사용할 수 있는 닉네임이에요.' if available else '이미 사용 중인 닉네임이에요.'}

    @app.get('/api/v1/me/member', tags=['1번 회원'])
    def get_member(user=Depends(current_user), session=Depends(db)):
        row = session.get(MemberRow, user)
        if row is None:
            raise HTTPException(404, '아직 프로필(닉네임)을 만들지 않았습니다.')
        return member_view(row)

    @app.put('/api/v1/me/member', tags=['1번 회원'])
    def put_member(body: MemberWrite, user=Depends(current_user), session=Depends(db)):
        nickname, reason = normalize_nickname(body.nickname)
        if not nickname:
            raise HTTPException(422, reason)
        if body.region_code is not None and region_info(body.region_code) is None:
            raise HTTPException(422, '현재 존재하는 읍·면·동 법정동 코드를 선택해 주세요.')
        row = session.get(MemberRow, user)
        previous_region = row.region_code if row else None
        if row is None:
            row = MemberRow(user_id=user)
            session.add(row)
        row.nickname, row.nickname_key = nickname, nickname_key(nickname)
        row.region_code, row.updated_at = body.region_code, int(time.time())
        # 지역이 바뀌면 온보딩 프로필의 region_code 도 같은 값으로 맞춘다 (지역 의존 정보는 이 값을 기준으로 함).
        profile = session.get(ProfileRow, user)
        if profile is not None and profile.payload.get('region_code') != body.region_code:
            profile.payload = {**profile.payload, 'region_code': body.region_code}
        try:
            session.commit()
        except IntegrityError:
            session.rollback()
            raise HTTPException(409, '이미 사용 중인 닉네임이에요. 다른 닉네임을 입력해 주세요.')
        return {**member_view(row), 'region_changed': previous_region != body.region_code}

    # ---------- 회원 탈퇴 (AC-11) ----------
    @app.post('/api/v1/me/withdrawal/start', tags=['1번 회원'])
    def withdrawal_start(user=Depends(current_user), session=Depends(db)):
        if not user.startswith('google:'):
            raise HTTPException(403, 'Google 계정만 탈퇴할 수 있습니다. (개발·시연 계정은 대상이 아님)')
        session.execute(delete(WithdrawalRequest).where(WithdrawalRequest.created < int(time.time()) - ATTEMPT_SECONDS))
        started = begin_attempt(session, reauth=True)
        session.add(WithdrawalRequest(state=started['state'], user_id=user, created=int(time.time())))
        session.commit()
        return started

    @app.post('/api/v1/me/withdrawal/confirm', tags=['1번 회원'])
    def withdrawal_confirm(body: WithdrawalConfirm, user=Depends(current_user), session=Depends(db)):
        request = session.get(WithdrawalRequest, body.state)
        attempt = session.get(LoginAttempt, body.state)
        if (request is None or request.user_id != user or attempt is None or attempt.expires < time.time()
                or not secrets.compare_digest(attempt.secret_hash, digest(body.secret))):
            raise HTTPException(401, '재인증이 만료되었습니다. 탈퇴를 처음부터 다시 진행해 주세요.')
        result = attempt.result or {}
        if result.get('status') not in ('complete', 'failed'):
            return {'status': 'pending'}
        session.delete(attempt)
        session.delete(request)
        if result['status'] == 'failed':
            session.commit()
            return {'status': 'failed', 'message': 'Google 재인증이 취소되었거나 실패했어요.'}
        if result.get('user_id') != user:
            session.commit()
            raise HTTPException(403, '로그인한 계정과 다른 Google 계정으로 인증했어요.')
        if result.get('auth_time', 0) < request.created - 60:
            session.commit()
            raise HTTPException(403, '방금 비밀번호로 다시 인증해야 탈퇴할 수 있어요.')
        deleted = {}
        for table in user_tables():
            count = session.execute(delete(table).where(table.user_id == user)).rowcount
            deleted[table.__tablename__] = count
        session.execute(delete(WithdrawalRequest).where(WithdrawalRequest.user_id == user))
        session.commit()
        return {'status': 'deleted', 'deleted': deleted,
                'message': '회원 탈퇴가 완료되었어요. 계정과 저장된 데이터를 모두 삭제했고 모든 기기의 로그인이 끝났어요.'}
