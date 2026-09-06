from datetime import date, datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from BE.app.api.deps import get_current_user
from BE.app.db import get_db
from BE.app.models import CustomFood, DietGoal, DietLog, DietLogItem, Food, FoodServing, Meal, MealItem, User
from BE.app.schemas import (
    CustomFoodCreate,
    CustomFoodListResponse,
    CustomFoodRead,
    CustomFoodUpdate,
    DietGoalRead,
    DietGoalRequest,
    DietHistoryResponse,
    DietLogCreate,
    DietLogItemRead,
    DietLogMealRead,
    DietLogRead,
    DietLogUpdate,
    DietSummary,
    FoodDetail,
    FoodListItem,
    FoodListResponse,
    FoodNutrition,
    FoodServingRead,
    LogItemInput,
    MealCreate,
    MealItemRead,
    MealListResponse,
    MealRead,
    MealUpdate,
    NutritionValues,
    Pagination,
)

router = APIRouter(prefix="/diet")
MEAL_TYPES = {"breakfast", "lunch", "dinner", "snack", "other"}


def _validate_query_date(value: str | None, *, required: bool = False) -> str | None:
    if value is None:
        if required:
            raise HTTPException(status_code=422, detail="date needs to be in YYYY-MM-DD format")
        return None
    try:
        parsed = datetime.strptime(value, "%Y-%m-%d")
    except ValueError as exc:
        raise HTTPException(status_code=422, detail="date needs to be in YYYY-MM-DD format") from exc
    if parsed.strftime("%Y-%m-%d") != value:
        raise HTTPException(status_code=422, detail="date needs to be in YYYY-MM-DD format")
    return value


def _nutrition(source: Any) -> FoodNutrition:
    return FoodNutrition(
        calories=source.calories_per_100g,
        protein_g=source.protein_per_100g,
        carbs_g=source.carbs_per_100g,
        fat_g=source.fat_per_100g,
        fiber_g=source.fiber_per_100g,
    )


def _scaled_nutrition(source: Any, quantity_g: float) -> NutritionValues:
    factor = quantity_g / 100
    return NutritionValues(
        calories=source.calories_per_100g * factor,
        protein_g=source.protein_per_100g * factor,
        carbs_g=source.carbs_per_100g * factor,
        fat_g=source.fat_per_100g * factor,
        fiber_g=source.fiber_per_100g * factor,
    )


def _food_item(source: Any, quantity_g: float) -> dict[str, float]:
    values = _scaled_nutrition(source, quantity_g)
    return values.model_dump()


def _custom_food_read(food: CustomFood) -> CustomFoodRead:
    return CustomFoodRead(
        custom_food_id=food.id,
        name=food.name,
        description=food.description,
        category=food.category,
        nutrition_per_100g=_nutrition(food),
        is_active=food.is_active,
    )


def _get_source(db: Session, current_user: User, item: LogItemInput | Any) -> tuple[Any, int | None, int | None]:
    has_food = item.food_id is not None
    has_custom = item.custom_food_id is not None
    if has_food == has_custom:
        raise HTTPException(status_code=422, detail="Provide exactly one of food_id or custom_food_id")

    if has_food:
        source = db.query(Food).filter(Food.id == item.food_id).first()
        if source is None:
            raise HTTPException(status_code=404, detail="Food not found")
        return source, source.id, None

    source = db.query(CustomFood).filter(
        CustomFood.id == item.custom_food_id,
        CustomFood.user_id == current_user.id,
        CustomFood.is_active.is_(True),
    ).first()
    if source is None:
        raise HTTPException(status_code=404, detail="Custom food not found")
    return source, None, source.id


def _validate_meal_type(meal_type: str) -> str:
    normalized = meal_type.strip().lower()
    if normalized not in MEAL_TYPES:
        raise HTTPException(status_code=422, detail="meal_type must be breakfast, lunch, dinner, snack, or other")
    return normalized


def _build_meal_response(db: Session, meal: Meal) -> MealRead:
    items = []
    total = NutritionValues()
    for item in meal.items:
        source = db.query(Food).filter(Food.id == item.food_id).first() if item.food_id else db.query(CustomFood).filter(CustomFood.id == item.custom_food_id).first()
        if source is None:
            continue
        values = _scaled_nutrition(source, item.quantity_g)
        total = NutritionValues(
            calories=total.calories + values.calories,
            protein_g=total.protein_g + values.protein_g,
            carbs_g=total.carbs_g + values.carbs_g,
            fat_g=total.fat_g + values.fat_g,
            fiber_g=total.fiber_g + values.fiber_g,
        )
        items.append(MealItemRead(
            food_id=item.food_id,
            custom_food_id=item.custom_food_id,
            serving_id=item.serving_id,
            name=source.name,
            quantity_g=item.quantity_g,
        ))
    return MealRead(meal_id=meal.id, name=meal.name, description=meal.description, nutrition=total, item_count=len(items), items=items)


def _build_log_response(log: DietLog) -> DietLogRead:
    grouped: dict[str, list[DietLogItem]] = {}
    for item in log.items:
        grouped.setdefault(item.meal_type, []).append(item)
    meals = []
    for meal_name, items in grouped.items():
        nutrition = NutritionValues(
            calories=sum(item.calories for item in items),
            protein_g=sum(item.protein_g for item in items),
            carbs_g=sum(item.carbs_g for item in items),
            fat_g=sum(item.fat_g for item in items),
            fiber_g=sum(item.fiber_g for item in items),
        )
        meals.append(DietLogMealRead(
            meal_name=meal_name,
            items=[DietLogItemRead(
                food_id=item.food_id,
                custom_food_id=item.custom_food_id,
                serving_id=item.serving_id,
                food_name=item.food_name,
                quantity_g=item.quantity_g,
                calories=item.calories,
                protein_g=item.protein_g,
                carbs_g=item.carbs_g,
                fat_g=item.fat_g,
                fiber_g=item.fiber_g,
            ) for item in items],
            nutrition=nutrition,
        ))
    return DietLogRead(log_id=log.id, date=log.date, last_updated=log.updated_at, meals=meals)


def _replace_log_items(db: Session, log: DietLog, payload: DietLogCreate, current_user: User) -> None:
    db.query(DietLogItem).filter(DietLogItem.log_id == log.id).delete()
    totals = NutritionValues()
    for meal in payload.meals:
        meal_type = _validate_meal_type(meal.meal_type)
        for item in meal.items:
            source, food_id, custom_food_id = _get_source(db, current_user, item)
            if item.serving_id is not None:
                serving = db.query(FoodServing).filter(
                    FoodServing.id == item.serving_id,
                    FoodServing.food_id == food_id,
                ).first()
                if serving is None:
                    raise HTTPException(status_code=404, detail="Serving not found for food")
            values = _scaled_nutrition(source, item.quantity_g)
            totals = NutritionValues(
                calories=totals.calories + values.calories,
                protein_g=totals.protein_g + values.protein_g,
                carbs_g=totals.carbs_g + values.carbs_g,
                fat_g=totals.fat_g + values.fat_g,
                fiber_g=totals.fiber_g + values.fiber_g,
            )
            db.add(DietLogItem(
                log_id=log.id,
                user_id=current_user.id,
                meal_type=meal_type,
                food_id=food_id,
                custom_food_id=custom_food_id,
                serving_id=item.serving_id,
                food_name=source.name,
                quantity_g=item.quantity_g,
                calories=values.calories,
                protein_g=values.protein_g,
                carbs_g=values.carbs_g,
                fat_g=values.fat_g,
                fiber_g=values.fiber_g,
            ))
    log.calories = totals.calories
    log.protein_g = totals.protein_g
    log.carbs_g = totals.carbs_g
    log.fat_g = totals.fat_g
    log.fiber_g = totals.fiber_g


@router.get("/foods", response_model=FoodListResponse, tags=["food"], summary="Search system foods", description="Search and paginate the shared food database.")
def list_foods(
    search: str | None = None,
    category: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Food)
    if search:
        query = query.filter(Food.name.ilike(f"%{search.strip()}%"))
    if category:
        query = query.filter(Food.category == category)
    total = query.count()
    foods = query.order_by(Food.name.asc()).offset((page - 1) * page_size).limit(page_size).all()
    return FoodListResponse(
        items=[FoodListItem(food_id=food.id, name=food.name, nutrition_per_100g=_nutrition(food)) for food in foods],
        pagination=Pagination(page=page, page_size=page_size, total=total),
    )


@router.get("/foods/{food_id}", response_model=FoodDetail, tags=["food"], summary="Get food details", description="Return nutrition per 100 grams and available servings for one food.")
def get_food(food_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    food = db.query(Food).filter(Food.id == food_id).first()
    if food is None:
        raise HTTPException(status_code=404, detail="Food not found")
    return FoodDetail(
        food_id=food.id,
        name=food.name,
        category=food.category,
        nutrition_per_100g=_nutrition(food),
        servings=[FoodServingRead(
            serving_id=serving.id,
            name=serving.name,
            quantity_g=serving.quantity_g,
            **_food_item(food, serving.quantity_g),
        ) for serving in food.servings],
    )


@router.post("/custom-foods", response_model=CustomFoodRead, status_code=status.HTTP_201_CREATED, tags=["custom-food"], summary="Create custom food", description="Create a food owned by the authenticated user.")
def create_custom_food(payload: CustomFoodCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    food = CustomFood(
        user_id=current_user.id,
        name=payload.name.strip(),
        description=payload.description,
        category=payload.category,
        calories_per_100g=payload.nutrition_per_100g.calories,
        protein_per_100g=payload.nutrition_per_100g.protein_g,
        carbs_per_100g=payload.nutrition_per_100g.carbs_g,
        fat_per_100g=payload.nutrition_per_100g.fat_g,
        fiber_per_100g=payload.nutrition_per_100g.fiber_g,
        is_active=payload.is_active,
    )
    db.add(food)
    db.commit()
    db.refresh(food)
    return _custom_food_read(food)


@router.get("/custom-foods", response_model=CustomFoodListResponse, tags=["custom-food"], summary="List custom foods", description="List active custom foods belonging only to the authenticated user.")
def list_custom_foods(
    search: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(CustomFood).filter(CustomFood.user_id == current_user.id, CustomFood.is_active.is_(True))
    if search:
        query = query.filter(CustomFood.name.ilike(f"%{search.strip()}%"))
    total = query.count()
    foods = query.order_by(CustomFood.name.asc()).offset((page - 1) * page_size).limit(page_size).all()
    return CustomFoodListResponse(
        items=[_custom_food_read(food) for food in foods],
        pagination=Pagination(page=page, page_size=page_size, total=total),
    )


@router.patch("/custom-foods/{custom_food_id}", response_model=CustomFoodRead, tags=["custom-food"], summary="Update custom food", description="Update one of the authenticated user's active custom foods.")
def update_custom_food(custom_food_id: int, payload: CustomFoodUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    food = db.query(CustomFood).filter(CustomFood.id == custom_food_id, CustomFood.user_id == current_user.id, CustomFood.is_active.is_(True)).first()
    if food is None:
        raise HTTPException(status_code=404, detail="Custom food not found")
    fields = payload.model_dump(exclude_none=True)
    nutrition = fields.pop("nutrition_per_100g", None)
    for key, value in fields.items():
        setattr(food, key, value)
    if nutrition:
        food.calories_per_100g = nutrition["calories"]
        food.protein_per_100g = nutrition["protein_g"]
        food.carbs_per_100g = nutrition["carbs_g"]
        food.fat_per_100g = nutrition["fat_g"]
        food.fiber_per_100g = nutrition["fiber_g"]
    db.commit()
    db.refresh(food)
    return _custom_food_read(food)


@router.delete("/custom-foods/{custom_food_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["custom-food"], summary="Delete custom food", description="Soft-delete a custom food while preserving historical log data.")
def delete_custom_food(custom_food_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    food = db.query(CustomFood).filter(CustomFood.id == custom_food_id, CustomFood.user_id == current_user.id, CustomFood.is_active.is_(True)).first()
    if food is None:
        raise HTTPException(status_code=404, detail="Custom food not found")
    food.is_active = False
    db.commit()


@router.post("/meals", response_model=MealRead, status_code=status.HTTP_201_CREATED, tags=["meals"], summary="Create saved meal", description="Save a reusable combination of system or custom foods.")
def create_meal(payload: MealCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    meal = Meal(user_id=current_user.id, name=payload.name.strip(), description=payload.description)
    db.add(meal)
    db.flush()
    _replace_meal_items(db, meal, payload.items, current_user)
    db.commit()
    db.refresh(meal)
    return _build_meal_response(db, meal)


def _replace_meal_items(db: Session, meal: Meal, items: list[Any], current_user: User) -> None:
    db.query(MealItem).filter(MealItem.meal_id == meal.id).delete()
    for item in items:
        source, food_id, custom_food_id = _get_source(db, current_user, item)
        serving_id = item.serving_id
        if serving_id is not None:
            serving = db.query(FoodServing).filter(FoodServing.id == serving_id, FoodServing.food_id == food_id).first()
            if serving is None:
                raise HTTPException(status_code=404, detail="Serving not found for food")
        db.add(MealItem(meal_id=meal.id, food_id=food_id, custom_food_id=custom_food_id, quantity_g=item.quantity_g, serving_id=serving_id))


@router.get("/meals", response_model=MealListResponse, tags=["meals"], summary="List saved meals", description="List active saved meals belonging to the authenticated user.")
def list_meals(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    meals = db.query(Meal).filter(Meal.user_id == current_user.id, Meal.is_active.is_(True)).order_by(Meal.name.asc()).all()
    return MealListResponse(meals=[_build_meal_response(db, meal) for meal in meals])


@router.patch("/meals/{meal_id}", response_model=MealRead, tags=["meals"], summary="Update saved meal", description="Update meal details or replace its complete item composition.")
def update_meal(meal_id: int, payload: MealUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    meal = db.query(Meal).filter(Meal.id == meal_id, Meal.user_id == current_user.id, Meal.is_active.is_(True)).first()
    if meal is None:
        raise HTTPException(status_code=404, detail="Meal not found")
    if payload.name is not None:
        meal.name = payload.name.strip()
    if payload.description is not None:
        meal.description = payload.description
    if payload.items is not None:
        _replace_meal_items(db, meal, payload.items, current_user)
    db.commit()
    db.refresh(meal)
    return _build_meal_response(db, meal)


@router.delete("/meals/{meal_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["meals"], summary="Delete saved meal", description="Soft-delete a saved meal without changing historical food logs.")
def delete_meal(meal_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    meal = db.query(Meal).filter(Meal.id == meal_id, Meal.user_id == current_user.id, Meal.is_active.is_(True)).first()
    if meal is None:
        raise HTTPException(status_code=404, detail="Meal not found")
    meal.is_active = False
    db.commit()


@router.post("/logs", response_model=DietLogRead, status_code=status.HTTP_201_CREATED, tags=["logs"], summary="Create or replace daily log", description="Create or replace the authenticated user's food log; omitted date defaults to today.")
def create_diet_log(payload: DietLogCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    log_date = payload.date or date.today().isoformat()
    log = db.query(DietLog).filter(DietLog.user_id == current_user.id, DietLog.date == log_date).first()
    if log is None:
        log = DietLog(user_id=current_user.id, date=log_date)
        db.add(log)
        db.flush()
    _replace_log_items(db, log, payload, current_user)
    db.commit()
    db.refresh(log)
    return _build_log_response(log)


@router.get("/logs", response_model=DietLogRead, tags=["logs"], summary="Get daily food log", description="Get a food log by date; omitted date defaults to today.")
def get_diet_log(log_date: str | None = Query(None, alias="date"), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    log_date = _validate_query_date(log_date) or date.today().isoformat()
    log = db.query(DietLog).filter(DietLog.user_id == current_user.id, DietLog.date == log_date).first()
    if log is None:
        raise HTTPException(status_code=404, detail="Diet log not found")
    return _build_log_response(log)


@router.patch("/logs/{log_id}", response_model=DietLogRead, tags=["logs"], summary="Edit daily food log", description="Replace a daily log's meals and recalculate all nutrition totals.")
def update_diet_log(log_id: int, payload: DietLogUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    log = db.query(DietLog).filter(DietLog.id == log_id, DietLog.user_id == current_user.id).first()
    if log is None:
        raise HTTPException(status_code=404, detail="Diet log not found")
    log.date = payload.date
    _replace_log_items(db, log, payload, current_user)
    db.commit()
    db.refresh(log)
    return _build_log_response(log)


@router.delete("/logs/{log_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["logs"], summary="Delete daily food log", description="Permanently delete the authenticated user's food log.")
def delete_diet_log(log_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    log = db.query(DietLog).filter(DietLog.id == log_id, DietLog.user_id == current_user.id).first()
    if log is None:
        raise HTTPException(status_code=404, detail="Diet log not found")
    db.delete(log)
    db.commit()


@router.get("/summary", response_model=DietSummary, tags=["summary/history"], summary="Get daily nutrition summary", description="Return consumed, target, remaining, and meal-level nutrition totals for a date.")
def get_diet_summary(log_date: str | None = Query(None, alias="date"), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    target_date = _validate_query_date(log_date) or date.today().isoformat()
    log = db.query(DietLog).filter(DietLog.user_id == current_user.id, DietLog.date == target_date).first()
    goal = db.query(DietGoal).filter(DietGoal.user_id == current_user.id).first()
    targets = goal or DietGoal(calorie_target=0, protein_target_g=0, carbs_target_g=0, fat_target_g=0)
    consumed = NutritionValues(
        calories=log.calories if log else 0,
        protein_g=log.protein_g if log else 0,
        carbs_g=log.carbs_g if log else 0,
        fat_g=log.fat_g if log else 0,
        fiber_g=log.fiber_g if log else 0,
    )
    meals = {meal_type: NutritionValues() for meal_type in MEAL_TYPES}
    if log:
        for item in log.items:
            meal = meals[item.meal_type]
            meals[item.meal_type] = NutritionValues(
                calories=meal.calories + item.calories,
                protein_g=meal.protein_g + item.protein_g,
                carbs_g=meal.carbs_g + item.carbs_g,
                fat_g=meal.fat_g + item.fat_g,
                fiber_g=meal.fiber_g + item.fiber_g,
            )
    return DietSummary(
        date=target_date,
        calories={"consumed": consumed.calories, "target": targets.calorie_target, "remaining": targets.calorie_target - consumed.calories},
        macros={
            "protein": {"consumed_g": consumed.protein_g, "target_g": targets.protein_target_g, "remaining_g": targets.protein_target_g - consumed.protein_g},
            "carbs": {"consumed_g": consumed.carbs_g, "target_g": targets.carbs_target_g, "remaining_g": targets.carbs_target_g - consumed.carbs_g},
            "fat": {"consumed_g": consumed.fat_g, "target_g": targets.fat_target_g, "remaining_g": targets.fat_target_g - consumed.fat_g},
        },
        meals=meals,
    )


@router.get("/history", response_model=DietHistoryResponse, tags=["summary/history"], summary="Get diet history", description="Return daily nutrition totals and averages between two YYYY-MM-DD dates.")
def get_diet_history(start_date: str, end_date: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    start_date = _validate_query_date(start_date, required=True)
    end_date = _validate_query_date(end_date, required=True)
    logs = db.query(DietLog).filter(DietLog.user_id == current_user.id, DietLog.date >= start_date, DietLog.date <= end_date).order_by(DietLog.date.asc()).all()
    days = [DietHistoryDay(date=log.date, calories=log.calories, protein_g=log.protein_g, carbs_g=log.carbs_g, fat_g=log.fat_g) for log in logs]
    count = len(days) or 1
    return DietHistoryResponse(
        start_date=start_date,
        end_date=end_date,
        days=days,
        average=NutritionValues(
            calories=sum(day.calories for day in days) / count,
            protein_g=sum(day.protein_g for day in days) / count,
            carbs_g=sum(day.carbs_g for day in days) / count,
            fat_g=sum(day.fat_g for day in days) / count,
        ),
    )


@router.get("/goals", response_model=DietGoalRead, tags=["goals"], summary="Get nutrition goals", description="Return the authenticated user's calorie and macro targets.")
def get_diet_goals(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    goal = db.query(DietGoal).filter(DietGoal.user_id == current_user.id).first()
    if goal is None:
        return DietGoalRead(calories=0, protein_g=0, carbs_g=0, fat_g=0)
    return DietGoalRead(calories=goal.calorie_target, protein_g=goal.protein_target_g, carbs_g=goal.carbs_target_g, fat_g=goal.fat_target_g)


@router.put("/goals", response_model=DietGoalRead, tags=["goals"], summary="Update nutrition goals", description="Create or replace the authenticated user's calorie and macro targets.")
def update_diet_goals(payload: DietGoalRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    goal = db.query(DietGoal).filter(DietGoal.user_id == current_user.id).first()
    if goal is None:
        goal = DietGoal(user_id=current_user.id)
        db.add(goal)
    goal.calorie_target = payload.calories
    goal.protein_target_g = payload.protein_g
    goal.carbs_target_g = payload.carbs_g
    goal.fat_target_g = payload.fat_g
    db.commit()
    return DietGoalRead(calories=goal.calorie_target, protein_g=goal.protein_target_g, carbs_g=goal.carbs_target_g, fat_g=goal.fat_target_g)
