"""휴대폰 없이 PC 에서 '영수증 -> 소비 저장 -> 냉장고 저장 -> Firestore' 흐름을 확인합니다.

앱(UIUX)이 서버에 보내는 것과 같은 요청을 보낸 뒤, Firestore 를 직접 읽어 저장됐는지 보여 줍니다.

사용 (jachwi-core 폴더, 서버가 켜져 있는 상태에서 다른 창):
  ./.venv/Scripts/python.exe tools/check_firestore_flow.py                 # 샘플 영수증 글자로 확인
  ./.venv/Scripts/python.exe tools/check_firestore_flow.py 영수증.jpg      # 실제 영수증 사진으로 확인 (서버 OCR 필요)
  ./.venv/Scripts/python.exe tools/check_firestore_flow.py --cleanup       # 이 스크립트가 만든 테스트 데이터 지우기

옵션: --server http://127.0.0.1:8000  --token local-demo-token-user-a
"""
import argparse
import base64
import json
import os
import random
import sys
from datetime import date, datetime
from pathlib import Path

import httpx
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
TEST_TAG = '[확인용]'
TEST_ITEM_PREFIX = 'check-'


def say(ok, text):
    print(('  [OK] ' if ok else '  [실패] ') + text)


def api(client, method, path, body=None):
    response = client.request(method, f'/api/v1/{path}', json=body)
    try:
        data = response.json()
    except ValueError:
        data = {'raw': response.text[:300]}
    if response.status_code >= 400:
        raise RuntimeError(f'{method} {path} -> {response.status_code}: {json.dumps(data, ensure_ascii=False)[:500]}')
    return data


def sample_receipt_text():
    now = datetime.now()
    # 서버는 같은 영수증을 두 번 저장하지 못하게 막으므로, 실행할 때마다 봉투 값을 바꿔 다른 영수증으로 만듭니다.
    bag = random.randint(1, 99) * 10
    total = 2980 + 3000 + bag
    return (f'이마트 성수점\n{now:%Y-%m-%d %H:%M}\n'
            f'1 서울우유 1L 2,980 1 2,980\n2 국산콩 두부 1,500 2 3,000\n3 비닐봉투 {bag} 1 {bag}\n합계 {total:,}원')


def analyze(client, image_path):
    if image_path:
        raw = Path(image_path).read_bytes()
        mime = 'image/png' if raw[:8] == b'\x89PNG\r\n\x1a\n' else 'image/jpeg'
        print(f'1) 영수증 사진 분석 (서버 OCR): {image_path}')
        result = api(client, 'POST', 'me/spending/receipts/analyze',
                     {'image_base64': base64.b64encode(raw).decode(), 'mime_type': mime, 'use_ai_fallback': False})
    else:
        text = sample_receipt_text()
        print('1) 샘플 영수증 글자 분석 (사진 OCR 은 건너뜀)')
        result = api(client, 'POST', 'me/spending/imports/preview', {'raw_text': text, 'source': 'ocr', 'use_ai_fallback': False})
        result['raw_text'] = text
    candidate = result['candidate']
    items = result.get('receipt_items') or []
    say(True, f"상호 {candidate.get('title')} / 금액 {candidate.get('amount_krw')}원 / 날짜 {candidate.get('spent_on')} / 품목 {len(items)}개")
    for it in items:
        print(f"       - {it.get('raw_name')} -> {it.get('normalized_name')} (식재료: {bool(it.get('is_ingredient'))})")
    return result


def confirm(client, result):
    candidate = result['candidate']
    items = result.get('receipt_items') or []
    title = candidate.get('title') or '영수증'
    if TEST_TAG not in title:
        title = f'{TEST_TAG} {title}'[:100]
    amount = candidate.get('amount_krw') or sum(it.get('item_amount_krw') or 0 for it in items) or 1000
    receipt_items = [{
        'raw_name': (it.get('raw_name') or '품목')[:120],
        'normalized_name': (it.get('normalized_name') or it.get('raw_name') or '품목')[:120],
        'quantity': it.get('quantity') or 1,
        'unit': '개',
        'item_amount_krw': it.get('item_amount_krw'),
        'item_type': 'ingredient' if it.get('is_ingredient') else 'unknown',
        'is_ingredient': bool(it.get('is_ingredient')),
        'suggested_for_inventory': bool(it.get('is_ingredient')),
    } for it in items[:50]]
    body = {
        'raw_text': result['raw_text'][:5000], 'source': 'ocr', 'title': title, 'amount_krw': amount,
        'spent_on': candidate.get('spent_on') or date.today().isoformat(), 'category': 'groceries',
        'receipt_items': receipt_items,
        'meta': {'category_label': '식품', 'icon': 'receipt-text-outline', 'source': 'receipt'},
    }
    print('2) 소비 저장 (앱의 영수증 "저장하기"와 같은 요청)')
    try:
        saved = api(client, 'POST', 'me/spending/imports/confirm', body)
    except RuntimeError as error:
        if '409' in str(error) and 'imports/confirm' in str(error):
            raise RuntimeError('이미 저장한 영수증이에요 (서버의 중복 저장 방지가 정상 동작). '
                               '사진으로 확인 중이면 다른 영수증 사진을 쓰거나, --cleanup 후 다시 실행하세요.') from None
        raise
    say(True, f"지출 저장됨: {saved['title']} {saved['amount_krw']}원 (id {saved['id'][:8]}...)")
    return saved, [it for it in receipt_items if it['is_ingredient']]


def add_to_fridge(client, expense, ingredients):
    print('3) 냉장고 저장 (식품으로 체크한 품목)')
    try:
        state = api(client, 'GET', 'me/inventory')
        revision, items = state['revision'], state['snapshot']['data']['items']
    except RuntimeError as error:
        if '404' not in str(error):
            raise
        revision, items = 0, []
    today = date.today()
    new_items = [{
        'item_id': f"{TEST_ITEM_PREFIX}{expense['id'][:8]}-{index}", 'name': it['normalized_name'][:100],
        'quantity': it['quantity'], 'unit': 'piece', 'storage': 'fridge',
        'target_date': date.fromordinal(today.toordinal() + 14).isoformat(), 'date_source': 'estimate',
        'display_quantity': it['quantity'], 'display_unit': '개', 'purchase_date': today.isoformat(), 'icon': 'food-variant',
    } for index, it in enumerate(ingredients)] or [{
        'item_id': f"{TEST_ITEM_PREFIX}{expense['id'][:8]}-0", 'name': f'{TEST_TAG} 우유', 'quantity': 1, 'unit': 'piece',
        'storage': 'fridge', 'target_date': None, 'date_source': 'unknown',
    }]
    saved = api(client, 'PUT', 'me/inventory', {'expected_revision': revision, 'data': {'items': new_items + items}})
    say(True, f"냉장고 저장됨: {', '.join(i['name'] for i in new_items)} (재고 버전 {saved['revision']})")


def cleanup(client):
    print('테스트 데이터 지우기')
    expenses = api(client, 'GET', 'me/spending/expenses')['expenses']
    removed = 0
    for expense in expenses:
        if expense['title'].startswith(TEST_TAG):
            api(client, 'DELETE', f"me/spending/expenses/{expense['id']}")
            removed += 1
    say(True, f'테스트 지출 {removed}건 삭제')
    try:
        state = api(client, 'GET', 'me/inventory')
    except RuntimeError:
        return
    items = state['snapshot']['data']['items']
    kept = [i for i in items if not i['item_id'].startswith(TEST_ITEM_PREFIX)]
    if len(kept) != len(items):
        api(client, 'PUT', 'me/inventory', {'expected_revision': state['revision'], 'data': {'items': kept}})
    say(True, f'테스트 식재료 {len(items) - len(kept)}개 삭제')


def read_firestore(user_id):
    print('4) Firestore 직접 읽기 (서버가 아니라 Firebase 에서 바로 확인)')
    url = os.getenv('DATABASE_URL', '')
    if not url.startswith('firestore'):
        say(False, f'.env 의 DATABASE_URL 이 firestore:// 가 아니에요 (지금: {url or "없음"}). 서버가 SQLite 에 저장 중입니다.')
        return False
    sys.path.insert(0, str(ROOT))
    from app.firestore_storage import _firestore_client
    client = _firestore_client(url.split('://', 1)[1])
    root = os.getenv('FIRESTORE_ROOT_COLLECTION', 'users')
    ok = True
    for doc_id in ('spending_ledger', 'inventory'):
        path = f'{root}/{user_id}/core/{doc_id}'
        snap = client.document(path).get()
        if not snap.exists:
            say(False, f'{path} 문서가 없어요')
            ok = False
            continue
        payload = snap.to_dict().get('payload', {})
        if doc_id == 'spending_ledger':
            tests = [e for e in payload.get('expenses', []) if e['title'].startswith(TEST_TAG)]
            say(bool(tests), f'{path}: 지출 {len(payload.get("expenses", []))}건 (확인용 {len(tests)}건)')
            ok = ok and bool(tests)
        else:
            names = [i['name'] for i in payload.get('items', [])]
            say(True, f'{path}: 식재료 {len(names)}개 ({", ".join(names[:6])}{" ..." if len(names) > 6 else ""})')
    print(f'\n프로젝트: {client.project}  /  Firebase 콘솔 > Firestore > {root} > {user_id} > core 에서도 볼 수 있어요.')
    return ok


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('image', nargs='?', help='영수증 사진 경로 (없으면 샘플 영수증 글자 사용)')
    parser.add_argument('--server', default='http://127.0.0.1:8000')
    parser.add_argument('--token', default='local-demo-token-user-a')
    parser.add_argument('--cleanup', action='store_true', help='이 스크립트가 만든 테스트 데이터 지우기')
    args = parser.parse_args()

    os.chdir(ROOT)  # .env 와 ./secrets 경로 기준
    load_dotenv(ROOT / '.env')
    tokens = json.loads(os.getenv('DEV_TOKENS_JSON') or '{}')
    user_id = tokens.get(args.token, '?')

    with httpx.Client(base_url=args.server, headers={'Authorization': f'Bearer {args.token}'}, timeout=90) as client:
        try:
            client.get('/health').raise_for_status()
        except httpx.HTTPError:
            sys.exit(f'서버({args.server})에 연결하지 못했어요. 다른 창에서 서버를 먼저 켜 주세요.')
        print(f'서버 {args.server} / 사용자 {user_id}\n')
        try:
            if args.cleanup:
                cleanup(client)
                return
            result = analyze(client, args.image)
            expense, ingredients = confirm(client, result)
            add_to_fridge(client, expense, ingredients)
        except RuntimeError as error:
            sys.exit(f'\n[실패] {error}')
    print()
    ok = read_firestore(user_id)
    print('\n결과: ' + ('Firestore 저장 확인 완료' if ok else 'Firestore 저장을 확인하지 못했어요 (위 [실패] 줄 참고)'))
    print('테스트 데이터 지우기: ./.venv/Scripts/python.exe tools/check_firestore_flow.py --cleanup')


if __name__ == '__main__':
    main()
