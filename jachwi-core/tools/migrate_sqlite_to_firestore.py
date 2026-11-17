"""기존 SQLite/MySQL 데이터를 Firestore 로 복사합니다 (원본은 그대로 둠).

사용 (jachwi-core 폴더에서):
  .\\.venv\\Scripts\\python.exe tools/migrate_sqlite_to_firestore.py sqlite:///./core.db firestore://
FIREBASE_CREDENTIALS 는 .env 또는 환경변수로 지정합니다. Firestore 에 같은 문서가 있으면 덮어씁니다.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from dotenv import load_dotenv  # noqa: E402
from sqlalchemy import inspect, select  # noqa: E402

from app.database import Base, connect  # noqa: E402
from app.fintech import LedgerRow  # noqa: E402,F401  (테이블 등록)


def migrate(source_url, target_url):
    engine, source_sessions = connect(source_url)
    _, target_sessions = connect(target_url)
    copied = {}
    existing = set(inspect(engine).get_table_names())
    with source_sessions() as source, target_sessions() as target:
        for mapper in Base.registry.mappers:
            model = mapper.class_
            if model.__table__.name not in existing:
                continue
            for row in source.scalars(select(model)):
                values = {c.name: getattr(row, c.name) for c in model.__table__.columns}
                target.merge(model(**values))
                copied[model.__table__.name] = copied.get(model.__table__.name, 0) + 1
        target.commit()
    engine.dispose()
    return copied


if __name__ == '__main__':
    load_dotenv()
    if len(sys.argv) != 3 or not sys.argv[2].startswith('firestore'):
        sys.exit('사용법: python tools/migrate_sqlite_to_firestore.py <원본 DATABASE_URL> firestore://')
    for table, count in migrate(sys.argv[1], sys.argv[2]).items():
        print(f'{table}: {count}건 복사')
