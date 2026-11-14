from fastapi.testclient import TestClient
from app.main import create_app
from app.onboarding_form import get_onboarding_form
from app.schemas import Onboarding


def test_form_covers_contract_without_duplicate_fields():
    form = get_onboarding_form()
    fields = [f for step in form.steps for f in step.fields]
    assert len(fields) == len({f.name for f in fields})
    assert {f.name for f in fields} == set(Onboarding.model_fields)
    assert form.input_schema == Onboarding.model_json_schema()
    skipped = Onboarding.model_validate({f.name: f.skip_value for f in fields})
    assert skipped.cooking_tools is None
    assert skipped.initial_inventory_state == 'not_entered'


def test_every_displayed_option_is_valid_and_complete():
    form = get_onboarding_form()
    for step in form.steps:
        for field in step.fields:
            if not field.option_labels:
                continue
            schema = form.input_schema['properties'][field.name]
            if 'anyOf' in schema:
                schema = next(s for s in schema['anyOf'] if s.get('type') != 'null')
            expected = schema['items']['enum'] if field.widget == 'multi_select' else schema['enum']
            assert set(field.option_labels) == set(expected)
            for option in field.option_labels:
                value = [option] if field.widget == 'multi_select' else option
                Onboarding.model_validate({field.name: value})
            if field.empty_label:
                assert Onboarding.model_validate({field.name: []}).cooking_tools == []


def test_form_endpoint_requires_auth_and_does_not_create_profile(tmp_path):
    with TestClient(create_app(f'sqlite:///{tmp_path}/form.db',
                              tokens={'local-demo-token-user-a': 'demo-a'})) as client:
        headers = {'Authorization': 'Bearer local-demo-token-user-a'}
        assert client.get('/api/v1/onboarding/form').status_code == 401
        response = client.get('/api/v1/onboarding/form', headers=headers)
        assert response.status_code == 200
        assert len(response.json()['steps']) == 4
        assert response.json()['input_schema']['properties']['monthly_budget_krw']['anyOf'][0]['minimum'] == 0
        assert client.get('/api/v1/me/onboarding', headers=headers).status_code == 404
