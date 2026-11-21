"""아이폰 사파리처럼 같은 Wi-Fi 의 PC IP 로 연 웹 앱에서 OCR 서버를 부를 수 있는지 (CORS)."""
from fastapi.testclient import TestClient

from app.main import create_app

TOKENS = {'local-demo-token-user-a': 'demo-a'}


def preflight(client, origin):
    return client.options('/api/v1/me/spending/receipts/analyze', headers={
        'Origin': origin, 'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'authorization,content-type'})


def test_lan_web_app_origins_are_allowed_in_development(tmp_path, monkeypatch):
    monkeypatch.delenv('CORS_ALLOW_PRIVATE_NETWORK', raising=False)
    with TestClient(create_app(f'sqlite:///{tmp_path}/a.db', tokens=TOKENS)) as client:
        for origin in ['http://192.168.0.15:8081', 'http://10.0.0.7:8081', 'http://172.20.1.2:19006', 'http://localhost:8081']:
            response = preflight(client, origin)
            assert response.status_code == 200, origin
            assert response.headers['access-control-allow-origin'] == origin
        for origin in ['http://evil.example.com', 'http://192.168.0.15.evil.com:8081', 'http://8.8.8.8:8081', 'http://172.32.0.1:8081']:
            assert 'access-control-allow-origin' not in preflight(client, origin).headers, origin


def test_private_network_origins_can_be_turned_off(tmp_path, monkeypatch):
    monkeypatch.setenv('CORS_ALLOW_PRIVATE_NETWORK', 'false')
    with TestClient(create_app(f'sqlite:///{tmp_path}/b.db', tokens=TOKENS)) as client:
        assert 'access-control-allow-origin' not in preflight(client, 'http://192.168.0.15:8081').headers
        assert preflight(client, 'http://localhost:8081').headers['access-control-allow-origin'] == 'http://localhost:8081'
