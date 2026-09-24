from sqlalchemy import create_engine, String, JSON
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker

class Base(DeclarativeBase):
    pass

class ProfileRow(Base):
    __tablename__ = 'core_profiles'
    user_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    payload: Mapped[dict] = mapped_column(JSON)

class SnapshotRow(Base):
    __tablename__ = 'core_module_snapshots'
    user_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    module: Mapped[str] = mapped_column(String(32), primary_key=True)
    payload: Mapped[dict] = mapped_column(JSON)

def connect(url):
    engine = create_engine(url, pool_pre_ping=True,
                           connect_args={'check_same_thread': False} if url.startswith('sqlite') else {})
    return engine, sessionmaker(engine, expire_on_commit=False)
