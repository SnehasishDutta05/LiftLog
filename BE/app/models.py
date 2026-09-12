from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from BE.app.db import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=True)
    access_token = Column(String, nullable=True)
    refresh_token = Column(String, nullable=True)
    full_name = Column(String, nullable=False)
    auth_provider = Column(String, default="email")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    routines = relationship("Routine", back_populates="user")
    workouts = relationship("Workout", back_populates="user")


class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    routine_exercises = relationship("RoutineExercise", back_populates="exercise")
    workout_exercises = relationship("WorkoutExercise", back_populates="exercise")


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
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    routine_id = Column(Integer, ForeignKey("routines.id"), nullable=False, index=True)
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=False, index=True)
    order_index = Column(Integer, nullable=False, default=0)
    target_sets = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (UniqueConstraint("routine_id", "exercise_id", name="uq_routine_exercise"),)

    routine = relationship("Routine", back_populates="routine_exercises")
    exercise = relationship("Exercise", back_populates="routine_exercises")


class Workout(Base):
    __tablename__ = "workouts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    routine_id = Column(Integer, ForeignKey("routines.id"), nullable=True, index=True)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    finished_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, nullable=True)

    user = relationship("User", back_populates="workouts")
    workout_exercises = relationship("WorkoutExercise", back_populates="workout", cascade="all, delete-orphan")


class WorkoutExercise(Base):
    __tablename__ = "workout_exercises"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    workout_id = Column(Integer, ForeignKey("workouts.id"), nullable=False, index=True)
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=False, index=True)
    order_index = Column(Integer, nullable=False, default=0)

    workout = relationship("Workout", back_populates="workout_exercises")
    exercise = relationship("Exercise", back_populates="workout_exercises")
    sets = relationship("WorkoutSet", back_populates="workout_exercise", cascade="all, delete-orphan")


class WorkoutSet(Base):
    __tablename__ = "workout_sets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    workout_exercise_id = Column(Integer, ForeignKey("workout_exercises.id"), nullable=False, index=True)
    set_number = Column(Integer, nullable=False)
    weight = Column(Float, nullable=True)
    reps = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    workout_exercise = relationship("WorkoutExercise", back_populates="sets")


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True, index=True)

    # Physical data
    dob = Column(String, nullable=True)
    height = Column(String, nullable=True)
    weight = Column(String, nullable=True)
    sex = Column(String, nullable=True)

    # Lifestyle
    wake_time = Column(String, nullable=True)
    sleep_time = Column(String, nullable=True)
    work_schedule = Column(String, nullable=True)
    daily_activity = Column(String, nullable=True)
    commute = Column(String, nullable=True)
    available_training_time = Column(String, nullable=True)

    # Training
    experience = Column(String, nullable=True)
    training_days = Column(String, nullable=True)
    preferred_time = Column(String, nullable=True)
    preferred_exercises = Column(String, nullable=True)
    disliked_exercises = Column(String, nullable=True)
    limitations = Column(String, nullable=True)

    # Nutrition
    typical_foods = Column(String, nullable=True)
    meals_per_day = Column(String, nullable=True)
    eating_out_frequency = Column(String, nullable=True)
    favorite_foods = Column(String, nullable=True)
    favorite_snacks = Column(String, nullable=True)
    dietary_preferences = Column(String, nullable=True)
    cooking_constraints = Column(String, nullable=True)

    # Goals
    primary_goal = Column(String, nullable=True)
    target_weight = Column(String, nullable=True)
    goal_description = Column(String, nullable=True)
    lifestyle_change_tolerance = Column(String, nullable=True)

    # Descriptions
    current_description = Column(String, nullable=True)
    target_description = Column(String, nullable=True)
    target_characteristics = Column(String, nullable=True)
    inspiration_description = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", backref="profile")


class Food(Base):
    __tablename__ = "foods"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(String, nullable=True)
    category = Column(String, nullable=True, index=True)
    brand = Column(String, nullable=True)
    calories_per_100g = Column(Float, nullable=False, default=0)
    protein_per_100g = Column(Float, nullable=False, default=0)
    carbs_per_100g = Column(Float, nullable=False, default=0)
    fat_per_100g = Column(Float, nullable=False, default=0)
    fiber_per_100g = Column(Float, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    servings = relationship("FoodServing", back_populates="food", cascade="all, delete-orphan")


class FoodServing(Base):
    __tablename__ = "food_servings"

    id = Column(Integer, primary_key=True, index=True)
    food_id = Column(Integer, ForeignKey("foods.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    quantity_g = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    food = relationship("Food", back_populates="servings")


class CustomFood(Base):
    __tablename__ = "custom_foods"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(String, nullable=True)
    category = Column(String, nullable=True, index=True)
    calories_per_100g = Column(Float, nullable=False, default=0)
    protein_per_100g = Column(Float, nullable=False, default=0)
    carbs_per_100g = Column(Float, nullable=False, default=0)
    fat_per_100g = Column(Float, nullable=False, default=0)
    fiber_per_100g = Column(Float, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)


class Meal(Base):
    __tablename__ = "meals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    is_active = Column(Boolean, nullable=False, default=True)

    items = relationship("MealItem", back_populates="meal", cascade="all, delete-orphan")


class MealItem(Base):
    __tablename__ = "meal_items"

    id = Column(Integer, primary_key=True, index=True)
    meal_id = Column(Integer, ForeignKey("meals.id"), nullable=False, index=True)
    food_id = Column(Integer, ForeignKey("foods.id"), nullable=True, index=True)
    custom_food_id = Column(Integer, ForeignKey("custom_foods.id"), nullable=True, index=True)
    quantity_g = Column(Float, nullable=False)
    serving_id = Column(Integer, ForeignKey("food_servings.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    meal = relationship("Meal", back_populates="items")


class DietLog(Base):
    __tablename__ = "diet_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    date = Column(String, nullable=False, index=True)
    calories = Column(Float, nullable=False, default=0)
    protein_g = Column(Float, nullable=False, default=0)
    carbs_g = Column(Float, nullable=False, default=0)
    fat_g = Column(Float, nullable=False, default=0)
    fiber_g = Column(Float, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    items = relationship("DietLogItem", back_populates="log", cascade="all, delete-orphan")


class DietLogItem(Base):
    __tablename__ = "diet_log_items"

    id = Column(Integer, primary_key=True, index=True)
    log_id = Column(Integer, ForeignKey("diet_logs.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    meal_type = Column(String, nullable=False, index=True)
    food_id = Column(Integer, nullable=True)
    custom_food_id = Column(Integer, nullable=True)
    serving_id = Column(Integer, ForeignKey("food_servings.id"), nullable=True)
    food_name = Column(String, nullable=False)
    quantity_g = Column(Float, nullable=False)
    calories = Column(Float, nullable=False, default=0)
    protein_g = Column(Float, nullable=False, default=0)
    carbs_g = Column(Float, nullable=False, default=0)
    fat_g = Column(Float, nullable=False, default=0)
    fiber_g = Column(Float, nullable=False, default=0)

    log = relationship("DietLog", back_populates="items")


class DietGoal(Base):
    __tablename__ = "diet_goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True, index=True)
    calorie_target = Column(Float, nullable=False, default=0)
    protein_target_g = Column(Float, nullable=False, default=0)
    carbs_target_g = Column(Float, nullable=False, default=0)
    fat_target_g = Column(Float, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
