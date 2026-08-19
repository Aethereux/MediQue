"""Database engine, session factory, and .env loading.

Reads backend/.env (SECRET_KEY, DATABASE_URL) without any extra dependency.
The default SQLite path is resolved relative to this file so the server works
no matter which directory you start it from.
"""
import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

BASE_DIR = Path(__file__).resolve().parent

_env = BASE_DIR / ".env"
if _env.exists():
    for _line in _env.read_text().splitlines():
        _line = _line.strip()
        if _line and not _line.startswith("#") and "=" in _line:
            _k, _v = _line.split("=", 1)
            os.environ.setdefault(_k.strip(), _v.strip())

SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret")

_url = os.environ.get("DATABASE_URL", "sqlite:///./medique.db")
if _url.startswith("sqlite:///./"):  # resolve relative to this file, not cwd
    _url = "sqlite:///" + str(BASE_DIR / _url[len("sqlite:///./"):])

engine = create_engine(_url, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autoflush=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
