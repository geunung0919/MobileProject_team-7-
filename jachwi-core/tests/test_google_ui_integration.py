import time
from urllib.parse import urlparse, parse_qs
from fastapi.testclient import TestClient
from app.main import create_app
from app.google_auth import LoginAttempt, LoginSession, digest

TOKEN='test-developer-token-123456'
def client(tmp_path):
    return TestClient(create_app(database_url='sqlite:///'+str(tmp_path/'core.db'),tokens={TOKEN:'alice','other-developer-token-123':'bob'}))
def auth(token=TOKEN): return {'Authorization':'Bearer '+token}

def test_ui_ledger_inventory_and_account_isolation(tmp_path):
    with client(tmp_path) as c:
        state=c.get('/api/v1/me/ui-state',headers=auth()).json()
        state['transactions']=[dict(id='one',title='마트',amount=10000,date='2026-11-06',category='식료품')]
        state['fridgeItems']=[dict(id='milk',name='우유',amount=1,unit='개',expiry='2026-11-10')]
        response=c.put('/api/v1/me/ui-state',headers=auth(),json=state)
        assert response.status_code==200,response.text
        assert c.put('/api/v1/me/ui-state',headers=auth(),json=state).status_code==409
        assert c.get('/api/v1/me/ui-state',headers=auth('other-developer-token-123')).json()['transactions']==[]
        assert c.get('/api/v1/me/inventory',headers=auth()).json()['snapshot']['data']['items'][0]['name']=='우유'
        assert c.get('/api/v1/me/ui-state',headers=auth()).json()['transactions'][0]['amount']==10000
        assert c.get('/api/v1/me/dashboard',headers=auth()).status_code==200
        assert c.get('/api/v1/me/ui-state').status_code==401

def test_google_config_and_poll_security(tmp_path,monkeypatch):
    monkeypatch.delenv('GOOGLE_CLIENT_ID',raising=False)
    with client(tmp_path) as c:
        assert c.post('/api/v1/auth/google/start').status_code==503
        monkeypatch.setenv('GOOGLE_CLIENT_ID','client')
        monkeypatch.setenv('GOOGLE_CLIENT_SECRET','secret')
        monkeypatch.setenv('GOOGLE_REDIRECT_URI','https://example.com/api/v1/auth/google/callback')
        start=c.post('/api/v1/auth/google/start').json()
        query=parse_qs(urlparse(start['authorization_url']).query)
        assert query['state']==[start['state']]
        body={'state':start['state'],'secret':start['secret']}
        assert c.post('/api/v1/auth/google/poll',json={**body,'secret':'x'*43}).status_code==401
        assert c.post('/api/v1/auth/google/poll',json=body).json()['status']=='pending'
        with c.app.state.sessions() as db:
            row=db.get(LoginAttempt,start['state']);row.result={'status':'complete','user_id':'google:123','email':'a@example.com'};db.commit()
        result=c.post('/api/v1/auth/google/poll',json=body).json()
        assert c.post('/api/v1/auth/google/poll',json=body).status_code==401
        token=result['access_token']
        assert c.get('/api/v1/me/identity',headers=auth(token)).json()['user_id']=='google:123'
        c.post('/api/v1/auth/logout',json={'token':token})
        assert c.get('/api/v1/me/identity',headers=auth(token)).status_code==401

def test_cancelled_callback_and_expiry(tmp_path,monkeypatch):
    for k,v in [('GOOGLE_CLIENT_ID','client'),('GOOGLE_CLIENT_SECRET','secret'),('GOOGLE_REDIRECT_URI','https://example.com/callback')]:monkeypatch.setenv(k,v)
    with client(tmp_path) as c:
        data=c.post('/api/v1/auth/google/start').json()
        assert c.get('/api/v1/auth/google/callback',params={'state':data['state'],'error':'access_denied'}).status_code==200
        assert c.post('/api/v1/auth/google/poll',json={'state':data['state'],'secret':data['secret']}).json()['status']=='failed'
        assert c.get('/api/v1/auth/google/callback',params={'state':'bad','code':'bad'}).status_code==400

def test_verified_google_callback(tmp_path,monkeypatch):
    from app import google_auth
    for k,v in [('GOOGLE_CLIENT_ID','client'),('GOOGLE_CLIENT_SECRET','secret'),('GOOGLE_REDIRECT_URI','https://example.com/callback')]:monkeypatch.setenv(k,v)
    with client(tmp_path) as c:
        data=c.post('/api/v1/auth/google/start').json()
        nonce=parse_qs(urlparse(data['authorization_url']).query)['nonce'][0]
        class Response:
            def __init__(self,payload):self.payload=payload
            def raise_for_status(self):pass
            def json(self):return self.payload
        class Google:
            def __init__(self,**kwargs):pass
            async def __aenter__(self):return self
            async def __aexit__(self,*args):pass
            async def post(self,*args,**kwargs):return Response({'id_token':'verified-by-google'})
            async def get(self,*args,**kwargs):return Response({'aud':'client','iss':'https://accounts.google.com','exp':int(time.time())+300,'nonce':nonce,'email_verified':'true','sub':'123'})
        monkeypatch.setattr(google_auth.httpx,'AsyncClient',Google)
        assert c.get('/api/v1/auth/google/callback',params={'state':data['state'],'code':'code'}).status_code==200
        assert c.get('/api/v1/auth/google/callback',params={'state':data['state'],'code':'code'}).status_code==400
        result=c.post('/api/v1/auth/google/poll',json={'state':data['state'],'secret':data['secret']}).json()
        assert result['user_id']=='google:123'
        assert c.get('/api/v1/me/identity',headers=auth(result['access_token'])).status_code==200


def test_bad_inventory_does_not_partially_save(tmp_path):
    with client(tmp_path) as c:
        state=c.get('/api/v1/me/ui-state',headers=auth()).json()
        state['transactions']=[dict(id='one',title='마트',amount=10000,date='2026-11-06',category='식료품')]
        state['fridgeItems']=[dict(id='bad',name='우유',amount=-1,unit='개',expiry=None)]
        assert c.put('/api/v1/me/ui-state',headers=auth(),json=state).status_code==422
        assert c.get('/api/v1/me/ui-state',headers=auth()).json()['transactions']==[]
