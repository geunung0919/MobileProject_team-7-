"""임시 DB에서 중앙 코어 연동을 검사한다. 기존 DB는 수정하지 않는다."""
import argparse
from datetime import datetime, timedelta, timezone
from pathlib import Path
import sys
from tempfile import TemporaryDirectory
from zoneinfo import ZoneInfo
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from fastapi.testclient import TestClient
from app.main import create_app

CASES = ('normal', 'missing', 'stale', 'empty')
TOKENS = {f'local-lab-token-{case}': f'lab-{case}' for case in CASES}

def request(client, case, method, path, body=None):
    r = client.request(method, '/api/v1/' + path,
        headers={'Authorization': f'Bearer local-lab-token-{case}'},
        **({'json': body} if body is not None else {}))
    r.raise_for_status()
    return r.json()

def require(condition, message):
    if not condition:
        raise RuntimeError(message)

def seed_and_check(app):
    now = datetime.now(timezone.utc)
    today = now.astimezone(ZoneInfo('Asia/Seoul')).date()
    modules = {
        'spending': {'period': today.strftime('%Y-%m'), 'budget_krw': 300000, 'spent_krw': 315000, 'remaining_krw': -15000},
        'inventory': {'items': [{'item_id': 'egg', 'name': '계란', 'quantity': 3, 'unit': 'piece', 'storage': 'fridge', 'target_date': today.isoformat(), 'date_source': 'estimate'}]},
        'life': {'routines': [{'routine_id': 'trash', 'title': '분리배출', 'due_date': today.isoformat(), 'completed': False}], 'exhausted': False},
    }
    empty = {
        'spending': {'period': today.strftime('%Y-%m'), 'budget_krw': None, 'spent_krw': 0, 'remaining_krw': None},
        'inventory': {'items': []}, 'life': {'routines': [], 'exhausted': False},
    }
    with TestClient(app) as client:
        for case in CASES:
            request(client, case, 'PUT', 'me/onboarding', {'living_months': 2, 'priority': 'reduce_waste'})
            if case != 'missing':
                for name, data in (empty if case == 'empty' else modules).items():
                    at = now - timedelta(days=2) if case == 'stale' else now
                    request(client, case, 'PUT', 'dev/me/modules/' + name, {'source_updated_at': at.isoformat(), 'data': data})
            view = request(client, case, 'GET', 'me/dashboard')
            ai = request(client, case, 'GET', 'me/ai-context')
            expected = {'missing': 'missing', 'stale': 'stale'}.get(case, 'available')
            require(all(s == expected for s in view['module_status'].values()), case + ': 상태 불일치')
            require(set(ai['modules']) == (set(modules) if expected == 'available' else set()), case + ': AI 필터 오류')
            require({c['kind'] for c in view['cards']} == ({'budget', 'inventory', 'routine'} if case == 'normal' else set()), case + ': 카드 오류')
            print(f'PASS {case}: {expected}, 카드 {len(view["cards"])}개, AI 모듈 {len(ai["modules"])}개')
        require(request(client, 'missing', 'GET', 'me/dashboard')['modules']['inventory'] is None, '미수신 오류')
        require(request(client, 'empty', 'GET', 'me/dashboard')['modules']['inventory']['data']['items'] == [], '빈 재고 오류')

def main():
    parser = argparse.ArgumentParser(description='중앙 코어 연동 실습')
    parser.add_argument('--serve', action='store_true')
    parser.add_argument('--host', choices=['127.0.0.1', '0.0.0.0'], default='127.0.0.1')
    parser.add_argument('--port', type=int, default=8001)
    args = parser.parse_args()
    with TemporaryDirectory(prefix='jachwi-lab-') as directory:
        app = create_app('sqlite:///' + (Path(directory) / 'lab.db').as_posix(), tokens=TOKENS, demo_enabled=True)
        seed_and_check(app)
        if args.serve:
            print('개발 토큰: ' + ', '.join(TOKENS))
            import uvicorn
            uvicorn.run(app, host=args.host, port=args.port)

if __name__ == '__main__':
    main()
