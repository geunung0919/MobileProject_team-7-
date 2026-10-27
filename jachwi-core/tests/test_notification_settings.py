from fastapi.testclient import TestClient
import pytest
from app.main import create_app

PATH = '/api/v1/me/notification-settings'
TOKENS = {'local-demo-token-user-a': 'a', 'local-demo-token-user-b': 'b'}
A = {'Authorization': 'Bearer local-demo-token-user-a'}
B = {'Authorization': 'Bearer local-demo-token-user-b'}
OFF = dict(spending_alerts=False, inventory_alerts=False, routine_reminders=False)
ON = dict(spending_alerts=True, inventory_alerts=False, routine_reminders=True)

@pytest.fixture
def client(tmp_path):
    with TestClient(create_app(f'sqlite:///{tmp_path}/settings.db', tokens=TOKENS)) as c:
        yield c

def test_auth_default_and_isolation(client):
    assert client.get(PATH).status_code == 401
    assert client.put(PATH, json=ON).status_code == 401
    assert client.get(PATH, headers=A).json() == OFF
    assert client.put(PATH, headers=A, json=ON).json() == ON
    assert client.get(PATH, headers=A).json() == ON
    assert client.get(PATH, headers=B).json() == OFF
    assert client.get('/api/v1/me/onboarding', headers=A).status_code == 404

@pytest.mark.parametrize('invalid', [
    {}, dict(ON, spending_alerts='true'), dict(ON, spending_alerts=1),
    dict(ON, inventory_alerts=None), dict(ON, user_id='b'),
])
def test_invalid_write_preserves_settings(client, invalid):
    client.put(PATH, headers=A, json=ON)
    assert client.put(PATH, headers=A, json=invalid).status_code == 422
    assert client.get(PATH, headers=A).json() == ON

def test_restart_and_onboarding_edit_preserve_settings(tmp_path):
    url = f'sqlite:///{tmp_path}/persistent.db'
    with TestClient(create_app(url, tokens=TOKENS)) as client:
        assert client.put(PATH, headers=A, json=ON).status_code == 200
        assert client.put('/api/v1/me/onboarding', headers=A, json={'living_months': 6}).status_code == 200
    with TestClient(create_app(url, tokens=TOKENS)) as client:
        assert client.get(PATH, headers=A).json() == ON
        assert client.put(PATH, headers=A, json=OFF).json() == OFF
        assert client.get('/api/v1/me/onboarding', headers=A).json()['profile']['living_months'] == 6

def test_expo_web_preflight(client):
    response = client.options(PATH, headers={'Origin': 'http://localhost:8081',
        'Access-Control-Request-Method': 'PUT',
        'Access-Control-Request-Headers': 'authorization,content-type'})
    assert response.status_code == 200
    assert response.headers['access-control-allow-origin'] == 'http://localhost:8081'
