"""서버 실행 후 python examples/demo.py. 공개 로컬 테스트 토큰만 사용."""
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo
import json
import httpx
now = datetime.now(timezone.utc)
today = now.astimezone(ZoneInfo('Asia/Seoul')).date()
with httpx.Client(trust_env=False, base_url='http://127.0.0.1:8000', headers={'Authorization': 'Bearer local-demo-token-user-a'}) as c:
    def put(path, data):
        r = c.put(path, json=data)
        r.raise_for_status()
    put('/api/v1/me/onboarding', {'living_months': 2, 'cooking_days_per_week': 2,
        'cooking_tools': ['microwave'], 'monthly_budget_krw': 300000,
        'priority': 'reduce_waste', 'initial_inventory_state': 'needs_registration'})
    modules = {
        'spending': {'period': today.strftime('%Y-%m'), 'budget_krw': 300000, 'spent_krw': 315000, 'remaining_krw': -15000},
        'inventory': {'items': [{'item_id': 'eggs-001', 'name': '계란', 'quantity': 3, 'unit': 'piece',
            'storage': 'fridge', 'target_date': (today+timedelta(days=1)).isoformat(), 'date_source': 'estimate'}]},
        'life': {'routines': [{'routine_id': 'trash-001', 'title': '분리배출', 'due_date': today.isoformat(), 'completed': False}], 'exhausted': False},
    }
    for name, data in modules.items():
        put(f'/api/v1/dev/me/modules/{name}', {'schema_version': '1.0', 'source_updated_at': now.isoformat(), 'data': data})
    r = c.get('/api/v1/me/dashboard')
    r.raise_for_status()
    print(json.dumps(r.json(), ensure_ascii=False, indent=2))
