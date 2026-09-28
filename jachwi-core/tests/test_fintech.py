from datetime import datetime
from zoneinfo import ZoneInfo
from fastapi.testclient import TestClient
from app.main import create_app
from test_core import client, A, B, TOKENS

P = datetime.now(ZoneInfo('Asia/Seoul')).strftime('%Y-%m')
ROOT='/api/v1/me/spending'
def expense(amount=800, day=None):
    return {'title':'마트', 'amount_krw':amount, 'spent_on':day or P+'-01', 'category':'groceries'}

def test_flow(client):
    client.put('/api/v1/me/onboarding', headers=A, json={'monthly_budget_krw':1000})
    before=client.get(ROOT,headers=A).json()
    assert before['suggested_budget_krw']==1000 and before['data']['budget_krw'] is None
    assert client.put(ROOT+'/budgets/'+P,headers=A,json={'budget_krw':1000}).status_code==200
    r=client.post(ROOT+'/expenses',headers=A,json=expense()); assert r.status_code==201
    eid=r.json()['id']
    assert client.get(ROOT,headers=A).json()['warning']=='near_limit'
    assert client.put(ROOT+'/expenses/'+eid,headers=A,json=expense(1200)).status_code==200
    v=client.get('/api/v1/me/dashboard',headers=A).json()
    assert v['modules']['spending']['data']['remaining_krw']==-200
    assert any(c['kind']=='budget' for c in v['cards'])
    assert 'spending' in client.get('/api/v1/me/ai-context',headers=A).json()['modules']
    assert client.delete(ROOT+'/expenses/'+eid,headers=B).status_code==404
    assert client.put(ROOT+'/expenses/'+eid,headers=B,json=expense()).status_code==404
    assert client.get(ROOT,headers=B).json()['expenses']==[]
    assert client.delete(ROOT+'/expenses/'+eid,headers=A).status_code==200
    assert client.get(ROOT,headers=A).json()['data']['spent_krw']==0

def test_validation_and_months(client):
    assert client.get(ROOT).status_code==401
    for amount in [0,-1,1.5,True,'100']:
        assert client.post(ROOT+'/expenses',headers=A,json=expense(amount)).status_code==422
    assert client.get(ROOT+'?period=2026-13',headers=A).status_code==422
    assert client.put(ROOT+'/budgets/2026-13',headers=A,json={'budget_krw':1}).status_code==422
    client.post(ROOT+'/expenses',headers=A,json=expense(200,'2020-01-01'))
    assert client.get(ROOT,headers=A).json()['data']['spent_krw']==0
    assert client.get(ROOT+'?period=2020-01',headers=A).json()['data']['spent_krw']==200
    client.put(ROOT+'/budgets/'+P,headers=A,json={'budget_krw':0})
    client.post(ROOT+'/expenses',headers=A,json=expense(1))
    assert client.get(ROOT,headers=A).json()['warning']=='exceeded'
    client.put(ROOT+'/budgets/'+P,headers=A,json={'budget_krw':None})
    assert client.get(ROOT,headers=A).json()['data']['remaining_krw'] is None

def test_persistence_and_timestamp(tmp_path):
    url=f'sqlite:///{tmp_path}/spending.db'
    with TestClient(create_app(url,tokens=TOKENS)) as c:
        c.post(ROOT+'/expenses',headers=A,json=expense())
        timestamp=c.get(ROOT,headers=A).json()['source_updated_at']
    with TestClient(create_app(url,tokens=TOKENS)) as c:
        assert c.get(ROOT,headers=A).json()['data']['spent_krw']==800
        assert c.get(ROOT,headers=A).json()['source_updated_at']==timestamp
        assert c.get('/spending').status_code==200

def test_total_limit_rollback(client):
    assert client.post(ROOT+'/expenses',headers=A,json=expense(1000000000)).status_code==201
    assert client.post(ROOT+'/expenses',headers=A,json=expense(1)).status_code==422
    assert len(client.get(ROOT,headers=A).json()['expenses'])==1

def test_onboarding_to_spending_without_losing_profile(client):
    profile = {'living_months': 8, 'cooking_days_per_week': 3,
               'cooking_tools': [], 'monthly_budget_krw': 300000,
               'region_code': '1111010100', 'priority': 'save_money',
               'initial_inventory_state': 'empty'}
    form = client.get('/api/v1/onboarding/form', headers=A).json()
    assert {f['name'] for step in form['steps'] for f in step['fields']} == set(profile)
    preview = client.post('/api/v1/me/onboarding/preview', headers=A, json=profile)
    assert preview.status_code == 200
    assert client.get('/api/v1/me/onboarding', headers=A).status_code == 404
    client.put('/api/v1/me/onboarding', headers=A, json=preview.json()['profile'])
    summary = client.get(ROOT, headers=A).json()
    assert summary['suggested_budget_krw'] == 300000
    assert summary['data']['budget_krw'] is None
    client.put(ROOT+'/budgets/'+P, headers=A, json={'budget_krw': 300000})
    updated = client.get('/api/v1/me/onboarding', headers=A).json()['profile']
    updated['monthly_budget_krw'] = 400000
    client.put('/api/v1/me/onboarding', headers=A, json=updated)
    stored = client.get('/api/v1/me/onboarding', headers=A).json()['profile']
    assert stored['cooking_tools'] == []
    assert stored['region_code'] == '1111010100'
    assert stored['living_months'] == 8
    summary = client.get(ROOT, headers=A).json()
    assert summary['suggested_budget_krw'] == 400000
    assert summary['data']['budget_krw'] == 300000
