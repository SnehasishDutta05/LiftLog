from datetime import datetime
from typing import Optional

from pydantic import AliasChoices, BaseModel, ConfigDict, Field


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


class UserProfileRequest(BaseModel):
    # Physical data
    dob: Optional[str] = None
    height: Optional[str] = None
    weight: Optional[str] = None
    sex: Optional[str] = None

    # Lifestyle
    wake_time: Optional[str] = None
    sleep_time: Optional[str] = None
    work_schedule: Optional[str] = None
    daily_activity: Optional[str] = None
    commute: Optional[str] = None
    available_training_time: Optional[str] = None

    # Training
    experience: Optional[str] = None
    training_days: Optional[str] = None
    preferred_time: Optional[str] = None
    preferred_exercises: Optional[str] = None
    disliked_exercises: Optional[str] = None
    limitations: Optional[str] = None

    # Nutrition
    typical_foods: Optional[str] = None
    meals_per_day: Optional[str] = None
    eating_out_frequency: Optional[str] = None
    favorite_foods: Optional[str] = None
    favorite_snacks: Optional[str] = None
    dietary_preferences: Optional[str] = None
    cooking_constraints: Optional[str] = None

    # Goals
    primary_goal: Optional[str] = None
    target_weight: Optional[str] = None
    goal_description: Optional[str] = None
    lifestyle_change_tolerance: Optional[str] = None

    # Descriptions
    current_description: Optional[str] = None
    target_description: Optional[str] = None
    target_characteristics: Optional[str] = None
    inspiration_description: Optional[str] = None


class UserProfileResponse(BaseModel):
    message: str

    class Config:
        from_attributes = True



class WorkoutCreate(BaseModel):
    name: Optional[str] = None


class WorkoutSetInput(BaseModel):
    weight: Optional[float] = None
    reps: Optional[int] = None


class WorkoutExerciseInput(BaseModel):
    exercise_id: int
    sets: list[WorkoutSetInput] = Field(default_factory=list)


class WorkoutCompleteRequest(BaseModel):
    routine_id: Optional[int] = None
    started_at: datetime
    finished_at: datetime
    exercises: list[WorkoutExerciseInput]


class WorkoutRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    routine_id: Optional[int] = None
    started_at: datetime
    finished_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    status: Optional[str] = None
    completed_at: Optional[datetime] = None


class WorkoutListResponse(BaseModel):
    workouts: list[WorkoutRead]


class WorkoutSetDetail(BaseModel):
    set_number: int
    weight: Optional[float] = None
    reps: Optional[int] = None


class WorkoutExerciseDetail(BaseModel):
    workout_exercise_id: int
    exercise_id: int
    exercise_name: Optional[str] = None
    sets: list[WorkoutSetDetail]


class WorkoutDetailResponse(BaseModel):
    workout_id: int
    routine_id: Optional[int] = None
    started_at: datetime
    finished_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    exercises: list[WorkoutExerciseDetail]


class WorkoutListPaginatedResponse(BaseModel):
    items: list[WorkoutDetailResponse]
    total: int
    limit: int
    offset: int
    has_more: bool


class WorkoutSetSummary(BaseModel):
    set_id: int
    set_number: int
    weight: Optional[float] = None
    reps: Optional[int] = None


class WorkoutExerciseSummary(BaseModel):
    workout_exercise_id: int
    exercise_id: int
    sets: list[WorkoutSetSummary]


class WorkoutCompleteResponse(BaseModel):
    workout_id: int
    routine_id: Optional[int] = None
    started_at: datetime
    finished_at: datetime
    duration_seconds: int
    exercises: list[WorkoutExerciseSummary]


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
    created_at: datetime

    class Config:
        from_attributes = True


class TopSetEntry(BaseModel):
    rank: int
    weight: Optional[float] = None
    reps: Optional[int] = None
    volume: Optional[float] = None


class ExerciseTopSetsResponse(BaseModel):
    exercise_id: int
    exercise_name: str
    top_sets: list[TopSetEntry]


class ExerciseHistorySet(BaseModel):
    set_number: int
    weight: Optional[float] = None
    reps: Optional[int] = None


class ExerciseLastWorkout(BaseModel):
    workout_id: int
    date: str
    sets: list[ExerciseHistorySet]


class ExerciseHistoryResponse(BaseModel):
    exercise_id: int
    exercise_name: str
    last_workout: Optional[ExerciseLastWorkout] = None


class ExerciseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    exercise_id: int = Field(validation_alias="id")
    name: str


class RoutineExerciseCreate(BaseModel):
    exercise_id: int
    target_sets: int


class RoutineExerciseRead(BaseModel):
    exercise_id: int
    name: str
    target_sets: Optional[int] = None
    order_index: int

    class Config:
        from_attributes = True


class RoutineCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    exercises: list[RoutineExerciseCreate]


class RoutineUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    exercises: list[RoutineExerciseCreate]


class RoutineRead(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    routine_id: int = Field(validation_alias=AliasChoices("routine_id", "id"))
    user_id: int
    name: str
    created_at: datetime
    updated_at: datetime


class RoutineReadWithExercises(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    routine_id: int = Field(validation_alias=AliasChoices("routine_id", "id"))
    name: str
    exercises: list[RoutineExerciseRead]


class RoutineListResponse(BaseModel):
    routines: list[RoutineRead]


class NutritionValues(BaseModel):
    calories: float = 0
    protein_g: float = 0
    carbs_g: float = 0
    fat_g: float = 0
    fiber_g: float = 0


class FoodNutrition(BaseModel):
    calories: float = 0
    protein_g: float = 0
    carbs_g: float = 0
    fat_g: float = 0
    fiber_g: float = 0


class FoodListItem(BaseModel):
    food_id: int
    name: str
    nutrition_per_100g: FoodNutrition


class FoodServingRead(BaseModel):
    serving_id: int
    name: str
    quantity_g: float
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: float


class FoodDetail(FoodListItem):
    category: Optional[str] = None
    servings: list[FoodServingRead] = Field(default_factory=list)


class Pagination(BaseModel):
    page: int
    page_size: int
    total: int


class FoodListResponse(BaseModel):
    items: list[FoodListItem]
    pagination: Pagination


class NutritionInput(BaseModel):
    calories: float = Field(ge=0)
    protein_g: float = Field(ge=0)
    carbs_g: float = Field(ge=0)
    fat_g: float = Field(ge=0)
    fiber_g: float = Field(default=0, ge=0)


class CustomFoodCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: Optional[str] = None
    category: Optional[str] = None
    nutrition_per_100g: NutritionInput
    is_active: bool = True


class CustomFoodUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = None
    category: Optional[str] = None
    nutrition_per_100g: Optional[NutritionInput] = None


class CustomFoodRead(BaseModel):
    custom_food_id: int
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    nutrition_per_100g: FoodNutrition
    is_active: bool


class CustomFoodListResponse(BaseModel):
    items: list[CustomFoodRead]
    pagination: Pagination


class MealItemInput(BaseModel):
    food_id: Optional[int] = None
    custom_food_id: Optional[int] = None
    quantity_g: float = Field(gt=0)
    serving_id: Optional[int] = None

    @classmethod
    def validate_reference(cls, values):
        return values


class MealCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: Optional[str] = None
    items: list[MealItemInput] = Field(default_factory=list)


class MealUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = None
    items: Optional[list[MealItemInput]] = None


class MealItemRead(BaseModel):
    food_id: Optional[int] = None
    custom_food_id: Optional[int] = None
    name: str
    quantity_g: float


class MealRead(BaseModel):
    meal_id: int
    name: str
    description: Optional[str] = None
    nutrition: NutritionValues
    item_count: int
    items: list[MealItemRead]


class MealListResponse(BaseModel):
    meals: list[MealRead]


class LogItemInput(BaseModel):
    food_id: Optional[int] = None
    custom_food_id: Optional[int] = None
    quantity_g: float = Field(gt=0)


class LogMealInput(BaseModel):
    meal_type: str
    items: list[LogItemInput] = Field(default_factory=list)


class DietLogCreate(BaseModel):
    date: Optional[str] = None
    meals: list[LogMealInput]


class DietLogUpdate(DietLogCreate):
    date: str


class DietLogItemRead(BaseModel):
    food_id: Optional[int] = None
    custom_food_id: Optional[int] = None
    food_name: str
    quantity_g: float
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    fiber_g: float


class DietLogMealRead(BaseModel):
    meal_name: str
    items: list[DietLogItemRead]
    nutrition: NutritionValues


class DietLogRead(BaseModel):
    log_id: int
    date: str
    last_updated: datetime
    meals: list[DietLogMealRead]


class DietSummary(BaseModel):
    date: str
    calories: dict[str, float]
    macros: dict[str, dict[str, float]]
    meals: dict[str, NutritionValues]


class DietHistoryDay(BaseModel):
    date: str
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float


class DietHistoryResponse(BaseModel):
    start_date: str
    end_date: str
    days: list[DietHistoryDay]
    average: NutritionValues


class DietGoalRequest(BaseModel):
    calories: float = Field(ge=0)
    protein_g: float = Field(ge=0)
    carbs_g: float = Field(ge=0)
    fat_g: float = Field(ge=0)


class DietGoalRead(DietGoalRequest):
    pass
