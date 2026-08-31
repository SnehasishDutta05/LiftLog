import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from BE.app.api.deps import get_current_user
from BE.app.db import get_db
from BE.app.models import Exercise, Routine, RoutineExercise, User, Workout
from BE.app.schemas import RoutineCreate, RoutineListResponse, RoutineReadWithExercises, RoutineUpdate, RoutineExerciseRead

logger = logging.getLogger("liftlog")

router = APIRouter(prefix="/routines", tags=["routines"])


@router.get("", response_model=RoutineListResponse)
def get_routines(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    logger.info("ROUTINES /routines called for user_id=%s", current_user.id)

    routines = db.query(Routine).filter(Routine.user_id == current_user.id).all()
    logger.info("ROUTINES /routines found %d routines", len(routines))

    return RoutineListResponse(routines=routines)


@router.post("", response_model=RoutineReadWithExercises)
def create_routine(payload: RoutineCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    logger.info("ROUTINES POST /routines called for user_id=%s with payload=%s", current_user.id, payload.model_dump())

    # Create routine
    routine = Routine(
        user_id=current_user.id,
        name=payload.name,
    )
    db.add(routine)
    db.flush()
    logger.info("ROUTINES POST /routines created routine_id=%s", routine.id)

    # Add exercises to routine
    exercise_details = []
    for idx, exercise_req in enumerate(payload.exercises, start=1):
        exercise = db.query(Exercise).filter(Exercise.id == exercise_req.exercise_id).first()
        if not exercise:
            logger.warning("ROUTINES POST /routines exercise not found: exercise_id=%s", exercise_req.exercise_id)
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Exercise {exercise_req.exercise_id} not found")

        routine_exercise = RoutineExercise(
            user_id=current_user.id,
            routine_id=routine.id,
            exercise_id=exercise.id,
            target_sets=exercise_req.target_sets,
            order_index=idx,
        )
        db.add(routine_exercise)
        db.flush()

        exercise_details.append(RoutineExerciseRead(
            exercise_id=exercise.id,
            name=exercise.name,
            target_sets=exercise_req.target_sets,
            order_index=idx,
        ))
        logger.info("ROUTINES POST /routines added exercise: exercise_id=%s order_index=%s", exercise.id, idx)

    db.commit()
    db.refresh(routine)

    response = RoutineReadWithExercises(
        routine_id=routine.id,
        name=routine.name,
        exercises=exercise_details,
    )
    logger.info("ROUTINES POST /routines response=%s", response.model_dump())
    return response


@router.get("/{routine_id}", response_model=RoutineReadWithExercises)
def get_routine(routine_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    logger.info("ROUTINES GET /routines/{%d} called for user_id=%s", routine_id, current_user.id)

    routine = db.query(Routine).filter(
        Routine.id == routine_id,
        Routine.user_id == current_user.id
    ).first()

    if not routine:
        logger.warning("ROUTINES GET /routines/{%d} not found or unauthorized", routine_id)
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Routine not found")

    # Get exercises for this routine
    routine_exercises = db.query(RoutineExercise).filter(
        RoutineExercise.routine_id == routine_id
    ).order_by(RoutineExercise.order_index).all()

    exercise_details = []
    for re in routine_exercises:
        exercise = db.query(Exercise).filter(Exercise.id == re.exercise_id).first()
        if exercise:
            exercise_details.append(RoutineExerciseRead(
                exercise_id=exercise.id,
                name=exercise.name,
                target_sets=re.target_sets,
                order_index=re.order_index,
            ))

    logger.info("ROUTINES GET /routines/{%d} found %d exercises", routine_id, len(exercise_details))

    response = RoutineReadWithExercises(
        routine_id=routine.id,
        name=routine.name,
        exercises=exercise_details,
    )
    logger.info("ROUTINES GET /routines/{%d} response=%s", routine_id, response.model_dump())
    return response


@router.put("/{routine_id}", response_model=RoutineReadWithExercises)
def update_routine(routine_id: int, payload: RoutineUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    logger.info("ROUTINES PUT /routines/{%d} called for user_id=%s with payload=%s", routine_id, current_user.id, payload.model_dump())

    routine = db.query(Routine).filter(
        Routine.id == routine_id,
        Routine.user_id == current_user.id
    ).first()

    if not routine:
        logger.warning("ROUTINES PUT /routines/{%d} not found or unauthorized", routine_id)
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Routine not found")

    # Update routine name if provided
    if payload.name:
        routine.name = payload.name
        logger.info("ROUTINES PUT /routines/{%d} updated name=%s", routine_id, payload.name)

    # Delete all existing routine_exercises for this routine
    db.query(RoutineExercise).filter(RoutineExercise.routine_id == routine_id).delete()
    logger.info("ROUTINES PUT /routines/{%d} deleted existing exercises", routine_id)

    # Add new exercises
    exercise_details = []
    for idx, exercise_req in enumerate(payload.exercises, start=1):
        exercise = db.query(Exercise).filter(Exercise.id == exercise_req.exercise_id).first()
        if not exercise:
            logger.warning("ROUTINES PUT /routines/{%d} exercise not found: exercise_id=%s", routine_id, exercise_req.exercise_id)
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Exercise {exercise_req.exercise_id} not found")

        routine_exercise = RoutineExercise(
            user_id=current_user.id,
            routine_id=routine_id,
            exercise_id=exercise.id,
            target_sets=exercise_req.target_sets,
            order_index=idx,
        )
        db.add(routine_exercise)
        db.flush()

        exercise_details.append(RoutineExerciseRead(
            exercise_id=exercise.id,
            name=exercise.name,
            target_sets=exercise_req.target_sets,
            order_index=idx,
        ))
        logger.info("ROUTINES PUT /routines/{%d} added exercise: exercise_id=%s order_index=%s", routine_id, exercise.id, idx)

    db.commit()
    db.refresh(routine)

    response = RoutineReadWithExercises(
        routine_id=routine.id,
        name=routine.name,
        exercises=exercise_details,
    )
    logger.info("ROUTINES PUT /routines/{%d} response=%s", routine_id, response.model_dump())
    return response


@router.delete("/{routine_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_routine(routine_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    logger.info("ROUTINES DELETE /routines/{%d} called for user_id=%s", routine_id, current_user.id)

    routine = db.query(Routine).filter(
        Routine.id == routine_id,
        Routine.user_id == current_user.id
    ).first()

    if not routine:
        logger.warning("ROUTINES DELETE /routines/{%d} not found or unauthorized", routine_id)
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Routine not found")

    # Set workouts.routine_id = NULL for all workouts belonging to this routine
    workouts = db.query(Workout).filter(Workout.routine_id == routine_id).all()
    for workout in workouts:
        workout.routine_id = None
        logger.info("ROUTINES DELETE /routines/{%d} cleared routine_id from workout_id=%s", routine_id, workout.id)

    # Delete routine_exercises for this routine
    db.query(RoutineExercise).filter(RoutineExercise.routine_id == routine_id).delete()
    logger.info("ROUTINES DELETE /routines/{%d} deleted routine_exercises", routine_id)

    # Delete routine
    db.delete(routine)
    db.commit()

    logger.info("ROUTINES DELETE /routines/{%d} deleted successfully", routine_id)
    return None
