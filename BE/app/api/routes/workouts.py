from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from BE.app.api.deps import get_current_user
from BE.app.db import get_db
from BE.app.models import Exercise, User, Workout, WorkoutExercise, WorkoutSet
from BE.app.schemas import WorkoutCreate, WorkoutExerciseCreate, WorkoutExerciseRead, WorkoutListResponse, WorkoutRead, WorkoutSetCreate, WorkoutSetRead

router = APIRouter(prefix="/workouts", tags=["workouts"])


@router.post("", response_model=WorkoutRead, status_code=status.HTTP_201_CREATED)
def create_workout(
    payload: WorkoutCreate | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    workout = Workout(user_id=current_user.id, status="in_progress", started_at=datetime.utcnow())
    db.add(workout)
    db.commit()
    db.refresh(workout)
    return WorkoutRead.model_validate(workout)


@router.get("", response_model=WorkoutListResponse)
def list_workouts(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    workouts = (
        db.query(Workout)
        .filter(Workout.user_id == current_user.id)
        .order_by(Workout.started_at.desc())
        .all()
    )
    return {"workouts": [WorkoutRead.model_validate(w) for w in workouts]}


@router.get("/{workout_id}", response_model=WorkoutRead)
def read_workout(
    workout_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    workout = (
        db.query(Workout)
        .filter(Workout.id == workout_id, Workout.user_id == current_user.id)
        .first()
    )
    if workout is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workout not found")
    return WorkoutRead.model_validate(workout)


@router.post("/{workout_id}/exercises", response_model=WorkoutExerciseRead, status_code=status.HTTP_201_CREATED)
def add_exercise_to_workout(
    workout_id: int,
    payload: WorkoutExerciseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    workout = (
        db.query(Workout)
        .filter(Workout.id == workout_id, Workout.user_id == current_user.id)
        .first()
    )
    if workout is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workout not found")

    exercise = db.query(Exercise).filter(Exercise.id == payload.exercise_id).first()
    if exercise is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exercise not found")

    workout_exercise = WorkoutExercise(
        workout_id=workout.id,
        exercise_id=exercise.id,
        order_index=payload.order_index,
    )
    db.add(workout_exercise)
    db.commit()
    db.refresh(workout_exercise)
    return WorkoutExerciseRead.model_validate(workout_exercise)


@router.post("/exercise/{workout_exercise_id}/sets", response_model=WorkoutSetRead, status_code=status.HTTP_201_CREATED)
def add_set_to_workout_exercise(
    workout_exercise_id: int,
    payload: WorkoutSetCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    workout_exercise = db.query(WorkoutExercise).filter(WorkoutExercise.id == workout_exercise_id).first()
    if workout_exercise is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workout exercise not found")

    workout = db.query(Workout).filter(Workout.id == workout_exercise.workout_id).first()
    if workout is None or workout.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to modify this workout")

    set_number = (
        db.query(WorkoutSet)
        .filter(WorkoutSet.workout_exercise_id == workout_exercise.id)
        .count()
    ) + 1

    workout_set = WorkoutSet(
        workout_exercise_id=workout_exercise.id,
        set_number=set_number,
        weight=payload.weight,
        reps=payload.reps,
        completed=payload.completed,
    )
    db.add(workout_set)
    db.commit()
    db.refresh(workout_set)
    return WorkoutSetRead.model_validate(workout_set)


@router.post("/{workout_id}/complete", response_model=WorkoutRead)
def complete_workout(
    workout_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    workout = (
        db.query(Workout)
        .filter(Workout.id == workout_id, Workout.user_id == current_user.id)
        .first()
    )
    if workout is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workout not found")

    workout.status = "completed"
    workout.completed_at = datetime.utcnow()
    db.commit()
    db.refresh(workout)
    return WorkoutRead.model_validate(workout)
