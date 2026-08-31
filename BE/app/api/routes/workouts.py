from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from BE.app.api.deps import get_current_user
from BE.app.db import get_db
from BE.app.models import Exercise, Routine, User, Workout, WorkoutExercise, WorkoutSet
from BE.app.schemas import (
    WorkoutCompleteRequest,
    WorkoutCompleteResponse,
    WorkoutDetailResponse,
    WorkoutExerciseDetail,
    WorkoutExerciseSummary,
    WorkoutListPaginatedResponse,
    WorkoutRead,
    WorkoutSetDetail,
    WorkoutSetSummary,
)

router = APIRouter(prefix="/workouts", tags=["workouts"])


@router.post("", response_model=WorkoutCompleteResponse, status_code=status.HTTP_201_CREATED)
def save_completed_workout(
    payload: WorkoutCompleteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.finished_at < payload.started_at:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="finished_at must be after started_at")

    if payload.routine_id is not None:
        routine_exists = (
            db.query(Routine)
            .filter(Routine.id == payload.routine_id, Routine.user_id == current_user.id)
            .first()
        )
        if routine_exists is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Routine not found")

    started_at = payload.started_at
    finished_at = payload.finished_at
    duration_seconds = int((finished_at - started_at).total_seconds())

    workout = Workout(
        user_id=current_user.id,
        routine_id=payload.routine_id,
        started_at=started_at,
        finished_at=finished_at,
        duration_seconds=duration_seconds,
    )
    db.add(workout)
    db.flush()

    exercise_summaries: list[WorkoutExerciseSummary] = []
    for order_index, exercise_payload in enumerate(payload.exercises):
        exercise = db.query(Exercise).filter(Exercise.id == exercise_payload.exercise_id).first()
        if exercise is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Exercise {exercise_payload.exercise_id} not found")

        workout_exercise = WorkoutExercise(
            user_id=current_user.id,
            workout_id=workout.id,
            exercise_id=exercise.id,
            order_index=order_index,
        )
        db.add(workout_exercise)
        db.flush()

        sets = []
        for set_number, set_payload in enumerate(exercise_payload.sets, start=1):
            created_set = WorkoutSet(
                user_id=current_user.id,
                workout_exercise_id=workout_exercise.id,
                set_number=set_number,
                weight=set_payload.weight,
                reps=set_payload.reps,
            )
            db.add(created_set)
            db.flush()
            sets.append(
                WorkoutSetSummary(
                    set_id=created_set.id,
                    set_number=created_set.set_number,
                    weight=created_set.weight,
                    reps=created_set.reps,
                )
            )

        exercise_summaries.append(
            WorkoutExerciseSummary(
                workout_exercise_id=workout_exercise.id,
                exercise_id=exercise.id,
                sets=sets,
            )
        )

    db.commit()
    return WorkoutCompleteResponse(
        workout_id=workout.id,
        routine_id=payload.routine_id,
        started_at=workout.started_at,
        finished_at=workout.finished_at,
        duration_seconds=workout.duration_seconds,
        exercises=exercise_summaries,
    )


@router.get("", response_model=WorkoutListPaginatedResponse)
def list_workouts(
    limit: int = Query(10, ge=1, le=50),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    base_query = (
        db.query(Workout)
        .filter(Workout.user_id == current_user.id)
        .order_by(Workout.finished_at.desc().nullslast(), Workout.started_at.desc())
    )

    total = base_query.count()
    workouts = base_query.offset(offset).limit(limit).all()

    items: list[WorkoutDetailResponse] = []
    for workout in workouts:
        workout_exercises = (
            db.query(WorkoutExercise)
            .filter(WorkoutExercise.workout_id == workout.id)
            .order_by(WorkoutExercise.order_index.asc(), WorkoutExercise.id.asc())
            .all()
        )

        exercises: list[WorkoutExerciseDetail] = []
        for workout_exercise in workout_exercises:
            exercise = db.query(Exercise).filter(Exercise.id == workout_exercise.exercise_id).first()
            sets = (
                db.query(WorkoutSet)
                .filter(WorkoutSet.workout_exercise_id == workout_exercise.id)
                .order_by(WorkoutSet.set_number.asc())
                .all()
            )

            exercises.append(
                WorkoutExerciseDetail(
                    workout_exercise_id=workout_exercise.id,
                    exercise_id=workout_exercise.exercise_id,
                    exercise_name=exercise.name if exercise else None,
                    sets=[
                        WorkoutSetDetail(
                            set_number=entry.set_number,
                            weight=entry.weight,
                            reps=entry.reps,
                        )
                        for entry in sets
                    ],
                )
            )

        items.append(
            WorkoutDetailResponse(
                workout_id=workout.id,
                routine_id=workout.routine_id,
                started_at=workout.started_at,
                finished_at=workout.finished_at,
                duration_seconds=workout.duration_seconds,
                exercises=exercises,
            )
        )

    return {
        "items": items,
        "total": total,
        "limit": limit,
        "offset": offset,
        "has_more": offset + limit < total,
    }


