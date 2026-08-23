from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import (
    create_access_token,
    create_refresh_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.db import get_db
from app.models import User
from app.schemas import LoginRequest, SignupRequest, SignupResponse, TokenResponse, UserPublic

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=SignupResponse)
def signup(payload: SignupRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    if not email:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Email is required")

    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="the user already exist please log in",
        )

    full_name = email.split("@")[0].title()
    user = User(
        email=email,
        password_hash=hash_password(payload.password),
        full_name=full_name,
        auth_provider="email",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return SignupResponse(message="User created successfully", user=UserPublic.model_validate(user))


@router.post("/demo-login", response_model=TokenResponse)
def demo_login(payload: LoginRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)
    user_payload = UserPublic.model_validate(user)
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=user_payload,
    )


@router.get("/me", response_model=UserPublic)
def get_me(current_user: User = Depends(get_current_user)):
    return UserPublic.model_validate(current_user)
