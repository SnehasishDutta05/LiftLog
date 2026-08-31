import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from BE.app.api.deps import get_current_user
from BE.app.db import get_db
from BE.app.models import User, UserProfile
from BE.app.schemas import UserProfileRequest, UserProfileResponse

logger = logging.getLogger("liftlog")

router = APIRouter(prefix="/profile", tags=["profile"])


@router.post("", response_model=UserProfileResponse)
def update_user_profile(payload: UserProfileRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    logger.info("PROFILE /profile called for user_id=%s with payload=%s", current_user.id, payload.model_dump(exclude_none=True))

    # Check if profile already exists
    logger.info("PROFILE /profile checking if profile exists for user_id=%s", current_user.id)
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()

    if profile:
        logger.info("PROFILE /profile updating existing profile for user_id=%s", current_user.id)
        # Update existing profile - only update fields that were provided
        update_fields = payload.model_dump(exclude_none=True)
        for key, value in update_fields.items():
            setattr(profile, key, value)
        logger.info("PROFILE /profile fields updated: %s", list(update_fields.keys()))
    else:
        logger.info("PROFILE /profile creating new profile for user_id=%s", current_user.id)
        # Create new profile with only provided fields
        profile = UserProfile(
            user_id=current_user.id,
            **payload.model_dump(exclude_none=True)
        )
        db.add(profile)
        logger.info("PROFILE /profile profile object created")

    db.commit()
    db.refresh(profile)
    logger.info("PROFILE /profile saved profile to DB: profile_id=%s", profile.id)

    response = UserProfileResponse(
        message="Profile updated successfully",
    )
    logger.info("PROFILE /profile response=%s", response.model_dump())
    return response
