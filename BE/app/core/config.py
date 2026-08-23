import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]
PROJECT_ROOT = BASE_DIR.parent

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./liftlog.db")
APP_NAME = os.getenv("APP_NAME", "LiftLog")
API_PREFIX = os.getenv("API_PREFIX", "/api/v1")
ACCESS_TOKEN_SECRET = os.getenv("ACCESS_TOKEN_SECRET", "change-me-in-production")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
