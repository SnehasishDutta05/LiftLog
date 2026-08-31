from typing import Generator

from sqlalchemy import create_engine, exc, text
from sqlalchemy.orm import declarative_base, sessionmaker

from BE.app.core.config import DATABASE_URL

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db() -> Generator:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_user_password_hash_column() -> None:
    with engine.begin() as conn:
        try:
            conn.execute(text("SELECT password_hash FROM users LIMIT 1"))
        except exc.DatabaseError:
            conn.execute(text("ALTER TABLE users ADD COLUMN password_hash VARCHAR"))


def ensure_user_token_columns() -> None:
    with engine.begin() as conn:
        for column_name in ["access_token", "refresh_token"]:
            try:
                conn.execute(text(f"SELECT {column_name} FROM users LIMIT 1"))
            except exc.DatabaseError:
                conn.execute(text(f"ALTER TABLE users ADD COLUMN {column_name} VARCHAR"))


def init_db() -> None:
    from BE.app.models import Base as ModelsBase

    ModelsBase.metadata.create_all(bind=engine)
    ensure_user_password_hash_column()
    ensure_user_token_columns()
