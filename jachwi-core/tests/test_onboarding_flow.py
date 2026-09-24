from fastapi.testclient import TestClient
import pytest
from app.main import create_app
from app.schemas import Onboarding
from app.services import diagnose

TOKEN = {'Authorization': 'Bearer local-demo-token-user-a'}
PATH = '/api/v1/me/onboarding'

@pytest.fixture
def client(tmp_path):
    with TestClient(create_app(f'sqlite:///{tmp_path}/flow.db',
                              tokens={'local-demo-token-user-a': 'demo-a'})) as c:
        yield c

def test_preview_and_cancel_do_not_save(client):
    draft = {'living_months': 2, 'initial_inventory_state': 'needs_registration',
             'priority': 'reduce_waste'}
    assert client.post(PATH + '/preview', json=draft).status_code == 401
    preview = client.post(PATH + '/preview', headers=TOKEN, json=draft)
    assert preview.status_code == 200
    assert preview.json()['saved'] is False
    assert preview.json()['actions'][0]['owner_module'] == 3
    assert client.get(PATH, headers=TOKEN).status_code == 404
    client.put(PATH, headers=TOKEN, json=draft)
    client.post(PATH + '/preview', headers=TOKEN, json={'living_months': 24})
    assert client.get(PATH, headers=TOKEN).json()['profile']['living_months'] == 2

def test_edit_recalculates_every_read_without_overwriting_modules(client):
    first = {'living_months': 2, 'cooking_tools': ['microwave'], 'cooking_days_per_week': 2}
    client.put(PATH, headers=TOKEN, json=first)
    changed = dict(first, living_months=6, cooking_tools=[], cooking_days_per_week=3,
                   monthly_budget_krw=0, initial_inventory_state='empty')
    saved = client.put(PATH, headers=TOKEN, json=changed).json()
    assert saved['diagnosis']['experience'] == 'experienced'
    assert saved['diagnosis']['cooking_environment'] == 'no_tools'
    assert saved['diagnosis']['cooking_frequency'] == 'regular'
    assert client.get(PATH, headers=TOKEN).json() == saved
    dashboard = client.get('/api/v1/me/dashboard', headers=TOKEN).json()
    assert dashboard['diagnosis'] == saved['diagnosis']
    assert dashboard['modules']['spending'] is None
    ai = client.get('/api/v1/me/ai-context', headers=TOKEN).json()
    assert ai['preferences']['cooking_tools'] == []
    assert ai['preferences']['monthly_budget_krw'] == 0

@pytest.mark.parametrize('invalid', [
    {'monthly_budget_krw': -1}, {'cooking_tools': ['none', 'microwave']},
    {'region_code': '１２３４５６７８９０'}, {'cooking_tools': ['stove', 'stove']},
])
def test_failed_edit_keeps_previous_profile(client, invalid):
    old = client.put(PATH, headers=TOKEN, json={'living_months': 2}).json()
    assert client.put(PATH, headers=TOKEN, json=invalid).status_code == 422
    assert client.post(PATH + '/preview', headers=TOKEN, json=invalid).status_code == 422
    assert client.get(PATH, headers=TOKEN).json() == old

@pytest.mark.parametrize('state', ['not_entered', 'empty', 'needs_registration'])
def test_inventory_intent_and_action_links(client, state):
    body = {'initial_inventory_state': state, 'monthly_budget_krw': 0}
    result = client.post(PATH + '/preview', headers=TOKEN, json=body).json()
    assert ('register_inventory' in result['diagnosis']['suggested_actions']) == (state == 'needs_registration')
    assert ('initial_inventory_state' in result['diagnosis']['missing_fields']) == (state == 'not_entered')
    assert any(a['code'] == 'register_inventory' for a in result['actions']) == (state == 'needs_registration')
    assert any(a['code'] == 'view_budget' for a in result['actions'])
    assert all(a['target'] in ['/spending', '/inventory', '/routines'] for a in result['actions'])

def test_skip_and_full_replacement(client):
    client.put(PATH, headers=TOKEN, json={'living_months': 12, 'cooking_tools': []})
    result = client.put(PATH, headers=TOKEN, json={}).json()
    assert result['profile']['living_months'] is None
    assert result['diagnosis']['cooking_environment'] == 'unknown'
    assert diagnose(Onboarding(living_months=5, cooking_days_per_week=2)).experience == 'new'

def test_browser_can_preflight_preview(client):
    response = client.options(PATH + '/preview', headers={
        'Origin': 'http://localhost:5173', 'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'authorization,content-type'})
    assert response.status_code == 200
