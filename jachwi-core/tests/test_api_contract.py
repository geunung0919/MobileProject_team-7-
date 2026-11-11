"""docs/API_CONTRACT.md 의 [현재] 규칙이 실제 서버 동작과 맞는지 확인한다."""
from datetime import datetime, timedelta, timezone
import pytest
from fastapi.testclient import TestClient
from app.main import create_app

A = {'Authorization': 'Bearer contract-token-user-a'}
TOKENS = {'contract-token-user-a': 'contract-a'}


@pytest.fixture
def client(tmp_path):
    app = create_app(f'sqlite:///{tmp_path}/test.db', tokens=TOKENS, demo_enabled=True)
    with TestClient(app) as c:
        yield c


def error_shape(response, status):
    assert response.status_code == status
    body = response.json()
    assert set(body) == {'error'}
    assert isinstance(body['error']['code'], str) and isinstance(body['error']['message'], str)
    return body['error']


# 2장 인증
def test_missing_or_wrong_token_is_401_with_error_shape(client):
    error_shape(client.get('/api/v1/me/dashboard'), 401)
    error_shape(client.get('/api/v1/me/dashboard', headers={'Authorization': 'Bearer wrong-token-0000000'}), 401)


def test_user_id_comes_from_token_not_body(client):
    assert client.get('/api/v1/me/identity', headers=A).json() == {'user_id': 'contract-a'}
    error = error_shape(client.put('/api/v1/me/onboarding', headers=A, json={'user_id': 'someone-else'}), 422)
    assert error['code'] == 'VALIDATION_ERROR'


# 3·4장 공통 규칙과 오류 응답
def test_validation_error_lists_fields(client):
    error = error_shape(client.put('/api/v1/me/onboarding', headers=A, json={'monthly_budget_krw': '500000'}), 422)
    assert error['code'] == 'VALIDATION_ERROR'
    assert any(d['field'].endswith('monthly_budget_krw') for d in error['details'])


def test_not_found_before_onboarding(client):
    error_shape(client.get('/api/v1/me/onboarding', headers=A), 404)


def test_snapshot_requires_timezone(client):
    body = {'source_updated_at': '2026-11-11T10:00:00',
            'data': {'period': '2026-11', 'budget_krw': None, 'spent_krw': 0, 'remaining_krw': None}}
    error_shape(client.put('/api/v1/dev/me/modules/spending', headers=A, json=body), 422)


# 5-1장 소비: 예산 미설정이면 잔액도 null
def test_spending_remaining_must_be_null_without_budget(client):
    now = datetime.now(timezone.utc)
    body = {'source_updated_at': now.isoformat(),
            'data': {'period': now.strftime('%Y-%m'), 'budget_krw': None, 'spent_krw': 1000, 'remaining_krw': 0}}
    error_shape(client.put('/api/v1/dev/me/modules/spending', headers=A, json=body), 422)


# 5-2장 재고: revision 충돌은 409
def test_inventory_revision_conflict(client):
    item = {'item_id': 'egg-1', 'name': '계란', 'quantity': 10, 'unit': 'piece', 'storage': 'fridge',
            'target_date': None, 'date_source': 'unknown'}
    first = client.put('/api/v1/me/inventory', headers=A, json={'expected_revision': 0, 'data': {'items': [item]}})
    assert first.status_code == 200 and first.json()['revision'] == 1
    error_shape(client.put('/api/v1/me/inventory', headers=A, json={'expected_revision': 0, 'data': {'items': []}}), 409)


def test_inventory_date_and_source_go_together(client):
    item = {'item_id': 'tofu', 'name': '두부', 'quantity': 1, 'unit': 'piece', 'storage': 'fridge',
            'target_date': '2026-11-20', 'date_source': 'unknown'}
    error_shape(client.put('/api/v1/me/inventory', headers=A, json={'expected_revision': 0, 'data': {'items': [item]}}), 422)


# 6장 통합 조회
def test_dashboard_status_and_cards(client):
    view = client.get('/api/v1/me/dashboard', headers=A).json()
    assert view['module_status'] == {'spending': 'missing', 'inventory': 'missing', 'life': 'missing'}
    assert view['cards'] == [{'kind': 'onboarding', 'title': '생활 설정을 입력해 주세요', 'target': '/onboarding'}]

    old = datetime.now(timezone.utc) - timedelta(hours=25)
    client.put('/api/v1/dev/me/modules/life', headers=A, json={'source_updated_at': old.isoformat(),
               'data': {'routines': [], 'exhausted': False}})
    assert client.get('/api/v1/me/dashboard', headers=A).json()['module_status']['life'] == 'stale'


def test_ai_context_hides_private_fields_and_unavailable_modules(client):
    client.put('/api/v1/me/onboarding', headers=A, json={'living_months': 3, 'region_code': '1111010100',
                                                        'priority': 'save_money'})
    old = datetime.now(timezone.utc) - timedelta(hours=25)
    client.put('/api/v1/dev/me/modules/life', headers=A, json={'source_updated_at': old.isoformat(),
               'data': {'routines': [], 'exhausted': False}})
    context = client.get('/api/v1/me/ai-context', headers=A).json()
    assert context['schema_version'] == '1.0'
    assert 'region_code' not in context['preferences'] and 'living_months' not in context['preferences']
    assert context['preferences']['priority'] == 'save_money'
    assert context['module_status']['life'] == 'stale'
    assert context['modules'] == {}
    assert '데이터가 없으면 추측하지 마세요.' in context['constraints']
