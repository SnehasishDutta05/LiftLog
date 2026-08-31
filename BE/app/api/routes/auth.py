import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from BE.app.api.deps import (
    decode_token,
    get_current_user,
    hash_password,
    issue_tokens_for_user,
    verify_password,
)
from BE.app.db import get_db
from BE.app.models import User
from BE.app.schemas import (
    LoginRequest,
    RefreshTokenRequest,
    SignupRequest,
    SignupResponse,
    UserPublic,
)

logger = logging.getLogger("liftlog")

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=SignupResponse)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    logger.info("AUTH /signup called with payload=%s", payload.model_dump())

    email = payload.email.strip().lower()
    if not email:
        logger.warning("AUTH /signup failed: email missing")
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Email is required")

    logger.info("AUTH /signup checking DB for email=%s", email)
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        logger.warning("AUTH /signup user already exists: id=%s email=%s", existing_user.id, existing_user.email)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="the user already exist please log in",
        )

    logger.info("AUTH /signup creating new user for email=%s full_name=%s", email, payload.full_name.strip())
    user = User(
        email=email,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name.strip(),
        auth_provider="email",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    logger.info("AUTH /signup user created in DB: id=%s", user.id)

    access_token, refresh_token = issue_tokens_for_user(db, user.id)
    logger.info("AUTH /signup issued JWT tokens for user_id=%s", user.id)

    response = SignupResponse(
        message="User created successfully",
        user={
            "access_token": access_token,
            "refresh_token": refresh_token,
            "email": user.email,
            "full_name": user.full_name,
        },
    )
    logger.info("AUTH /signup response=%s", response.model_dump())
    return response


@router.post("/demo-login", response_model=SignupResponse)
def demo_login(payload: LoginRequest, db: Session = Depends(get_db)):
    logger.info("AUTH /demo-login called with payload=%s", payload.model_dump())

    email = payload.email.strip().lower()
    logger.info("AUTH /demo-login checking DB for email=%s", email)
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        logger.warning("AUTH /demo-login failed: user not found for email=%s", email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    password_valid = verify_password(payload.password, user.password_hash)
    logger.info("AUTH /demo-login password check for user_id=%s result=%s", user.id, password_valid)
    if not password_valid:
        logger.warning("AUTH /demo-login failed: password mismatch for user_id=%s", user.id)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token, refresh_token = issue_tokens_for_user(db, user.id)
    logger.info("AUTH /demo-login issued JWT tokens for user_id=%s", user.id)

    response = SignupResponse(
        message="Loged in successfully",
        user={
            "access_token": access_token,
            "refresh_token": refresh_token,
            "email": user.email,
            "full_name": user.full_name,
        },
    )
    logger.info("AUTH /demo-login response=%s", response.model_dump())
    return response


@router.post("/refresh", response_model=SignupResponse)
def refresh_access_token(payload: RefreshTokenRequest, db: Session = Depends(get_db)):
    logger.info("AUTH /refresh called with refresh_token=%s", payload.refresh_token)

    token = payload.refresh_token.strip()
    if not token:
        logger.warning("AUTH /refresh failed: empty refresh token")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Refresh token is required",
        )

    logger.info("AUTH /refresh decoding refresh token")
    user_id_int = decode_token(token, expected_type="refresh")
    user = db.query(User).filter(User.id == user_id_int).first()
    if user is None:
        logger.warning("AUTH /refresh failed: no user found for user_id=%s", user_id_int)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )
    if user.refresh_token != token:
        logger.warning("AUTH /refresh failed: stored refresh token mismatch for user_id=%s", user.id)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is no longer valid",
        )

    logger.info("AUTH /refresh issuing fresh tokens for user_id=%s", user.id)
    access_token, refresh_token = issue_tokens_for_user(db, user.id)

    response = SignupResponse(
        message="Token refreshed successfully",
        user={
            "access_token": access_token,
            "refresh_token": refresh_token,
            "email": user.email,
            "full_name": user.full_name,
        },
    )
    logger.info("AUTH /refresh response=%s", response.model_dump())
    return response


@router.get("/me", response_model=UserPublic)
def get_me(current_user: User = Depends(get_current_user)):
    return UserPublic.model_validate(current_user)
