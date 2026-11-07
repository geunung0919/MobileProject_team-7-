from fastapi.testclient import TestClient
from app.main import create_app

PREFLIGHT = {'Access-Control-Request-Method': 'GET', 'Access-Control-Request-Headers': 'Authorization'}

def make(tmp_path):
    return TestClient(create_app(database_url='sqlite:///' + str(tmp_path / 'core.db'), tokens={}))

def test_regex_unset_keeps_listed_origins_only(tmp_path, monkeypatch):
    monkeypatch.delenv('CORS_ORIGIN_REGEX', raising=False)
    with make(tmp_path) as c:
        ok = c.options('/api/v1/me/identity', headers={'Origin': 'http://localhost:8081', **PREFLIGHT})
        assert ok.headers.get('access-control-allow-origin') == 'http://localhost:8081'
        bad = c.options('/api/v1/me/identity', headers={'Origin': 'https://snack-web.expo.dev', **PREFLIGHT})
        assert 'access-control-allow-origin' not in bad.headers

def test_regex_allows_matching_origin_only(tmp_path, monkeypatch):
    monkeypatch.setenv('CORS_ORIGIN_REGEX', r'^https://([a-z0-9-]+\.)*expo\.dev$')
    with make(tmp_path) as c:
        ok = c.options('/api/v1/me/identity', headers={'Origin': 'https://snack-web.expo.dev', **PREFLIGHT})
        assert ok.headers.get('access-control-allow-origin') == 'https://snack-web.expo.dev'
        bad = c.options('/api/v1/me/identity', headers={'Origin': 'https://expo.dev.evil.com', **PREFLIGHT})
        assert 'access-control-allow-origin' not in bad.headers
