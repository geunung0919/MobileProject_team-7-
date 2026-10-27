from datetime import date
import pytest
from fastapi.testclient import TestClient
from app.main import create_app

A = {'Authorization': 'Bearer inventory-test-token-a'}
B = {'Authorization': 'Bearer inventory-test-token-b'}
TOKENS = {'inventory-test-token-a': 'a', 'inventory-test-token-b': 'b'}

@pytest.fixture
def client(tmp_path):
    with TestClient(create_app(f'sqlite:///{tmp_path}/inventory.db', tokens=TOKENS)) as client:
        yield client

def body(revision=0):
    return {'expected_revision': revision, 'data': {'items': [{
        'item_id': 'egg', 'name': '계란', 'quantity': 3, 'unit': 'piece',
        'storage': 'fridge', 'target_date': date.today().isoformat(), 'date_source': 'label',
    }]}}

def test_inventory_reaches_dashboard_and_ai(client):
    assert client.get('/api/v1/me/inventory', headers=A).status_code == 404
    assert client.get('/api/v1/me/dashboard', headers=A).json()['module_status']['inventory'] == 'missing'
    response = client.put('/api/v1/me/inventory', headers=A, json=body())
    assert response.status_code == 200
    assert response.json()['revision'] == 1
    state = client.get('/api/v1/me/inventory', headers=A).json()
    assert state == response.json()
    for path in ('dashboard', 'ai-context'):
        view = client.get('/api/v1/me/' + path, headers=A).json()
        assert view['module_status']['inventory'] == 'available'
        assert view['modules']['inventory']['data']['items'][0]['quantity'] == 3

def test_account_isolation_and_auth(client):
    assert client.put('/api/v1/me/inventory', json=body()).status_code == 401
    assert client.put('/api/v1/me/inventory', headers=A, json=body()).status_code == 200
    assert client.get('/api/v1/me/inventory', headers=B).status_code == 404
    assert client.put('/api/v1/me/inventory', headers=B, json=body(1)).status_code == 409
    assert client.put('/api/v1/me/inventory', headers=B, json=body()).status_code == 200

def test_old_revision_cannot_overwrite_and_empty_is_saved(client):
    assert client.put('/api/v1/me/inventory', headers=A, json=body()).status_code == 200
    assert client.put('/api/v1/me/inventory', headers=A, json=body()).status_code == 409
    empty = {'expected_revision': 1, 'data': {'items': []}}
    assert client.put('/api/v1/me/inventory', headers=A, json=empty).json()['revision'] == 2
    assert client.put('/api/v1/me/inventory', headers=A, json=body(1)).status_code == 409
    assert client.get('/api/v1/me/inventory', headers=A).json()['snapshot']['data']['items'] == []
    assert client.get('/api/v1/me/dashboard', headers=A).json()['module_status']['inventory'] == 'available'

@pytest.mark.parametrize('change', ['unit', 'duplicate', 'date', 'revision', 'owner'])
def test_invalid_input_is_atomic(client, change):
    payload = body()
    if change == 'unit': payload['data']['items'][0]['unit'] = '모'
    if change == 'duplicate': payload['data']['items'] *= 2
    if change == 'date': payload['data']['items'][0]['target_date'] = None
    if change == 'revision': payload['expected_revision'] = True
    if change == 'owner': payload['user_id'] = 'b'
    assert client.put('/api/v1/me/inventory', headers=A, json=payload).status_code == 422
    assert client.get('/api/v1/me/inventory', headers=A).status_code == 404

def test_restart_persistence(tmp_path):
    url = f'sqlite:///{tmp_path}/persist.db'
    with TestClient(create_app(url, tokens=TOKENS)) as client:
        assert client.put('/api/v1/me/inventory', headers=A, json=body()).status_code == 200
    with TestClient(create_app(url, tokens=TOKENS)) as client:
        assert client.get('/api/v1/me/inventory', headers=A).json()['revision'] == 1
