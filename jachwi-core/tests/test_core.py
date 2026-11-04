from datetime import datetime, timedelta, timezone
import pytest
from fastapi.testclient import TestClient
from app.main import create_app
from app.schemas import Onboarding, InventorySnapshot, SpendingSnapshot
from app.services import diagnose, integrate

A = {'Authorization': 'Bearer local-demo-token-user-a'}
B = {'Authorization': 'Bearer local-demo-token-user-b'}
TOKENS = {'local-demo-token-user-a': 'demo-a', 'local-demo-token-user-b': 'demo-b'}

@pytest.fixture
def client(tmp_path):
    app = create_app(f'sqlite:///{tmp_path}/test.db', tokens=TOKENS, demo_enabled=True)
    with TestClient(app) as c:
        yield c

def spending(at=None, spent=120):
    now = at or datetime.now(timezone.utc)
    return {'source_updated_at': now.isoformat(), 'data': {'period': now.strftime('%Y-%m'), 'budget_krw': 100,
            'spent_krw': spent, 'remaining_krw': 100-spent}}

def test_auth_and_isolation(client):
    assert client.get('/api/v1/me/dashboard').status_code == 401
    assert client.put('/api/v1/me/onboarding', headers=A, json={'monthly_budget_krw': 300000}).status_code == 200
    assert client.get('/api/v1/me/onboarding', headers=B).status_code == 404
    client.put('/api/v1/dev/me/modules/spending', headers=A, json=spending())
    assert client.get('/api/v1/me/dashboard', headers=B).json()['module_status']['spending'] == 'missing'

def test_unknown_is_not_zero(client):
    data = client.put('/api/v1/me/onboarding', headers=A, json={}).json()
    assert data['diagnosis']['cooking_environment'] == 'unknown'
    assert data['profile']['monthly_budget_krw'] is None
    result = diagnose(Onboarding(cooking_tools=[], monthly_budget_krw=0))
    assert result.cooking_environment == 'no_tools'
    assert 'set_budget' not in result.suggested_actions

@pytest.mark.parametrize('body', [
    {'monthly_budget_krw': -1}, {'monthly_budget_krw': '100'}, {'monthly_budget_krw': True},
    {'cooking_days_per_week': 8}, {'user_id': 'victim'}, {'region_code': '123'},
    {'cooking_tools': ['stove','stove']},
])
def test_invalid_onboarding(client, body):
    assert client.put('/api/v1/me/onboarding', headers=A, json=body).status_code == 422

def test_snapshot_idempotency_and_order(client):
    body = spending()
    path = '/api/v1/dev/me/modules/spending'
    assert client.put(path, headers=A, json=body).status_code == 200
    assert client.put(path, headers=A, json=body).status_code == 200
    conflict = spending(datetime.fromisoformat(body['source_updated_at']), spent=130)
    assert client.put(path, headers=A, json=conflict).status_code == 409
    assert client.put(path, headers=A, json=spending(datetime.now(timezone.utc)-timedelta(days=1))).status_code == 409
    assert client.put(path, headers=A, json=spending(datetime.now(timezone.utc)+timedelta(days=1))).status_code == 422
    view = client.get('/api/v1/me/dashboard', headers=A).json()
    assert view['modules']['spending']['data']['spent_krw'] == 120

def test_invalid_balance_and_naive_time(client):
    body = spending()
    body['data']['remaining_krw'] = 999
    assert client.put('/api/v1/dev/me/modules/spending', headers=A, json=body).status_code == 422
    body = spending(datetime(2026, 9, 1))
    assert client.put('/api/v1/dev/me/modules/spending', headers=A, json=body).status_code == 422

def test_stale_data_excluded_from_ai(client):
    body = spending(datetime.now(timezone.utc)-timedelta(days=2))
    client.put('/api/v1/dev/me/modules/spending', headers=A, json=body)
    client.put('/api/v1/me/onboarding', headers=A, json={'region_code': '1111010100'})
    view = client.get('/api/v1/me/ai-context', headers=A).json()
    assert view['module_status']['spending'] == 'stale'
    assert 'spending' not in view['modules']
    assert 'region_code' not in view['preferences']

def test_korea_date_and_estimate_label():
    now = datetime(2026, 9, 21, 16, 0, tzinfo=timezone.utc) # 한국 9/22
    inventory = InventorySnapshot(source_updated_at=now, data={'items': [
        {'item_id': 'egg', 'name': '계란', 'quantity': 2, 'unit': 'piece', 'storage': 'fridge',
         'target_date': '2026-09-22', 'date_source': 'estimate'}]})
    view = integrate(None, {'spending': None, 'inventory': inventory, 'life': None}, now)
    assert '추정 소진일 D-0' in view.cards[1].title

def test_old_period_even_if_fresh():
    now = datetime(2026, 9, 21, tzinfo=timezone.utc)
    body = spending(now)
    body['data']['period'] = '2026-08'
    view = integrate(None, {'spending': SpendingSnapshot(**body), 'inventory': None, 'life': None}, now)
    assert view.module_status['spending'] == 'stale'
    assert not any(c.kind == 'budget' for c in view.cards)

def test_persistence_across_restart(tmp_path):
    url = f'sqlite:///{tmp_path}/persistent.db'
    with TestClient(create_app(url, tokens=TOKENS)) as c:
        c.put('/api/v1/me/onboarding', headers=A, json={'living_months': 2})
        assert c.put('/api/v1/dev/me/modules/spending', headers=A, json=spending()).status_code == 404
    with TestClient(create_app(url, tokens=TOKENS)) as c:
        assert c.get('/api/v1/me/onboarding', headers=A).json()['profile']['living_months'] == 2

def test_life_and_inventory_integration(client):
    now = datetime.now(timezone.utc).isoformat()
    inventory = {'source_updated_at': now, 'data': {'items': []}}
    life = {'source_updated_at': now, 'data': {'routines': [
        {'routine_id':'r1','title':'분리배출','due_date':'2020-01-01','completed':False}], 'exhausted':True}}
    assert client.put('/api/v1/dev/me/modules/inventory', headers=A, json=inventory).status_code == 200
    assert client.put('/api/v1/dev/me/modules/life', headers=A, json=life).status_code == 200
    view = client.get('/api/v1/me/dashboard', headers=A).json()
    assert view['module_status']['inventory'] == 'available'
    assert any(c['title'] == '분리배출' for c in view['cards'])
