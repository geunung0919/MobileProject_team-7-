"""Firestore 저장소.

main.py / fintech.py 는 SQLAlchemy Session 의 일부 기능(get, add, merge, execute(update), commit, rollback)만 씁니다.
이 파일의 FirestoreSession 이 그 기능을 같은 모양으로 제공하므로, 기존 API 코드는 그대로 두고
DATABASE_URL 만 바꿔서 저장 위치를 SQLite/MySQL 에서 Firestore 로 옮길 수 있습니다.

DATABASE_URL
  firestore://                 서비스 계정 키(FIREBASE_CREDENTIALS)의 프로젝트 사용
  firestore://<project-id>     프로젝트 id 직접 지정
  firestore-memory://<이름>    테스트용 메모리 저장소 (Firestore 접속 없음)

Firestore 경로 (FIRESTORE_ROOT_COLLECTION 기본값 'users')
  users/{user_id}/core/profile                온보딩 프로필        (core_profiles)
  users/{user_id}/core/notification_settings  알림 설정            (core_notification_settings)
  users/{user_id}/core/inventory              냉장고 재고 + revision (core_inventory)
  users/{user_id}/core/spending_ledger        소비 원장 + version   (fintech_ledgers)
  users/{user_id}/core/snapshot_{module}      개발용 모듈 스냅샷    (core_module_snapshots)
각 문서는 테이블의 키가 아닌 열(payload, revision, version)을 필드로 가집니다.
"""
import copy
import os
import threading
from dataclasses import dataclass
from urllib.parse import urlparse

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm.exc import StaleDataError
from sqlalchemy.sql.elements import BinaryExpression, BooleanClauseList

DOC_IDS = {
    'core_profiles': lambda keys: 'profile',
    'core_notification_settings': lambda keys: 'notification_settings',
    'core_inventory': lambda keys: 'inventory',
    'fintech_ledgers': lambda keys: 'spending_ledger',
    'core_module_snapshots': lambda keys: f'snapshot_{keys["module"]}',
}


class WriteConflict(Exception):
    """commit 시 미리 확인한 조건(문서 없음 / 필드 값)이 맞지 않을 때."""

    def __init__(self, reason):
        super().__init__(reason)
        self.reason = reason  # 'exists' | 'version' | 'changed'


@dataclass
class Write:
    path: tuple            # (user_id, doc_id)
    data: dict
    merge: bool = False    # True 면 data 의 필드만 덮어씀
    must_be_absent: bool = False
    expect: dict | None = None   # {필드: 값} 저장 직전에 이 값이어야 함
    reason: str = 'changed'      # expect 가 틀렸을 때 WriteConflict.reason


def _check(current, write):
    if write.must_be_absent and current is not None:
        raise WriteConflict('exists')
    if write.expect is not None:
        if current is None or any(current.get(k) != v for k, v in write.expect.items()):
            raise WriteConflict(write.reason)


class MemoryStore:
    """테스트용. 프로세스 메모리에 저장하고 commit 은 잠금으로 원자적으로 처리합니다."""

    def __init__(self):
        self._docs = {}
        self._lock = threading.Lock()

    def get(self, path):
        with self._lock:
            doc = self._docs.get(path)
            return copy.deepcopy(doc) if doc is not None else None

    def commit(self, writes):
        with self._lock:
            for write in writes:
                _check(self._docs.get(write.path), write)
            for write in writes:
                data = copy.deepcopy(write.data)
                self._docs[write.path] = {**self._docs.get(write.path, {}), **data} if write.merge else data


class FirestoreStore:
    """실제 Firestore. commit 은 트랜잭션 하나로 조건 확인과 저장을 함께 합니다."""

    def __init__(self, client, root):
        from google.cloud import firestore

        self._client = client
        self._root = root
        self._transactional = firestore.transactional

    def _ref(self, path):
        user_id, doc_id = path
        return self._client.collection(self._root).document(user_id).collection('core').document(doc_id)

    def get(self, path):
        snap = self._ref(path).get()
        return snap.to_dict() if snap.exists else None

    def commit(self, writes):
        if not writes:
            return

        @self._transactional
        def run(transaction):
            # Firestore 트랜잭션은 읽기를 모두 끝낸 뒤에 써야 합니다.
            for write in writes:
                if write.must_be_absent or write.expect is not None:
                    snap = self._ref(write.path).get(transaction=transaction)
                    _check(snap.to_dict() if snap.exists else None, write)
            for write in writes:
                transaction.set(self._ref(write.path), write.data, merge=write.merge)

        run(self._client.transaction())


class _Result:
    def __init__(self, rowcount):
        self.rowcount = rowcount


def _table(model):
    return model.__table__


def _key_names(model):
    return [c.name for c in _table(model).primary_key.columns]


def _field_names(model):
    keys = set(_key_names(model))
    return [c.name for c in _table(model).columns if c.name not in keys]


def _version_name(model):
    column = model.__mapper__.version_id_col
    return column.name if column is not None else None


def _path(model, keys):
    doc_id = DOC_IDS[_table(model).name](keys)
    return (str(keys['user_id']), doc_id)


def _model_for_table(name):
    from .database import Base

    for mapper in Base.registry.mappers:
        if mapper.local_table.name == name:
            return mapper.class_
    raise ValueError(f'알 수 없는 테이블: {name}')


class FirestoreSession:
    """SQLAlchemy Session 의 일부만 흉내 냅니다. 요청 하나 동안만 씁니다."""

    def __init__(self, store):
        self._store = store
        self._loaded = {}    # identity -> (obj, 불러올 때의 필드 값)
        self._added = {}     # identity -> obj   (새로 만들기: 이미 있으면 충돌)
        self._merged = {}    # identity -> obj   (통째로 덮어쓰기)
        self._updates = []   # execute(update) 로 예약한 Write

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        self.close()
        return False

    def close(self):
        self.rollback()
        self._loaded.clear()

    # ---- 읽기 ----
    @staticmethod
    def _identity_of(obj):
        model = type(obj)
        return model, tuple(getattr(obj, name) for name in _key_names(model))

    @staticmethod
    def _fields_of(obj):
        return {name: copy.deepcopy(getattr(obj, name)) for name in _field_names(type(obj))}

    def get(self, model, key, with_for_update=False):  # with_for_update 는 commit 시 조건 확인으로 대신합니다.
        values = key if isinstance(key, tuple) else (key,)
        identity = (model, tuple(values))
        for pending in (self._added, self._merged):
            if identity in pending:
                return pending[identity]
        if identity in self._loaded:
            return self._loaded[identity][0]
        keys = dict(zip(_key_names(model), values))
        data = self._store.get(_path(model, keys))
        if data is None:
            return None
        obj = model(**keys, **{name: data.get(name) for name in _field_names(model)})
        self._loaded[identity] = (obj, self._fields_of(obj))
        return obj

    # ---- 쓰기 예약 ----
    def add(self, obj):
        self._added[self._identity_of(obj)] = obj

    def merge(self, obj):
        identity = self._identity_of(obj)
        self._merged[identity] = obj
        return obj

    def execute(self, statement):
        """update(Model).where(키 == 값, 열 == 값).values(...) 형태만 지원합니다 (재고 revision 확인용)."""
        model = _model_for_table(statement.table.name)
        clause = statement.whereclause
        conditions = clause.clauses if isinstance(clause, BooleanClauseList) else [clause]
        keys, expect = {}, {}
        for condition in conditions:
            if not isinstance(condition, BinaryExpression) or condition.operator.__name__ != 'eq':
                raise NotImplementedError('Firestore 저장소는 == 조건만 지원합니다.')
            name, value = condition.left.name, condition.right.value
            (keys if name in _key_names(model) else expect)[name] = value
        values = {(k if isinstance(k, str) else k.name): v.value for k, v in statement._values.items()}
        path = _path(model, keys)
        current = self._store.get(path)
        matched = current is not None and all(current.get(k) == v for k, v in expect.items())
        if matched:
            self._updates.append(Write(path, values, merge=True, expect=expect))
        return _Result(1 if matched else 0)

    def commit(self):
        writes = []
        pending_new = []
        for identity, obj in self._added.items():
            model = type(obj)
            version = _version_name(model)
            if version and getattr(obj, version) is None:
                setattr(obj, version, 1)
            writes.append(Write(_path(model, dict(zip(_key_names(model), identity[1]))),
                                self._fields_of(obj), must_be_absent=True))
            pending_new.append((identity, obj))
        for identity, obj in self._merged.items():
            model = type(obj)
            writes.append(Write(_path(model, dict(zip(_key_names(model), identity[1]))), self._fields_of(obj)))
            pending_new.append((identity, obj))
        bumped = []
        for identity, (obj, original) in self._loaded.items():
            if identity in self._added or identity in self._merged:
                continue
            fields = self._fields_of(obj)
            if fields == original:
                continue
            model = type(obj)
            path = _path(model, dict(zip(_key_names(model), identity[1])))
            version = _version_name(model)
            if version:
                # SQLAlchemy version_id_col 과 같은 낙관적 잠금: 불러온 뒤 다른 요청이 저장했으면 충돌
                fields[version] = (original.get(version) or 0) + 1
                writes.append(Write(path, fields, expect={version: original.get(version)}, reason='version'))
                bumped.append((obj, version, fields[version]))
            else:
                writes.append(Write(path, fields))
        writes.extend(self._updates)

        try:
            self._store.commit(writes)
        except WriteConflict as conflict:
            self.rollback()
            if conflict.reason == 'version':
                raise StaleDataError('다른 요청이 먼저 저장했습니다.') from None
            raise IntegrityError('firestore commit', None, conflict) from None

        for obj, version, value in bumped:
            setattr(obj, version, value)
        for identity, obj in pending_new:
            self._loaded[identity] = (obj, self._fields_of(obj))
        for identity, (obj, _) in list(self._loaded.items()):
            self._loaded[identity] = (obj, self._fields_of(obj))
        self._added.clear()
        self._merged.clear()
        self._updates.clear()

    def rollback(self):
        self._added.clear()
        self._merged.clear()
        self._updates.clear()


_MEMORY_STORES = {}
_MEMORY_LOCK = threading.Lock()


def memory_store(name):
    with _MEMORY_LOCK:
        return _MEMORY_STORES.setdefault(name, MemoryStore())


def _firestore_client(project_id):
    try:
        from google.cloud import firestore
    except ImportError as error:  # pragma: no cover - 설치 안내
        raise RuntimeError('Firestore 를 쓰려면 `pip install -r requirements.txt` 로 google-cloud-firestore 를 설치하세요.') from error

    options = {}
    if project_id:
        options['project'] = project_id  # 없으면 서비스 계정 키 파일의 project_id 를 씁니다.
    database = os.getenv('FIRESTORE_DATABASE')
    if database:
        options['database'] = database  # 기본 데이터베이스면 비워 두세요.
    credentials_path = os.getenv('FIREBASE_CREDENTIALS') or os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
    if credentials_path:
        if not os.path.isfile(credentials_path):
            raise RuntimeError(f'FIREBASE_CREDENTIALS 파일을 찾을 수 없습니다: {credentials_path}')
        return firestore.Client.from_service_account_json(credentials_path, **options)
    # 키 파일이 없으면 gcloud auth application-default login 같은 기본 인증을 씁니다.
    return firestore.Client(**options)


def connect_firestore(url):
    """database.connect 와 같은 모양으로 (engine, session_factory) 를 돌려줍니다. engine 은 없습니다."""
    parsed = urlparse(url)
    if parsed.scheme == 'firestore-memory':
        store = memory_store(parsed.netloc or 'default')
    elif parsed.scheme == 'firestore':
        root = os.getenv('FIRESTORE_ROOT_COLLECTION', 'users')
        store = FirestoreStore(_firestore_client(parsed.netloc), root)
    else:
        raise ValueError(f'Firestore 주소가 아닙니다: {url}')
    return None, lambda: FirestoreSession(store)
