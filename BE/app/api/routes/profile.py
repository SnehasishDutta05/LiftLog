import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import desc
from sqlalchemy.orm import Session

from BE.app.api.deps import get_current_user
from BE.app.db import get_db
from BE.app.models import User, UserProfile
from BE.app.schemas import ProfileHistoryResponse, UserProfileRead, UserProfileRequest, UserProfileResponse

logger = logging.getLogger("liftlog")

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("", response_model=UserProfileRead)
def get_latest_user_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = (
        db.query(UserProfile)
        .filter(UserProfile.user_id == current_user.id)
        .order_by(desc(UserProfile.version))
        .first()
    )
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return profile


@router.get("/history", response_model=ProfileHistoryResponse)
def get_profile_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = (
        db.query(UserProfile)
        .filter(UserProfile.user_id == current_user.id)
        .order_by(desc(UserProfile.created_at), desc(UserProfile.version))
        .all()
    )

    history = {
        "weight": [],
        "height": [],
        "available_training_time": [],
    }

    for row in rows:
        for field_name in ["weight", "height", "available_training_time"]:
            value = getattr(row, field_name)
            if value is not None:
                history[field_name].append({
                    "value": value,
                    "recorded_at": row.created_at.isoformat().replace("+00:00", "Z"),
                })

    for field_name in history:
        history[field_name].sort(key=lambda item: item["recorded_at"])

    return history


@router.post("", response_model=UserProfileResponse)
def update_user_profile(payload: UserProfileRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    logger.info("PROFILE /profile called for user_id=%s with payload=%s", current_user.id, payload.model_dump(exclude_none=True))

    latest_profile = (
        db.query(UserProfile)
        .filter(UserProfile.user_id == current_user.id)
        .order_by(desc(UserProfile.version))
        .first()
    )

    if latest_profile:
        logger.info("PROFILE /profile found latest version=%s for user_id=%s", latest_profile.version, current_user.id)
        next_version = latest_profile.version + 1
        snapshot = {
            "user_id": current_user.id,
            "version": next_version,
            "dob": latest_profile.dob,
            "height": latest_profile.height,
            "weight": latest_profile.weight,
            "sex": latest_profile.sex,
            "wake_time": latest_profile.wake_time,
            "sleep_time": latest_profile.sleep_time,
            "work_schedule": latest_profile.work_schedule,
            "daily_activity": latest_profile.daily_activity,
            "commute": latest_profile.commute,
            "available_training_time": latest_profile.available_training_time,
            "experience": latest_profile.experience,
            "training_days": latest_profile.training_days,
            "preferred_time": latest_profile.preferred_time,
            "preferred_exercises": latest_profile.preferred_exercises,
            "disliked_exercises": latest_profile.disliked_exercises,
            "limitations": latest_profile.limitations,
            "typical_foods": latest_profile.typical_foods,
            "meals_per_day": latest_profile.meals_per_day,
            "eating_out_frequency": latest_profile.eating_out_frequency,
            "favorite_foods": latest_profile.favorite_foods,
            "favorite_snacks": latest_profile.favorite_snacks,
            "dietary_preferences": latest_profile.dietary_preferences,
            "cooking_constraints": latest_profile.cooking_constraints,
            "primary_goal": latest_profile.primary_goal,
            "target_weight": latest_profile.target_weight,
            "goal_description": latest_profile.goal_description,
            "lifestyle_change_tolerance": latest_profile.lifestyle_change_tolerance,
            "current_description": latest_profile.current_description,
            "target_description": latest_profile.target_description,
            "target_characteristics": latest_profile.target_characteristics,
            "inspiration_description": latest_profile.inspiration_description,
        }
        update_fields = payload.model_dump(exclude_none=True)
        snapshot.update(update_fields)
        profile = UserProfile(**snapshot)
        db.add(profile)
        logger.info("PROFILE /profile created new version=%s for user_id=%s with updated fields=%s", next_version, current_user.id, list(update_fields.keys()))
    else:
        logger.info("PROFILE /profile creating first profile version for user_id=%s", current_user.id)
        profile = UserProfile(
            user_id=current_user.id,
            version=1,
            **payload.model_dump(exclude_none=True)
        )
        db.add(profile)
        logger.info("PROFILE /profile first profile version created")

    db.commit()
    db.refresh(profile)
    logger.info("PROFILE /profile saved profile to DB: profile_id=%s version=%s", profile.id, profile.version)

    response = UserProfileResponse(message="Profile updated successfully")
    logger.info("PROFILE /profile response=%s", response.model_dump())
    return response
