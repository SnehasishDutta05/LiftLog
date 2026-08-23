from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from app.db import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=True)
    full_name = Column(String, nullable=False)
    auth_provider = Column(String, default="email")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    routines = relationship("Routine", back_populates="user")
    workouts = relationship("Workout", back_populates="user")


class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    is_custom = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    routines = relationship("RoutineExercise", back_populates="exercise")
    workouts = relationship("WorkoutExercise", back_populates="exercise")


class Routine(Base):
    __tablename__ = "routines"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="routines")
    routine_exercises = relationship("RoutineExercise", back_populates="routine", cascade="all, delete-orphan")


class RoutineExercise(Base):
    __tablename__ = "routine_exercises"

    id = Column(Integer, primary_key=True, index=True)
    routine_id = Column(Integer, ForeignKey("routines.id"), nullable=False, index=True)
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=False, index=True)
    order_index = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (UniqueConstraint("routine_id", "exercise_id", name="uq_routine_exercise"),)

    routine = relationship("Routine", back_populates="routine_exercises")
    exercise = relationship("Exercise", back_populates="routines")


class Workout(Base):
    __tablename__ = "workouts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    status = Column(String, default="in_progress", nullable=False)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="workouts")
    workout_exercises = relationship("WorkoutExercise", back_populates="workout", cascade="all, delete-orphan")


class WorkoutExercise(Base):
    __tablename__ = "workout_exercises"

    id = Column(Integer, primary_key=True, index=True)
    workout_id = Column(Integer, ForeignKey("workouts.id"), nullable=False, index=True)
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=False, index=True)
    order_index = Column(Integer, nullable=False, default=0)

    workout = relationship("Workout", back_populates="workout_exercises")
    exercise = relationship("Exercise", back_populates="workouts")
    sets = relationship("WorkoutSet", back_populates="workout_exercise", cascade="all, delete-orphan")


class WorkoutSet(Base):
    __tablename__ = "workout_sets"

    id = Column(Integer, primary_key=True, index=True)
    workout_exercise_id = Column(Integer, ForeignKey("workout_exercises.id"), nullable=False, index=True)
    set_number = Column(Integer, nullable=False)
    weight = Column(Float, nullable=True)
    reps = Column(Integer, nullable=True)
    completed = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    workout_exercise = relationship("WorkoutExercise", back_populates="sets")
