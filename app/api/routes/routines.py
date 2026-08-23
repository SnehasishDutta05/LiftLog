from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db import get_db
from app.models import Routine, RoutineExercise, User
from app.schemas import RoutineCreate, RoutineListResponse, RoutineRead, RoutineUpdate

router = APIRouter(prefix="/routines", tags=["routines"])


@router.get("", response_model=RoutineListResponse)
def list_routines(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    routines = (
        db.query(Routine)
        .filter(Routine.user_id == current_user.id)
        .order_by(Routine.created_at.desc())
        .all()
    )
    return {"routines": [RoutineRead.model_validate(r) for r in routines]}


@router.post("", response_model=RoutineRead, status_code=status.HTTP_201_CREATED)
def create_routine(
    payload: RoutineCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    routine = Routine(user_id=current_user.id, name=payload.name.strip())
    db.add(routine)
    db.commit()
    db.refresh(routine)
    return RoutineRead.model_validate(routine)


@router.get("/{routine_id}", response_model=RoutineRead)
def read_routine(
    routine_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    routine = (
        db.query(Routine)
        .filter(Routine.id == routine_id, Routine.user_id == current_user.id)
        .first()
    )
    if routine is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Routine not found")
    return RoutineRead.model_validate(routine)


@router.patch("/{routine_id}", response_model=RoutineRead)
def update_routine(
    routine_id: int,
    payload: RoutineUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    routine = (
        db.query(Routine)
        .filter(Routine.id == routine_id, Routine.user_id == current_user.id)
        .first()
    )
    if routine is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Routine not found")

    if payload.name is not None:
        routine.name = payload.name.strip()

    db.commit()
    db.refresh(routine)
    return RoutineRead.model_validate(routine)


@router.delete("/{routine_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_routine(
    routine_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    routine = (
        db.query(Routine)
        .filter(Routine.id == routine_id, Routine.user_id == current_user.id)
        .first()
    )
    if routine is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Routine not found")

    db.delete(routine)
    db.commit()
    return None
