"""AC-05~09, AC-11 검수 기준 테스트 (요구사항 시트)."""
import time
from urllib.parse import urlparse, parse_qs
from concurrent.futures import ThreadPoolExecutor
import pytest
from fastapi.testclient import TestClient
from app.main import create_app
from app.account import normalize_nickname, search_regions, region_info, MemberRow
from app.google_auth import LoginAttempt, LoginSession, digest

ALICE, BOB = 'alice-developer-token-1234', 'bob-developer-token-123456'

def make(tmp_path):
    return TestClient(create_app(database_url='sqlite:///' + str(tmp_path / 'core.db'), tokens={ALICE: 'alice', BOB: 'bob'}))

def auth(token):
    return {'Authorization': 'Bearer ' + token}

# ---- AC-06 닉네임 규칙 ----
@pytest.mark.parametrize('raw', ['가', 'a', '가나다라마바사아자차카', 'abcdefghijk', '자취!', 'jachwi_1', '자 취', '😀😀', 'ㄱㄴ', ''])
def test_nickname_rejected(raw):
    assert normalize_nickname(raw)[0] is None

@pytest.mark.parametrize('raw,expected', [('자취', '자취'), ('ab', 'ab'), ('가나다라마바사아자차', '가나다라마바사아자차'),
                                          ('Jachwi2026', 'Jachwi2026'), ('  자취메이트  ', '자취메이트')])
def test_nickname_accepted_and_trimmed(raw, expected):
    assert normalize_nickname(raw)[0] == expected

# ---- AC-05, AC-07 프로필·중복 ----
def test_profile_create_edit_and_duplicate(tmp_path):
    with make(tmp_path) as c:
        assert c.get('/api/v1/me/member', headers=auth(ALICE)).status_code == 404
        saved = c.put('/api/v1/me/member', headers=auth(ALICE), json={'nickname': ' 자취왕 '})
        assert saved.status_code == 200 and saved.json()['nickname'] == '자취왕'
        # 내 기존 닉네임은 계속 사용 가능, 다른 사람에게는 중복
        assert c.get('/api/v1/nicknames/availability', params={'nickname': '자취왕'}, headers=auth(ALICE)).json()['available']
        taken = c.get('/api/v1/nicknames/availability', params={'nickname': '자취왕'}, headers=auth(BOB)).json()
        assert taken['valid'] and not taken['available']
        bad = c.get('/api/v1/nicknames/availability', params={'nickname': '자취!'}, headers=auth(BOB)).json()
        assert not bad['valid']
        assert c.put('/api/v1/me/member', headers=auth(BOB), json={'nickname': '자취왕'}).status_code == 409
        # 영문 대소문자는 같은 닉네임으로 본다
        c.put('/api/v1/me/member', headers=auth(ALICE), json={'nickname': 'Mate'})
        assert c.put('/api/v1/me/member', headers=auth(BOB), json={'nickname': 'mate'}).status_code == 409
        # 수정값은 다시 조회해도 유지 (재로그인 = 같은 사용자로 재조회)
        assert c.get('/api/v1/me/member', headers=auth(ALICE)).json()['nickname'] == 'Mate'
        assert c.put('/api/v1/me/member', headers=auth(ALICE), json={'nickname': '자'}).status_code == 422

def test_simultaneous_signup_cannot_share_nickname(tmp_path):
    with make(tmp_path) as c:
        def save(token):
            return c.put('/api/v1/me/member', headers=auth(token), json={'nickname': '동시가입'}).status_code
        with ThreadPoolExecutor(2) as pool:
            codes = sorted(pool.map(save, [ALICE, BOB]))
        assert codes == [200, 409]
        with c.app.state.sessions() as db:
            assert db.query(MemberRow).filter(MemberRow.nickname_key == '동시가입').count() == 1

# ---- AC-08, AC-09 지역 ----
def test_region_search_without_gps_and_duplicate_names():
    hits = search_regions('청운동')
    assert hits and hits[0]['label'] == '서울특별시 종로구 청운동'
    gyo = search_regions('교동')
    labels = [h['label'] for h in gyo if h['dong'] == '교동']
    assert len(labels) >= 2 and len(set(labels)) == len(labels)  # 같은 동 이름이 상위 지역으로 구분됨
    assert search_regions('종로구 청운') == [region_info('1111010100')]
    assert search_regions('') == []

def test_region_data_reflects_2026_changes():
    assert region_info('1111010100')['label'] == '서울특별시 종로구 청운동'
    assert any(h['sido'] == '강원특별자치도' for h in search_regions('춘천시'))
    assert any(h['sigungu'] == '군위군' and h['sido'] == '대구광역시' for h in search_regions('군위군'))

def test_region_save_change_and_restore(tmp_path):
    with make(tmp_path) as c:
        c.put('/api/v1/me/onboarding', headers=auth(ALICE), json={'initial_inventory_state': 'not_entered'})
        bad = c.put('/api/v1/me/member', headers=auth(ALICE), json={'nickname': '자취', 'region_code': '1111099999'})
        assert bad.status_code == 422
        ri = c.put('/api/v1/me/member', headers=auth(ALICE), json={'nickname': '자취', 'region_code': '1111000000'})
        assert ri.status_code == 422  # 시군구 코드는 읍·면·동이 아님
        first = c.put('/api/v1/me/member', headers=auth(ALICE), json={'nickname': '자취', 'region_code': '1111010100'}).json()
        assert first['region']['label'] == '서울특별시 종로구 청운동' and first['region_changed']
        same = c.put('/api/v1/me/member', headers=auth(ALICE), json={'nickname': '자취', 'region_code': '1111010100'}).json()
        assert not same['region_changed']
        assert c.get('/api/v1/me/onboarding', headers=auth(ALICE)).json()['profile']['region_code'] == '1111010100'
        moved = c.put('/api/v1/me/member', headers=auth(ALICE), json={'nickname': '자취', 'region_code': '3611010100'}).json()
        assert moved['region_changed'] and moved['region']['sido'] == '세종특별자치시'
        # 다시 접속(재조회)해도 바뀐 지역이 복원되고, 지역 의존 정보 기준(온보딩 region_code)도 새 지역
        assert c.get('/api/v1/me/member', headers=auth(ALICE)).json()['region']['code'] == '3611010100'
        assert c.get('/api/v1/me/onboarding', headers=auth(ALICE)).json()['profile']['region_code'] == '3611010100'
        found = c.get('/api/v1/regions/search', params={'q': '반곡동'}).json()['items']
        assert '3611010100' in [h['code'] for h in found] and len({h['label'] for h in found}) == len(found)

# ---- AC-11 탈퇴 ----
@pytest.fixture
def google_env(monkeypatch):
    monkeypatch.setenv('GOOGLE_CLIENT_ID', 'client')
    monkeypatch.setenv('GOOGLE_CLIENT_SECRET', 'secret')
    monkeypatch.setenv('GOOGLE_REDIRECT_URI', 'https://example.com/api/v1/auth/google/callback')

def google_login(c, sub='123'):
    token = 'google-session-token-' + sub + 'x' * 30
    with c.app.state.sessions() as db:
        db.add(LoginSession(token_hash=digest(token), user_id='google:' + sub, expires=int(time.time()) + 3600))
        db.commit()
    return token

def finish_reauth(c, state, **result):
    with c.app.state.sessions() as db:
        row = db.get(LoginAttempt, state)
        row.result = {'status': 'complete', 'user_id': 'google:123', 'auth_time': int(time.time()), **result}
        db.commit()

def test_withdrawal_requires_fresh_google_reauth_and_deletes_everything(tmp_path, google_env):
    with make(tmp_path) as c:
        assert c.post('/api/v1/me/withdrawal/start', headers=auth(ALICE)).status_code == 403  # 개발 계정
        token = google_login(c)
        c.put('/api/v1/me/member', headers=auth(token), json={'nickname': '탈퇴예정', 'region_code': '1111010100'})
        c.put('/api/v1/me/onboarding', headers=auth(token), json={'monthly_budget_krw': 300000})
        state = c.get('/api/v1/me/ui-state', headers=auth(token)).json()
        state['transactions'] = [dict(id='t', title='마트', amount=1000, date='2026-11-06', category='식료품')]
        assert c.put('/api/v1/me/ui-state', headers=auth(token), json=state).status_code == 200
        start = c.post('/api/v1/me/withdrawal/start', headers=auth(token)).json()
        assert parse_qs(urlparse(start['authorization_url']).query)['max_age'] == ['0']
        body = {'state': start['state'], 'secret': start['secret']}
        assert c.post('/api/v1/me/withdrawal/confirm', headers=auth(token), json=body).json()['status'] == 'pending'
        assert c.post('/api/v1/me/withdrawal/confirm', headers=auth(token), json={**body, 'secret': 'y' * 43}).status_code == 401
        finish_reauth(c, start['state'])
        done = c.post('/api/v1/me/withdrawal/confirm', headers=auth(token), json=body).json()
        assert done['status'] == 'deleted' and done['deleted']['core_members'] == 1 and done['deleted']['login_sessions'] >= 1
        # 탈퇴 후 세션으로는 아무것도 볼 수 없음, 닉네임도 다시 사용 가능
        assert c.get('/api/v1/me/member', headers=auth(token)).status_code == 401
        assert c.get('/api/v1/nicknames/availability', params={'nickname': '탈퇴예정'}, headers=auth(BOB)).json()['available']
        assert c.post('/api/v1/me/withdrawal/confirm', headers=auth(BOB), json=body).status_code == 401

def test_withdrawal_rejects_other_account_stale_auth_and_other_users_state(tmp_path, google_env):
    with make(tmp_path) as c:
        token = google_login(c)
        c.put('/api/v1/me/member', headers=auth(token), json={'nickname': '남는계정'})
        start = c.post('/api/v1/me/withdrawal/start', headers=auth(token)).json()
        body = {'state': start['state'], 'secret': start['secret']}
        assert c.post('/api/v1/me/withdrawal/confirm', headers=auth(BOB), json=body).status_code == 401
        finish_reauth(c, start['state'], user_id='google:999')
        assert c.post('/api/v1/me/withdrawal/confirm', headers=auth(token), json=body).status_code == 403
        start = c.post('/api/v1/me/withdrawal/start', headers=auth(token)).json()
        finish_reauth(c, start['state'], auth_time=int(time.time()) - 3600)
        stale = c.post('/api/v1/me/withdrawal/confirm', headers=auth(token), json={'state': start['state'], 'secret': start['secret']})
        assert stale.status_code == 403
        start = c.post('/api/v1/me/withdrawal/start', headers=auth(token)).json()
        with c.app.state.sessions() as db:
            row = db.get(LoginAttempt, start['state']); row.result = {'status': 'failed'}; db.commit()
        failed = c.post('/api/v1/me/withdrawal/confirm', headers=auth(token), json={'state': start['state'], 'secret': start['secret']})
        assert failed.json()['status'] == 'failed'
        assert c.get('/api/v1/me/member', headers=auth(token)).json()['nickname'] == '남는계정'
