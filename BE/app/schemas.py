from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class UserPublic(BaseModel):
    id: int
    email: str
    full_name: str
    auth_provider: str

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserPublic


class LoginRequest(BaseModel):
    email: str = Field(..., min_length=1)
    password: str = Field(..., min_length=6)


class SignupRequest(BaseModel):
    full_name: str = Field(..., min_length=1)
    email: str = Field(..., min_length=1)
    password: str = Field(..., min_length=6)


class SignupUserResponse(BaseModel):
    access_token: str
    refresh_token: str
    email: str
    full_name: str


class SignupResponse(BaseModel):
    message: str
    user: SignupUserResponse


class RefreshTokenRequest(BaseModel):
    refresh_token: str = Field(..., min_length=1)


class RoutineCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)


class RoutineUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=120)


class RoutineRead(BaseModel):
    id: int
    user_id: int
    name: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RoutineListResponse(BaseModel):
    routines: list[RoutineRead]


class ExerciseRead(BaseModel):
    id: int
    name: str
    created_by: Optional[int] = None
    is_custom: bool

    class Config:
        from_attributes = True


class WorkoutCreate(BaseModel):
    name: Optional[str] = None


class WorkoutRead(BaseModel):
    id: int
    user_id: int
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class WorkoutListResponse(BaseModel):
    workouts: list[WorkoutRead]


class WorkoutExerciseCreate(BaseModel):
    exercise_id: int
    order_index: int = 0


class WorkoutExerciseRead(BaseModel):
    id: int
    workout_id: int
    exercise_id: int
    order_index: int

    class Config:
        from_attributes = True


class WorkoutSetCreate(BaseModel):
    weight: Optional[float] = None
    reps: Optional[int] = None
    completed: bool = False


class WorkoutSetRead(BaseModel):
    id: int
    workout_exercise_id: int
    set_number: int
    weight: Optional[float] = None
    reps: Optional[int] = None
    completed: bool
    created_at: datetime

    class Config:
        from_attributes = True
