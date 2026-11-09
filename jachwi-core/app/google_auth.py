"""Browser OAuth with a one-time polling secret, suitable for Expo Go/Snack.
Secrets and Google tokens never appear in application deep links.
"""
import hashlib
import os
import secrets
import time
from urllib.parse import urlencode
import httpx
from fastapi import HTTPException, Depends
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field
from sqlalchemy import String, Integer, JSON, delete, update
from sqlalchemy.orm import Mapped, mapped_column
from .database import Base

class LoginAttempt(Base):
    __tablename__ = 'oauth_attempts'
    state: Mapped[str] = mapped_column(String(64), primary_key=True)
    secret_hash: Mapped[str] = mapped_column(String(64))
    nonce: Mapped[str] = mapped_column(String(64))
    expires: Mapped[int] = mapped_column(Integer)
    result: Mapped[dict] = mapped_column(JSON)

class LoginSession(Base):
    __tablename__ = 'login_sessions'
    token_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(64))
    expires: Mapped[int] = mapped_column(Integer)

def digest(text):
    return hashlib.sha256(text.encode()).hexdigest()

def session_user(sessions, token):
    with sessions() as db:
        row = db.get(LoginSession, digest(token))
        return row.user_id if row and row.expires > time.time() else None

class Poll(BaseModel):
    state: str = Field(min_length=32, max_length=64)
    secret: str = Field(min_length=32, max_length=128)

ATTEMPT_SECONDS = 300

def config():
    values = [os.getenv(k, '') for k in ('GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REDIRECT_URI')]
    if not all(values):
        raise HTTPException(503, '서버의 Google OAuth 설정이 필요합니다. 사용설명서를 확인하세요.')
    return values

def begin_attempt(db, reauth=False):
    """Google 인증 시도를 만든다. reauth=True 이면 max_age=0 으로 비밀번호 재입력을 요구한다(회원 탈퇴용)."""
    client_id, _, redirect = config()
    state, secret, nonce = (secrets.token_urlsafe(32) for _ in range(3))
    db.execute(delete(LoginAttempt).where(LoginAttempt.expires < int(time.time())))
    db.add(LoginAttempt(state=state, secret_hash=digest(secret), nonce=nonce,
                        expires=int(time.time())+ATTEMPT_SECONDS, result={}))
    params = dict(client_id=client_id, redirect_uri=redirect, response_type='code',
                  scope='openid email profile', state=state, nonce=nonce, prompt='select_account')
    if reauth:
        params['max_age'] = '0'
    return dict(state=state, secret=secret, authorization_url='https://accounts.google.com/o/oauth2/v2/auth?'+urlencode(params))

def register_google_auth(app, sessions):
    @app.post('/api/v1/auth/google/start', tags=['Google 로그인'])
    def start():
        with sessions() as db:
            result = begin_attempt(db)
            db.commit()
        return result

    @app.get('/api/v1/auth/google/callback', response_class=HTMLResponse, tags=['Google 로그인'])
    async def callback(state: str, code: str = '', error: str = ''):
        client_id, client_secret, redirect = config()
        with sessions() as db:
            attempt = db.get(LoginAttempt, state)
            if not attempt or attempt.expires < time.time() or attempt.result:
                raise HTTPException(400, '만료되었거나 이미 사용한 로그인입니다.')
            # Claim the callback before exchanging a code (prevents callback replay).
            claimed = db.execute(update(LoginAttempt).where(LoginAttempt.state == state,
                LoginAttempt.result == {}).values(result={'status': 'processing'}))
            db.commit()
            if claimed.rowcount != 1:
                raise HTTPException(400, '이미 처리 중인 로그인입니다.')
            nonce = attempt.nonce
        try:
            if error or not code:
                raise ValueError('cancelled')
            async with httpx.AsyncClient(timeout=15) as client:
                response = await client.post('https://oauth2.googleapis.com/token', data=dict(
                    code=code, client_id=client_id, client_secret=client_secret,
                    redirect_uri=redirect, grant_type='authorization_code'))
                response.raise_for_status()
                token = response.json()['id_token']
                verified = await client.get('https://oauth2.googleapis.com/tokeninfo', params={'id_token': token})
                verified.raise_for_status()
                claims = verified.json()
            if (claims.get('aud') != client_id or claims.get('iss') not in ('https://accounts.google.com', 'accounts.google.com')
                or int(claims.get('exp', 0)) <= time.time() or claims.get('nonce') != nonce
                or claims.get('email_verified') not in (True, 'true') or not claims.get('sub')):
                raise ValueError('invalid identity')
            result = {'status': 'complete', 'user_id': 'google:' + claims['sub'],
                      'email': claims.get('email', ''), 'name': claims.get('name', ''),
                      'auth_time': int(claims.get('auth_time') or 0)}  # 탈퇴 재인증 확인용
        except (httpx.HTTPError, ValueError, KeyError):
            result = {'status': 'failed'}
        with sessions() as db:
            db.execute(update(LoginAttempt).where(LoginAttempt.state == state).values(result=result))
            db.commit()
        message = '로그인 완료! 자취메이트 앱으로 돌아가 주세요.' if result['status'] == 'complete' else '로그인이 취소되었거나 실패했습니다. 앱에서 다시 시도하세요.'
        return HTMLResponse('<meta name="viewport" content="width=device-width"><h2>'+message+'</h2>',
                            headers={'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer'})

    @app.post('/api/v1/auth/google/poll', tags=['Google 로그인'])
    def poll(body: Poll):
        with sessions() as db:
            attempt = db.get(LoginAttempt, body.state)
            if not attempt or attempt.expires < time.time() or not secrets.compare_digest(attempt.secret_hash, digest(body.secret)):
                raise HTTPException(401, '로그인이 만료되었습니다. 다시 시도하세요.')
            result = attempt.result
            if result.get('status') not in ('complete', 'failed'):
                return {'status': 'pending'}
            removed = db.execute(delete(LoginAttempt).where(LoginAttempt.state == body.state))
            if removed.rowcount != 1:
                raise HTTPException(401, '이미 완료된 로그인입니다.')
            if result['status'] == 'failed':
                db.commit()
                return result
            token = secrets.token_urlsafe(48)
            db.add(LoginSession(token_hash=digest(token), user_id=result['user_id'], expires=int(time.time())+86400))
            db.commit()
            return {**result, 'access_token': token, 'expires_in': 86400}

    @app.post('/api/v1/auth/logout', tags=['Google 로그인'])
    def logout(body: dict):
        token = body.get('token', '')
        if not isinstance(token, str) or len(token) > 256:
            raise HTTPException(422, '잘못된 토큰입니다.')
        with sessions() as db:
            db.execute(delete(LoginSession).where(LoginSession.token_hash == digest(token)))
            db.commit()
        return {'ok': True}
