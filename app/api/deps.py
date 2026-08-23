import hashlib
import hmac
import secrets

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User

security = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    salt = secrets.token_hex(8)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000)
    return f"{salt}${digest.hex()}"


def verify_password(password: str, password_hash: str | None) -> bool:
    if not password_hash or "$" not in password_hash:
        return False
    salt, expected_hex = password_hash.split("$", 1)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 100_000)
    return hmac.compare_digest(digest.hex(), expected_hex)


def create_access_token(user_id: int) -> str:
    return f"liftlog-access-{user_id}.{secrets.token_urlsafe(16)}"


def create_refresh_token(user_id: int) -> str:
    return f"liftlog-refresh-{user_id}.{secrets.token_urlsafe(16)}"


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Authorization header",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    if not token.startswith("liftlog-access-"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = token.split("-", 2)[-1].split(".", 1)[0]
    try:
        user_id_int = int(user_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    user = db.query(User).filter(User.id == user_id_int).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid access token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
