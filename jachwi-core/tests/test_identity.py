from test_core import client, A, B  # noqa: F401


def test_identity_is_authenticated_and_cannot_be_selected_by_query(client):
    assert client.get('/api/v1/me/identity').status_code == 401
    assert client.get('/api/v1/me/identity', headers={'Authorization': 'Bearer invalid'}).status_code == 401
    assert client.get('/api/v1/me/identity?user_id=demo-b', headers=A).json() == {'user_id': 'demo-a'}
    assert client.get('/api/v1/me/identity', headers=B).json() == {'user_id': 'demo-b'}
