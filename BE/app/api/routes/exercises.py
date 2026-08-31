import logging

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from BE.app.api.deps import get_current_user
from BE.app.db import get_db
from BE.app.models import Exercise, User
from BE.app.schemas import ExerciseRead

logger = logging.getLogger("liftlog")

router = APIRouter(prefix="/exercises", tags=["exercises"])


@router.get("", response_model=list[ExerciseRead])
def get_exercises(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    logger.info("EXERCISES /exercises called for user_id=%s", current_user.id)

    # Get all exercises (both default and custom)
    exercises = db.query(Exercise).filter(
        (Exercise.user_id == None) | (Exercise.user_id == current_user.id)
    ).all()

    logger.info("EXERCISES /exercises found %d exercises", len(exercises))
    return exercises
