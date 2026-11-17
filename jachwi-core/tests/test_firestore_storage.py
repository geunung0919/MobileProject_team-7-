"""DATABASE_URL=firestore... 저장소 테스트. 실제 Firestore 대신 메모리 저장소/가짜 클라이언트를 씁니다."""
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm.exc import StaleDataError

from app.database import ProfileRow
from app.fintech import LedgerRow
from app.firestore_storage import FirestoreSession, FirestoreStore, MemoryStore, memory_store
from app.main import create_app

TOKENS = {'firestore-token-user-a': 'demo-a'}
AUTH = {'Authorization': 'Bearer firestore-token-user-a'}
RECEIPT_TEXT = '이마트 성수점\n2026-11-15 18:20\n우유 2,980\n두부 1,500\n합계 4,480원'


def memory_url():
    name = 'test-' + uuid4().hex
    return f'firestore-memory://{name}', memory_store(name)


def confirm_receipt(client):
    return client.post('/api/v1/me/spending/imports/confirm', headers=AUTH, json={
        'raw_text': RECEIPT_TEXT, 'source': 'ocr', 'title': '이마트 성수점', 'amount_krw': 4480,
        'spent_on': '2026-11-15', 'category': 'groceries',
        'receipt_items': [
            {'raw_name': '우유', 'normalized_name': '우유', 'quantity': 1, 'unit': '개', 'item_amount_krw': 2980,
             'item_type': 'ingredient', 'is_ingredient': True, 'ingredient_confidence': 0.95,
             'suggested_for_inventory': True},
        ],
    })


def test_receipt_import_and_inventory_are_saved_in_firestore_documents():
    url, store = memory_url()
    with TestClient(create_app(url, tokens=TOKENS)) as client:
        saved = confirm_receipt(client)
        assert saved.status_code == 201, saved.text
        assert confirm_receipt(client).status_code == 409  # 같은 영수증 중복 방지

        inventory = client.put('/api/v1/me/inventory', headers=AUTH, json={'expected_revision': 0, 'data': {'items': [
            {'item_id': 'milk-1', 'name': '우유', 'quantity': 1, 'unit': 'piece', 'storage': 'fridge'}]}})
        assert inventory.status_code == 200, inventory.text

    ledger = store.get(('demo-a', 'spending_ledger'))
    assert ledger['version'] == 1
    [expense] = ledger['payload']['expenses']
    assert expense['title'] == '이마트 성수점' and expense['receipt_items'][0]['normalized_name'] == '우유'
    assert store.get(('demo-a', 'inventory'))['revision'] == 1

    # 서버를 다시 켜도 Firestore 에 저장된 값을 읽습니다.
    with TestClient(create_app(url, tokens=TOKENS)) as client:
        summary = client.get('/api/v1/me/spending?period=2026-11', headers=AUTH).json()
        assert summary['data']['spent_krw'] == 4480
        assert client.get('/api/v1/me/inventory', headers=AUTH).json()['revision'] == 1


def test_inventory_revision_conflicts_return_409():
    url, _ = memory_url()
    body = {'data': {'items': []}}
    with TestClient(create_app(url, tokens=TOKENS)) as client:
        assert client.put('/api/v1/me/inventory', headers=AUTH, json={**body, 'expected_revision': 0}).status_code == 200
        assert client.put('/api/v1/me/inventory', headers=AUTH, json={**body, 'expected_revision': 0}).status_code == 409
        assert client.put('/api/v1/me/inventory', headers=AUTH, json={**body, 'expected_revision': 5}).status_code == 409
        assert client.put('/api/v1/me/inventory', headers=AUTH, json={**body, 'expected_revision': 1}).json()['revision'] == 2


def test_ledger_version_conflict_raises_stale_data():
    store = MemoryStore()
    with FirestoreSession(store) as setup:
        setup.add(LedgerRow(user_id='u', payload={'expenses': []}))
        setup.commit()

    first, second = FirestoreSession(store), FirestoreSession(store)
    row_a, row_b = first.get(LedgerRow, 'u'), second.get(LedgerRow, 'u')
    row_a.payload = {'expenses': ['a']}
    first.commit()
    assert row_a.version == 2
    row_b.payload = {'expenses': ['b']}
    with pytest.raises(StaleDataError):
        second.commit()
    assert store.get(('u', 'spending_ledger')) == {'payload': {'expenses': ['a']}, 'version': 2}


def test_merge_overwrites_and_unchanged_rows_are_not_written():
    store = MemoryStore()
    with FirestoreSession(store) as session:
        session.merge(ProfileRow(user_id='u', payload={'a': 1}))
        session.commit()
        session.merge(ProfileRow(user_id='u', payload={'b': 2}))
        session.commit()
    assert store.get(('u', 'profile')) == {'payload': {'b': 2}}

    calls = []
    store.commit = lambda writes: calls.append(writes)
    with FirestoreSession(store) as session:
        session.get(ProfileRow, 'u')
        session.commit()
    assert calls == [[]]


class FakeSnap:
    def __init__(self, data):
        self._data = data
        self.exists = data is not None

    def to_dict(self):
        return dict(self._data)


class FakeRef:
    def __init__(self, docs, path):
        self.docs, self.path = docs, path

    def collection(self, name):
        return FakeCollection(self.docs, self.path + (name,))

    def get(self, transaction=None):
        return FakeSnap(self.docs.get(self.path))


class FakeCollection(FakeRef):
    def document(self, name):
        return FakeRef(self.docs, self.path + (name,))


class FakeTransaction:
    def __init__(self, docs):
        self.docs, self.sets = docs, []

    def set(self, ref, data, merge=False):
        self.sets.append((ref.path, data, merge))


class FakeClient:
    def __init__(self):
        self.docs = {}
        self.last = None

    def collection(self, name):
        return FakeCollection(self.docs, (name,))

    def transaction(self):
        self.last = FakeTransaction(self.docs)
        return self.last


def fake_firestore_store():
    client = FakeClient()
    store = FirestoreStore.__new__(FirestoreStore)
    store._client, store._root = client, 'users'

    def transactional(fn):
        def run(transaction):
            fn(transaction)
            for path, data, merge in transaction.sets:  # 예외 없이 끝났을 때만 반영
                client.docs[path] = {**client.docs.get(path, {}), **data} if merge else data
        return run
    store._transactional = transactional
    return client, store


def test_firestore_store_uses_user_core_document_paths_and_checks_before_writing():
    client, store = fake_firestore_store()
    with FirestoreSession(store) as session:
        session.add(LedgerRow(user_id='demo-a', payload={'expenses': []}))
        session.commit()
    assert client.docs[('users', 'demo-a', 'core', 'spending_ledger')] == {'payload': {'expenses': []}, 'version': 1}

    from sqlalchemy.exc import IntegrityError
    with FirestoreSession(store) as session, pytest.raises(IntegrityError):
        session.add(LedgerRow(user_id='demo-a', payload={'expenses': ['dup']}))
        session.commit()
    assert client.last.sets == []  # 조건이 틀리면 아무것도 쓰지 않음
    assert client.docs[('users', 'demo-a', 'core', 'spending_ledger')]['payload'] == {'expenses': []}


def test_migrate_sqlite_rows_to_firestore(tmp_path):
    from tools.migrate_sqlite_to_firestore import migrate
    sqlite_url = f'sqlite:///{tmp_path}/old.db'
    with TestClient(create_app(sqlite_url, tokens=TOKENS)) as client:
        assert confirm_receipt(client).status_code == 201
    url, store = memory_url()
    assert migrate(sqlite_url, url) == {'fintech_ledgers': 1}
    with TestClient(create_app(url, tokens=TOKENS)) as client:
        assert client.get('/api/v1/me/spending?period=2026-11', headers=AUTH).json()['data']['spent_krw'] == 4480
        assert confirm_receipt(client).status_code == 409  # 옮긴 뒤에도 중복 방지 기록 유지


def test_expense_meta_and_all_expenses_endpoint_for_uiux_app():
    url, _ = memory_url()
    meta = {'category_label': '카페·간식', 'icon': 'coffee-outline', 'source': 'manual',
            'items': [{'id': 'i1', 'name': '아메리카노', 'unitPrice': 4500, 'quantity': 1, 'inFridge': False}]}
    with TestClient(create_app(url, tokens=TOKENS)) as client:
        first = client.post('/api/v1/me/spending/expenses', headers=AUTH, json={
            'title': '스타벅스', 'amount_krw': 4500, 'spent_on': '2026-10-31', 'category': 'food', 'meta': meta}).json()
        assert first['meta'] == meta
        plain = client.post('/api/v1/me/spending/expenses', headers=AUTH, json={
            'title': '버스', 'amount_krw': 1500, 'spent_on': '2026-11-01', 'category': 'transport'}).json()
        assert 'meta' not in plain
        # 화면 정보 없이 수정해도 기존 meta 유지
        edited = client.put(f"/api/v1/me/spending/expenses/{first['id']}", headers=AUTH, json={
            'title': '스타벅스 성수', 'amount_krw': 4500, 'spent_on': '2026-10-31', 'category': 'food'}).json()
        assert edited['meta'] == meta
        listed = client.get('/api/v1/me/spending/expenses', headers=AUTH).json()['expenses']
        assert [e['title'] for e in listed] == ['버스', '스타벅스 성수']  # 최근 저장한 것이 앞
        bad = client.post('/api/v1/me/spending/expenses', headers=AUTH, json={
            'title': 'x', 'amount_krw': 1, 'spent_on': '2026-11-01', 'category': 'other', 'meta': {'unknown': 1}})
        assert bad.status_code == 422


def test_inventory_keeps_display_fields():
    url, _ = memory_url()
    item = {'item_id': 'f1', 'name': '두부', 'quantity': 1, 'unit': 'pack', 'storage': 'fridge',
            'target_date': '2026-11-20', 'date_source': 'estimate', 'display_quantity': 1, 'display_unit': '모',
            'detail': '300g', 'purchase_date': '2026-11-17', 'icon': 'cube-outline'}
    with TestClient(create_app(url, tokens=TOKENS)) as client:
        saved = client.put('/api/v1/me/inventory', headers=AUTH, json={'expected_revision': 0, 'data': {'items': [item]}})
        assert saved.status_code == 200, saved.text
        got = client.get('/api/v1/me/inventory', headers=AUTH).json()['snapshot']['data']['items'][0]
        assert got['display_unit'] == '모' and got['detail'] == '300g' and got['purchase_date'] == '2026-11-17'
