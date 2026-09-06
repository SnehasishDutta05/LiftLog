# LiftLog

This is a web app where you can book gym sessions, track workouts and meals, and get customised training and diet suggestions from a personal AI trainer.

# Fitness App — Backend Project Context

## 1. Project Overview

A fitness web/PWA application with three main areas:

1. **Book a gym/swimming/etc. session**
2. **Track gym workouts and progress**
3. **Track macros/nutrition**

The application will eventually have an **AI Coach**.

The workout tracking module is completed, and the current development focus is the **Diet Tracking module**.

The workout experience is inspired by the functional structure of apps like **Hevy**, while the diet experience follows a HealthifyMe-style food/nutrition tracking model.

---

# 2. Technology Direction

## Backend

- Python
- FastAPI
- PostgreSQL
- REST APIs
- Token-based authentication
- User identity obtained from the access token

The architecture should remain simple and understandable.

## Frontend

Planned as a web application/PWA to provide an app-like experience.

---

# 3. Authentication Concept

The user signs in using:

- Google
- Phone number
- Email

After authentication, the backend issues an access token.

For API requests:

```http
Authorization: Bearer <access_token>
```

The frontend should **NOT** send `user_id` as a request parameter for normal authenticated APIs.

FastAPI should:

```text
Request
  ↓
Validate access token
  ↓
Extract user_id
  ↓
Use user_id internally
  ↓
Query only that user's data
```

Example:

```http
GET /api/v1/routines
Authorization: Bearer <access_token>
```

NOT:

```http
GET /api/v1/routines?user_id=123
```

All user-specific diet APIs must follow the same rule.

---

# 4. Workout Tracking

The workout tracking module is already implemented/completed.

The core concepts are:

- Routine = reusable workout template
- Workout = actual workout session
- Exercise = centralized exercise definition
- Workout Exercise = exercise performed in a workout
- Workout Set = individual weight/reps set

Existing workout functionality includes:

- Saved routines
- Starting workouts
- Adding exercises
- Adding sets
- Previous exercise performance
- Workout completion
- Workout history/progress

The existing workout APIs include:

```http
GET    /api/v1/routines
POST   /api/v1/routines
GET    /api/v1/routines/{routine_id}
PATCH  /api/v1/routines/{routine_id}
DELETE /api/v1/routines/{routine_id}

POST   /api/v1/workouts
GET    /api/v1/workouts
GET    /api/v1/workouts/{workout_id}
POST   /api/v1/workouts/{workout_id}/complete

POST   /api/v1/workouts/{workout_id}/exercises
POST   /api/v1/workout-exercises/{id}/sets
```

---

# 5. Diet Tracking — Overview

The Diet Tracking module is designed around the same basic experience as HealthifyMe.

The user should be able to:

- Have a daily calorie and macro target
- Search/browse foods
- See nutritional information
- Select human-friendly serving sizes
- Log food into a particular meal
- Create custom foods
- Save frequently consumed combinations as meals
- Add saved meals to a day
- Edit/delete logged food
- View daily calories and macros
- View historical nutrition
- Eventually provide diet information to the AI Coach

High-level flow:

```text
Food Database
    |
    +-- System Foods
    |
    +-- User Custom Foods
             |
             v
       Saved Meal
             |
             v
         Daily Log
             |
             v
      Daily Nutrition
             |
             v
          AI Coach
```

---

# 6. Diet Core Concepts

There are four concepts that should NOT be mixed together.

## Food

A single food item.

Examples:

- Cooked Rice
- Banana
- Chicken Breast
- Egg
- Milk

## Serving

A human-friendly quantity of a food.

Example:

```text
Cooked Rice
100 g
Small Bowl = 150 g
Medium Bowl = 200 g
Large Bowl = 300 g
```

Example:

```text
Banana
100 g
Small Banana = 80 g
Medium Banana = 118 g
Large Banana = 136 g
```

The food's nutritional information is ultimately based on grams.

## Meal

A reusable combination of foods.

Example:

```text
Meal: My Breakfast

2 Eggs
2 slices Bread
1 Banana
250 ml Milk
```

## Food Log

The actual food consumed on a particular date.

Example:

```text
2026-09-06

Breakfast
2 Eggs
2 slices Bread
1 Banana

Lunch
250g Rice
150g Chicken
Vegetables
```

A saved meal is a reusable template, while a food log is historical consumption data.

---

# 7. Diet API Structure

Base path:

```text
/api/v1/diet
```

API groups:

```text
/api/v1/diet/summary
/api/v1/diet/foods
/api/v1/diet/custom-foods
/api/v1/diet/meals
/api/v1/diet/logs
/api/v1/diet/goals
/api/v1/diet/history
```

Complete endpoint list:

```http
GET    /api/v1/diet/summary

GET    /api/v1/diet/foods
GET    /api/v1/diet/foods/{food_id}

POST   /api/v1/diet/custom-foods
GET    /api/v1/diet/custom-foods
GET    /api/v1/diet/custom-foods/{custom_food_id}
PATCH  /api/v1/diet/custom-foods/{custom_food_id}
DELETE /api/v1/diet/custom-foods/{custom_food_id}

POST   /api/v1/diet/meals
GET    /api/v1/diet/meals
GET    /api/v1/diet/meals/{meal_id}
PATCH  /api/v1/diet/meals/{meal_id}
DELETE /api/v1/diet/meals/{meal_id}

POST   /api/v1/diet/logs
GET    /api/v1/diet/logs
PATCH  /api/v1/diet/logs/{log_id}
DELETE /api/v1/diet/logs/{log_id}

GET    /api/v1/diet/history

GET    /api/v1/diet/goals
PUT    /api/v1/diet/goals
```

---

# 8. API — Daily Nutrition Summary

## Endpoint

```http
GET /api/v1/diet/summary
```

## Query Parameters

```text
date
```

Example:

```http
GET /api/v1/diet/summary?date=2026-09-06
```

If `date` is omitted, default to today.

## Response

```json
{
  "date": "2026-09-06",
  "calories": {
    "consumed": 1850,
    "target": 2500,
    "remaining": 650
  },
  "macros": {
    "protein": {
      "consumed_g": 135,
      "target_g": 170,
      "remaining_g": 35
    },
    "carbs": {
      "consumed_g": 210,
      "target_g": 280,
      "remaining_g": 70
    },
    "fat": {
      "consumed_g": 55,
      "target_g": 75,
      "remaining_g": 20
    }
  },
  "meals": {
    "breakfast": {
      "calories": 450,
      "protein_g": 50,
      "carbs_g": 50,
      "fat_g": 50
    },
    "lunch": {
      "calories": 700,
      "protein_g": 50,
      "carbs_g": 50,
      "fat_g": 50
    },
    "snack": {
      "calories": 250,
      "protein_g": 50,
      "carbs_g": 50,
      "fat_g": 50
    },
    "dinner": {
      "calories": 450,
      "protein_g": 50,
      "carbs_g": 50,
      "fat_g": 50
    }
  }
}
```

Calculations:

```text
consumed calories =
SUM(all food log calories for the date)

remaining calories =
target calories - consumed calories
```

The same calculation applies to protein, carbohydrates and fat.

If the user exceeds the target, `remaining` can be negative.

Example:

```json
{
  "remaining": -250
}
```

The frontend can display:

```text
250 kcal over target
```

---

# 9. API — Food Database

## Endpoint

```http
GET /api/v1/diet/foods
```

This API supports food search.

## Query Parameters

```text
search
category
page
page_size
```

Example:

```http
GET /api/v1/diet/foods?search=rice
```

## Response

```json
{
  "items": [
    {
      "food_id": 101,
      "name": "Cooked Rice",
      "nutrition_per_100g": {
        "calories": 130,
        "protein_g": 2.7,
        "carbs_g": 28.2,
        "fat_g": 0.3
      }
    },
    {
      "food_id": 102,
      "name": "Fried Rice",
      "nutrition_per_100g": {
        "calories": 150,
        "protein_g": 1.7,
        "carbs_g": 29.2,
        "fat_g": 0.9
      }
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 1
  }
}
```

---

# 10. API — Get Food Details

## Endpoint

```http
GET /api/v1/diet/foods/{food_id}
```

Example response:

```json
{
  "food_id": 101,
  "name": "Cooked Rice",
  "category": "Grains",
  "nutrition_per_100g": {
    "calories": 130,
    "protein_g": 2.7,
    "carbs_g": 28.2,
    "fat_g": 0.3
  },
  "servings": [
    {
      "serving_id": 1011,
      "name": "Small Bowl",
      "quantity_g": 150,
      "calories": 195,
      "protein_g": 4.05,
      "carbs_g": 42.3,
      "fat_g": 0.45
    },
    {
      "serving_id": 1012,
      "name": "Medium Bowl",
      "quantity_g": 200,
      "calories": 260,
      "protein_g": 5.4,
      "carbs_g": 56.4,
      "fat_g": 0.6
    },
    {
      "serving_id": 1013,
      "name": "Large Bowl",
      "quantity_g": 300,
      "calories": 390,
      "protein_g": 8.1,
      "carbs_g": 84.6,
      "fat_g": 0.9
    }
  ]
}
```

---

# 11. Food Serving Design

Do NOT store:

```text
small bowl = 195 calories
```

as the primary nutritional information.

Instead store:

```text
small bowl = 150g
```

and calculate nutrition from the food's gram-based nutrition.

Example:

```text
Rice:
130 kcal / 100g

Small bowl:
150g

Calories:
130 × 150 / 100
= 195 kcal
```

This gives flexibility for arbitrary quantities.

For example:

```text
250g
```

can be calculated even when there is no predefined serving for exactly 250g.

## Recommended Nutrition Storage

Store nutrition per 100g:

```text
calories_per_100g
protein_per_100g
carbs_per_100g
fat_per_100g
fiber_per_100g
```

Calculation:

```text
nutrition = nutrition_per_100g × quantity_g / 100
```

The backend should have a centralized `NutritionCalculator` service so that nutrition calculations are not duplicated across APIs.

---

# 12. Food Database Schema

## foods

```text
food_id                 BIGINT PK
name                    VARCHAR
description             TEXT NULL
category                VARCHAR
brand                   VARCHAR NULL
calories_per_100g       DECIMAL
protein_per_100g        DECIMAL
carbs_per_100g          DECIMAL
fat_per_100g            DECIMAL
fiber_per_100g          DECIMAL NULL
is_system_food          BOOLEAN
source                  VARCHAR NULL
is_active               BOOLEAN
created_at              TIMESTAMP
updated_at              TIMESTAMP
```

The database should distinguish between raw and cooked/prepared foods where nutrition differs.

Examples:

```text
Rice, raw
Rice, cooked

Chicken breast, raw
Chicken breast, cooked
```

---

# 13. Food Servings Table

## food_servings

```text
serving_id      BIGINT PK
food_id         BIGINT FK -> foods.food_id
name            VARCHAR
quantity_g      DECIMAL
created_at      TIMESTAMP
```

Examples:

```text
food_id | name          | quantity_g
--------------------------------------
101     | Small Bowl    | 150
101     | Medium Bowl   | 200
101     | Large Bowl    | 300
```

The canonical quantity should be grams.

For V1, human-friendly servings are simply aliases that resolve to grams.

---

# 14. API — Custom Food

This is used when a food does not exist in the system database.

## Endpoint

```http
POST /api/v1/diet/custom-foods
```

## Request

```json
{
  "name": "Homemade Chicken Curry",
  "description": "Chicken curry prepared at home",
  "category": "Indian",
  "nutrition_per_100g": {
    "calories": 180,
    "protein_g": 20,
    "carbs_g": 5,
    "fat_g": 9,
    "fiber_g": 1
  },
  "is_active": true
}
```

## Response

```json
{
  "food_id": 5001,
  "name": "Homemade Chicken Curry",
  "nutrition_per_100g": {
    "calories": 180,
    "protein_g": 20,
    "carbs_g": 5,
    "fat_g": 9,
    "fiber_g": 1
  },
  "is_active": true
}
```

---

# 15. Custom Food Database

Custom foods belong to individual users.

## custom_foods

```text
custom_food_id          BIGINT PK
user_id                 BIGINT FK
name                    VARCHAR
description             TEXT
category                VARCHAR
calories_per_100g       DECIMAL
protein_per_100g        DECIMAL
carbs_per_100g          DECIMAL
fat_per_100g            DECIMAL
fiber_per_100g          DECIMAL NULL
created_at              TIMESTAMP
updated_at              TIMESTAMP
is_active               BOOLEAN
```

Every query must filter by:

```text
user_id = current_user.id
```

A user must never be able to access another user's custom foods.

Never accept arbitrary `user_id` from the frontend.

---

# 16. API — Get Custom Foods

## Endpoint

```http
GET /api/v1/diet/custom-foods
```

## Query Parameters

```text
search
page
page_size
```

Example:

```http
GET /api/v1/diet/custom-foods?search=chicken
```

Only active custom foods should be returned.

## Response

```json
{
  "items": [
    {
      "custom_food_id": 501,
      "name": "Homemade Chicken Curry",
      "nutrition_per_100g": {
        "calories": 180,
        "protein_g": 20,
        "carbs_g": 5,
        "fat_g": 9,
        "fiber_g": 1
      }
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 1
  }
}
```

---

# 17. API — Update Custom Food

## Endpoint

```http
PATCH /api/v1/diet/custom-foods/{custom_food_id}
```

Example:

```http
PATCH /api/v1/diet/custom-foods/501
```

## Request

```json
{
  "name": "Homemade Chicken Curry",
  "nutrition_per_100g": {
    "calories": 190,
    "protein_g": 21,
    "carbs_g": 5,
    "fat_g": 9.5,
    "fiber_g": 1
  }
}
```

Historical logs must remain unchanged after a custom food is edited.

---

# 18. API — Delete Custom Food

## Endpoint

```http
DELETE /api/v1/diet/custom-foods/{custom_food_id}
```

Prefer soft deletion.

Do not physically delete a custom food if it has already been used in historical logs.

Use:

```text
is_active = false
```

This preserves historical data.

---

# 19. API — Saved Meals

A saved meal is a reusable collection of foods.

Example:

```text
Meal: My Breakfast

2 Eggs
2 Bread
1 Banana
250ml Milk
```

A saved meal is a template and is not itself historical consumption.

---

# 20. Saved Meal Database

## meals

```text
meal_id         BIGINT PK
user_id         BIGINT FK
name            VARCHAR
description     TEXT
is_active       BOOLEAN
created_at      TIMESTAMP
updated_at      TIMESTAMP
```

## meal_items

```text
meal_item_id        BIGINT PK
meal_id             BIGINT FK
food_id             BIGINT NULL FK
custom_food_id      BIGINT NULL FK
quantity_g          DECIMAL
serving_id          BIGINT NULL FK
created_at          TIMESTAMP
```

Important constraint:

```text
food_id XOR custom_food_id
```

Each meal item must refer to either:

```text
System food
```

OR:

```text
Custom food
```

but never both.

---

# 21. API — Create Saved Meal

## Endpoint

```http
POST /api/v1/diet/meals
```

## Request

```json
{
  "name": "My Breakfast",
  "items": [
    {
      "food_id": 101,
      "quantity_g": 200
    },
    {
      "food_id": 102,
      "quantity_g": 118
    },
    {
      "custom_food_id": 501,
      "quantity_g": 150
    }
  ]
}
```

The backend calculates the nutritional totals.

## Response

```json
{
  "meal_id": 201,
  "name": "My Breakfast",
  "items": [
    {
      "food_id": 101,
      "name": "Cooked Rice",
      "quantity_g": 200
    },
    {
      "food_id": 102,
      "name": "Banana",
      "quantity_g": 118
    },
    {
      "custom_food_id": 501,
      "name": "Homemade Chicken Curry",
      "quantity_g": 150
    }
  ],
  "nutrition": {
    "calories": 620,
    "protein_g": 32,
    "carbs_g": 72,
    "fat_g": 18
  }
}
```

---

# 22. API — Get Saved Meals

## Endpoint

```http
GET /api/v1/diet/meals
```

## Response

```json
{
  "meals": [
    {
      "meal_id": 201,
      "name": "My Breakfast",
      "nutrition": {
        "calories": 620,
        "protein_g": 32,
        "carbs_g": 72,
        "fat_g": 18
      },
      "item_count": 3,
      "items": [
        {
          "food_id": 101,
          "name": "Cooked Rice",
          "quantity_g": 200
        },
        {
          "food_id": 102,
          "name": "Banana",
          "quantity_g": 118
        }
      ]
    }
  ]
}
```

---

# 23. API — Update Saved Meal

## Endpoint

```http
PATCH /api/v1/diet/meals/{meal_id}
```

## Request

```json
{
  "name": "High Protein Breakfast",
  "items": [
    {
      "food_id": 103,
      "quantity_g": 200
    },
    {
      "food_id": 102,
      "quantity_g": 118
    }
  ]
}
```

The complete meal composition can be replaced.

The backend recalculates the nutritional totals.

---

# 24. API — Delete Saved Meal

## Endpoint

```http
DELETE /api/v1/diet/meals/{meal_id}
```

Prefer soft deletion if necessary.

Deleting a saved meal must NOT delete historical food logs that were created from that meal.

---

# 25. API — Log Food

This is the core API for recording actual consumption.

## Endpoint

```http
POST /api/v1/diet/logs
```

## Request

The request structure can contain multiple meal groups for a date.

```json
{
  "date": "2026-09-06",
  "meals": [
    {
      "meal_type": "Breakfast",
      "items": [
        {
          "food_id": 101,
          "quantity_g": 200
        },
        {
          "food_id": 102,
          "quantity_g": 118
        },
        {
          "custom_food_id": 501,
          "quantity_g": 150
        }
      ]
    },
    {
      "meal_type": "Lunch",
      "items": [
        {
          "food_id": 101,
          "quantity_g": 200
        },
        {
          "food_id": 102,
          "quantity_g": 118
        },
        {
          "custom_food_id": 501,
          "quantity_g": 150
        }
      ]
    }
  ]
}
```

The backend should:

1. Validate the food/custom food belongs to the user or is a valid system food.
2. Calculate nutrition.
3. Store the food log.
4. Store a nutrition snapshot.
5. Return the resulting daily log.

---

# 26. Food Log Database

## diet_logs

Recommended design:

```text
log_id                  BIGINT PK
user_id                 BIGINT FK
date                    DATE
created_at              TIMESTAMP
updated_at              TIMESTAMP
```

## logs_meals / diet_log_items

The individual consumed foods should be stored in a child table.

Recommended structure:

```text
log_item_id             BIGINT PK
log_id                  BIGINT FK
user_id                 BIGINT FK
meal_type               ENUM
food_id                 BIGINT NULL FK
custom_food_id          BIGINT NULL FK
quantity_g              DECIMAL

calories                DECIMAL
protein_g               DECIMAL
carbs_g                  DECIMAL
fat_g                   DECIMAL
fiber_g                 DECIMAL NULL

created_at              TIMESTAMP
updated_at              TIMESTAMP
```

Important constraint:

```text
food_id XOR custom_food_id
```

A log item refers to either a system food or a custom food.

---

# 27. Historical Nutrition Snapshot

This is important.

When food is logged, store the calculated nutritional values in the log item:

```text
calories
protein_g
carbs_g
fat_g
fiber_g
```

Do not recalculate historical logs from the current food table every time.

Reason:

```text
Today:
Chicken = 180 kcal / 100g

User logs 200g

Historical log:
360 kcal
```

Later the food database is updated:

```text
Chicken = 170 kcal / 100g
```

The old log should still show:

```text
360 kcal
```

This keeps historical nutrition accurate.

The same applies when a user edits a custom food.

---

# 28. Meal Types

Use an enum.

Allowed values:

```text
BREAKFAST
LUNCH
DINNER
SNACK
OTHER
```

Database values:

```text
breakfast
lunch
dinner
snack
other
```

Do not hardcode arbitrary meal-type strings throughout the backend.

---

# 29. API — Get Daily Food Logs

## Endpoint

```http
GET /api/v1/diet/logs?date=2026-09-06
```

## Response

```json
{
  "log_id": 5001,
  "date": "2026-09-06",
  "last_updated": "2026-09-06T09:15:00Z",
  "meals": [
    {
      "meal_name": "Breakfast",
      "items": [
        {
          "food_name": "rice",
          "quantity_g": 200,
          "calories": 143,
          "protein_g": 12.6,
          "carbs_g": 1.1,
          "fat_g": 9.5
        },
        {
          "food_id": "fried_rice",
          "quantity_g": 118,
          "calories": 143,
          "protein_g": 12.6,
          "carbs_g": 1.1,
          "fat_g": 9.5
        },
        {
          "custom_food_id": "chicken bhuna",
          "quantity_g": 150,
          "calories": 143,
          "protein_g": 12.6,
          "carbs_g": 1.1,
          "fat_g": 9.5
        }
      ],
      "nutrition": {
        "calories": 325,
        "protein_g": 6.75,
        "carbs_g": 70.5,
        "fat_g": 0.75
      }
    },
    {
      "meal_name": "Lunch",
      "items": [
        {
          "food_name": "rice",
          "quantity_g": 200,
          "calories": 143,
          "protein_g": 12.6,
          "carbs_g": 1.1,
          "fat_g": 9.5
        },
        {
          "food_id": "fried_rice",
          "quantity_g": 118,
          "calories": 143,
          "protein_g": 12.6,
          "carbs_g": 1.1,
          "fat_g": 9.5
        },
        {
          "custom_food_id": "chicken bhuna",
          "quantity_g": 150,
          "calories": 143,
          "protein_g": 12.6,
          "carbs_g": 1.1,
          "fat_g": 9.5
        }
      ],
      "nutrition": {
        "calories": 325,
        "protein_g": 6.75,
        "carbs_g": 70.5,
        "fat_g": 0.75
      }
    }
  ]
}
```

The response should group individual food logs by meal type.

---

# 30. API — Edit Food Log

## Endpoint

```http
PATCH /api/v1/diet/logs/{log_id}
```

## Request

The request structure is the same as the POST request used to create the log.

```json
{
  "date": "2026-09-06",
  "meals": [
    {
      "meal_type": "Breakfast",
      "items": [
        {
          "food_id": 101,
          "quantity_g": 300
        },
        {
          "food_id": 102,
          "quantity_g": 118
        },
        {
          "custom_food_id": 501,
          "quantity_g": 150
        }
      ]
    },
    {
      "meal_type": "Lunch",
      "items": [
        {
          "food_id": 101,
          "quantity_g": 200
        },
        {
          "food_id": 102,
          "quantity_g": 118
        },
        {
          "custom_food_id": 501,
          "quantity_g": 150
        }
      ]
    }
  ]
}
```

The backend compares the request with the existing database state and updates the changed data accordingly.

The backend recalculates:

```text
calories
protein
carbs
fat
fiber
```

The historical nutrition snapshot should be updated only for the log being edited.

---

# 31. API — Delete Food Log

## Endpoint

```http
DELETE /api/v1/diet/logs/{log_id}
```

## Response

```http
204 No Content
```

Deleting a food log should remove the corresponding actual consumption record, but should not delete the underlying food or saved meal.

---

# 32. API — Diet History

Useful for both the frontend and the future AI Coach.

## Endpoint

```http
GET /api/v1/diet/history
```

## Query Parameters

```text
start_date
end_date
```

Example:

```http
GET /api/v1/diet/history?start_date=2026-09-01&end_date=2026-09-07
```

## Response

```json
{
  "start_date": "2026-09-01",
  "end_date": "2026-09-07",
  "days": [
    {
      "date": "2026-09-01",
      "calories": 2450,
      "protein_g": 165,
      "carbs_g": 280,
      "fat_g": 72
    },
    {
      "date": "2026-09-02",
      "calories": 2510,
      "protein_g": 172,
      "carbs_g": 290,
      "fat_g": 75
    }
  ],
  "average": {
    "calories": 2480,
    "protein_g": 168,
    "carbs_g": 285,
    "fat_g": 73
  }
}
```

This endpoint should provide aggregated nutrition rather than dumping every raw food log when only summary data is needed.

---

# 33. API — Nutrition Goals

The calorie budget and macro targets should come from the user's diet goals.

## Get Goals

```http
GET /api/v1/diet/goals
```

## Response

```json
{
  "calories": 2500,
  "protein_g": 170,
  "carbs_g": 280,
  "fat_g": 75
}
```

---

# 34. API — Update Nutrition Goals

## Endpoint

```http
PUT /api/v1/diet/goals
```

## Request

```json
{
  "calories": 2500,
  "protein_g": 170,
  "carbs_g": 280,
  "fat_g": 75
}
```

A user should have one active goal configuration in V1.

---

# 35. Diet Goals Database

## diet_goals

```text
goal_id             BIGINT PK
user_id             BIGINT FK UNIQUE
calorie_target      DECIMAL
protein_target_g    DECIMAL
carbs_target_g      DECIMAL
fat_target_g        DECIMAL
created_at          TIMESTAMP
updated_at          TIMESTAMP
```

A user should have one active goal configuration.

Later, if required, this can be extended to support historical goals.

---

# 36. Saved Meal Logging

A useful future/current flow is:

```text
User opens saved meals
        ↓
Selects "My Breakfast"
        ↓
Backend expands meal items
        ↓
Creates individual diet log items
        ↓
Daily nutrition is updated
```

The saved meal itself should remain a template.

When a saved meal is logged, historical food logs should contain individual food items so that the user can later edit or delete them.

---

# 37. Serving Input Design

The frontend can support either grams or predefined servings.

Example serving-based request:

```json
{
  "date": "2026-09-06",
  "meal_type": "breakfast",
  "food_id": 101,
  "serving_id": 1002,
  "quantity": 2
}
```

If:

```text
Medium Bowl = 200g
```

then:

```text
2 × 200g = 400g
```

The backend resolves this into grams.

Recommended V1 approach:

```text
Frontend:
serving_id + serving quantity

Backend:
resolve to quantity_g

Database:
store quantity_g as canonical value
```

If historical UI needs the exact serving label, the log can additionally store serving metadata/snapshot.

---

# 38. Important Database Rules

## User Isolation

Every user-specific query must use the authenticated user's ID.

Example:

```text
WHERE user_id = current_user.id
```

Never trust a user_id supplied by the frontend.

## Food Source Constraint

For food references:

```text
food_id XOR custom_food_id
```

Exactly one should be present.

## Historical Data

Store nutrition snapshots in food logs.

Changing a food later must not change historical consumption.

## Soft Delete

Prefer:

```text
is_active = false
```

for custom foods and saved meals where historical/reference data makes physical deletion undesirable.

---

# 39. Recommended Indexes

Recommended indexes:

```text
diet_logs(user_id, date)

diet_log_items(user_id, log_id)

diet_log_items(user_id, meal_type)

custom_foods(user_id)

custom_foods(user_id, name)

meals(user_id)

meal_items(meal_id)

food_servings(food_id)

foods(name)

foods(category)
```

For a larger food database, PostgreSQL full-text search or trigram search can be considered for food search.

---

# 40. Food Search

Food search should support:

- Exact name matches
- Prefix matches
- Partial matches
- Category filtering
- Pagination

Example:

```http
GET /api/v1/diet/foods?search=chicken&page=1&page_size=20
```

A useful future ranking strategy:

```text
Exact match
    ↓
Prefix match
    ↓
Popular food
    ↓
Frequently used by user
    ↓
Partial match
```

---

# 41. Food Data Quality

Food nutrition data is one of the most important parts of the diet system.

Important considerations:

- Clearly distinguish raw vs cooked foods.
- Keep nutrition values consistent.
- Use a reliable food database.
- Store the source of system food data where possible.
- Avoid mixing nutrition values from incompatible sources without normalization.
- For Indian foods, include common Indian meals and ingredients.
- Packaged/brand foods can later be added separately.

Examples:

```text
Rice, raw
Rice, cooked

Chicken breast, raw
Chicken breast, cooked

Potato, raw
Potato, boiled
Potato, fried
```

The preparation state can significantly affect nutrition per 100g.

---

# 42. Nutrition Calculation Service

Create a centralized backend service:

```text
NutritionCalculator
```

Responsibilities:

```text
Food + quantity_g
        ↓
NutritionCalculator
        ↓
Calories
Protein
Carbs
Fat
Fiber
```

Formula:

```text
value = value_per_100g × quantity_g / 100
```

This service should be reused by:

- Food detail responses
- Custom food calculations
- Saved meal calculations
- Food logging
- Food log editing
- Daily summary
- History calculations

Avoid duplicating the same formula in multiple API route handlers.

---

# 43. Diet Analytics for AI Coach

The future AI Coach should not receive large amounts of raw database data unnecessarily.

Create a service such as:

```text
DietAnalyticsService
```

It can generate:

```text
Last 7 days average calories
Last 7 days average protein
Last 7 days average carbs
Last 7 days average fat
Calorie target adherence
Protein target adherence
Number of logged days
Average daily calories
Highest calorie day
Lowest calorie day
```

Example AI context:

```text
Diet summary - last 7 days

Average calories: 2410 kcal
Target: 2500 kcal

Average protein: 164g
Target: 170g

Average carbs: 275g
Target: 280g

Average fat: 72g
Target: 75g

Logged days: 7/7
```

This is much more useful to the LLM than sending every raw log.

---

# 44. Frontend Diet Screen

A possible main diet screen:

```text
TODAY

Calories
1850 / 2500 kcal

Remaining
650 kcal

Protein
135 / 170g

Carbs
210 / 280g

Fat
55 / 75g


Breakfast
----------------
Eggs
Banana
Bread

450 kcal


Lunch
----------------
Rice
Chicken
Vegetables

700 kcal


Snack
----------------
250 kcal


Dinner
----------------
450 kcal


+ Add Food
+ Add Meal
```

The screen can use:

```http
GET /api/v1/diet/summary?date=2026-09-06
GET /api/v1/diet/logs?date=2026-09-06
```

---

# 45. Suggested Diet User Flow

## Add Individual Food

```text
Diet Page
    ↓
+ Add Food
    ↓
Search Food
    ↓
Select Food
    ↓
Select Serving / Enter grams
    ↓
Select Meal Type
    ↓
Save
    ↓
POST /api/v1/diet/logs
```

## Add Saved Meal

```text
Diet Page
    ↓
+ Add Meal
    ↓
Select Saved Meal
    ↓
Select Meal Type
    ↓
Log Meal
    ↓
Backend expands meal
    ↓
Individual food logs created
```

## Create Custom Food

```text
Add Food
    ↓
Can't find food
    ↓
Create Custom Food
    ↓
Enter name
    ↓
Enter nutrition per 100g
    ↓
POST /api/v1/diet/custom-foods
```

## Create Saved Meal

```text
Saved Meals
    ↓
+ New Meal
    ↓
Enter meal name
    ↓
Add foods
    ↓
Set quantities
    ↓
Save
    ↓
POST /api/v1/diet/meals
```

---

# 46. Error Handling

Use standard HTTP status codes.

```text
200 OK
201 Created
204 No Content
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Validation Error
```

FastAPI's validation should be used for request validation.

Examples:

```text
Invalid quantity
Invalid food_id
Invalid custom_food_id
Invalid meal type
Missing food/custom food reference
Negative nutrition values
```

---

# 47. Date and Time

Diet logs should use a local calendar date.

Example:

```json
{
  "date": "2026-09-07"
}
```

Use ISO date format:

```text
YYYY-MM-DD
```

For timestamps such as `created_at`, `updated_at` and `last_updated`, use a consistent timezone-aware timestamp strategy.

The user's local timezone should be considered when determining what "today" means.

---

# 48. API Response Design Principles

Keep API responses consistent.

Use:

```text
snake_case
```

for JSON fields.

Examples:

```text
food_id
custom_food_id
meal_id
quantity_g
protein_g
created_at
updated_at
```

Do not mix:

```text
foodId
food_id
FoodID
```

Use one convention throughout the backend.

---

# 49. Recommended Backend Architecture

```text
Frontend
    ↓
Diet API Layer
    ↓
+---------------------+
| Food Service        |
| Custom Food Service |
| Meal Service        |
| Diet Log Service    |
| Goal Service        |
+---------------------+
          ↓
Nutrition Calculator
          ↓
      PostgreSQL
          ↓
  Diet Analytics
          ↓
       AI Coach
```

Keep business logic in service classes/modules rather than putting everything inside FastAPI route functions.

---

# 50. Recommended Diet Backend Structure

Extend the existing FastAPI structure with diet modules:

```text
app/
│
├── main.py
│
├── api/
│   ├── auth.py
│   ├── routines.py
│   ├── exercises.py
│   ├── workouts.py
│   ├── sets.py
│   └── diet/
│       ├── summary.py
│       ├── foods.py
│       ├── custom_foods.py
│       ├── meals.py
│       ├── logs.py
│       ├── goals.py
│       └── history.py
│
├── models/
│   ├── user.py
│   ├── routine.py
│   ├── exercise.py
│   ├── workout.py
│   ├── workout_set.py
│   └── diet/
│       ├── food.py
│       ├── food_serving.py
│       ├── custom_food.py
│       ├── meal.py
│       ├── meal_item.py
│       ├── diet_log.py
│       ├── diet_log_item.py
│       └── diet_goal.py
│
├── schemas/
│   ├── routine.py
│   ├── exercise.py
│   ├── workout.py
│   ├── workout_set.py
│   └── diet/
│       ├── food.py
│       ├── custom_food.py
│       ├── meal.py
│       ├── diet_log.py
│       ├── diet_goal.py
│       └── summary.py
│
├── services/
│   ├── routine_service.py
│   ├── exercise_service.py
│   ├── workout_service.py
│   ├── nutrition_calculator.py
│   └── diet/
│       ├── food_service.py
│       ├── custom_food_service.py
│       ├── meal_service.py
│       ├── diet_log_service.py
│       ├── diet_goal_service.py
│       └── diet_analytics_service.py
│
└── db/
    ├── session.py
    └── migrations/
```

---

# 51. Initial Diet Database Relationship

```text
User
 │
 ├── Custom Foods
 │
 ├── Saved Meals
 │      │
 │      └── Meal Items
 │              │
 │              ├── System Food
 │              └── Custom Food
 │
 ├── Diet Logs
 │      │
 │      └── Log Items
 │              │
 │              ├── System Food
 │              └── Custom Food
 │
 └── Diet Goals

System Food
    │
    └── Food Servings
```

---

# 52. Important Historical Data Rule

Saved meals are mutable templates.

Food logs are immutable historical facts unless the user explicitly edits the log.

Example:

```text
Saved Meal:
"My Breakfast"

Current:
2 Eggs
1 Banana
```

User later changes it to:

```text
3 Eggs
1 Banana
```

This must NOT change yesterday's logged breakfast.

Yesterday's log must continue to represent:

```text
2 Eggs
1 Banana
```

This is another reason why saved meals and food logs must remain separate.

---

# 53. V1 Diet Scope

The recommended V1 scope is:

## Foods

- List foods
- Search foods
- Food detail
- Serving sizes

## Custom Foods

- Create
- List
- Get
- Update
- Delete/soft delete

## Saved Meals

- Create
- List
- Get
- Update
- Delete

## Diet Logs

- Create/log food
- Log multiple meal groups
- Get daily logs
- Edit logs
- Delete logs

## Nutrition

- Daily summary
- Calories
- Protein
- Carbs
- Fat

## Goals

- Get goals
- Update goals

## History

- Date range
- Daily totals
- Average nutrition

---

# 54. Features for Later

Do not overcomplicate V1.

Possible future features:

- Recently used foods
- Frequently used foods
- Copy previous day
- Quick-add calories
- Meal timing / `consumed_at`
- Micronutrients
- Barcode scanning
- Packaged food database
- Recipe builder
- Homemade recipe calculation
- Cooked recipe weight calculation
- Food favorites
- Food recommendations
- AI meal suggestions
- AI diet analysis
- Water tracking
- Nutrition charts

---

# 55. Homemade Recipe / Food Improvement for Later

A future feature can support recipes where the user provides ingredients.

Example:

```text
Chicken Curry

Raw ingredients:
500g Chicken
100g Onion
20g Oil
50g Tomato
```

The backend can calculate total nutrition.

If the cooked dish weighs:

```text
800g
```

then:

```text
Nutrition per 100g =
total recipe nutrition / 800 × 100
```

This is more accurate than treating every homemade dish as a manually entered food.

This does not need to be part of V1.

---

# 56. Current Development Direction

Workout tracking is completed.

The next development phase is:

```text
Diet Tracking
    ↓
Food Database
    ↓
Custom Foods
    ↓
Saved Meals
    ↓
Diet Logs
    ↓
Daily Summary
    ↓
Goals
    ↓
History
```

Recommended implementation order:

```text
1. Food database + food serving models
2. GET food list/search
3. GET food details
4. Custom food CRUD
5. Saved meal CRUD
6. Diet log create/read
7. Diet log update/delete
8. Daily summary
9. Goals
10. History
11. Diet analytics
12. AI Coach integration
```

---

# 57. Existing Backend Setup

A FastAPI backend has been added for the workout-tracker phase.

Run it locally:

```bash
cd /Users/snehasishdutta/Desktop/LiftLog/LiftLog
python3 -m pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Current available workout/auth endpoints include:

```http
POST /api/v1/auth/login
GET  /api/v1/auth/me

GET    /api/v1/routines
POST   /api/v1/routines
GET    /api/v1/routines/{routine_id}
PATCH  /api/v1/routines/{routine_id}
DELETE /api/v1/routines/{routine_id}

POST /api/v1/workouts
GET  /api/v1/workouts
GET  /api/v1/workouts/{workout_id}

POST /api/v1/workouts/{workout_id}/complete
POST /api/v1/workouts/{workout_id}/exercises
POST /api/v1/workout-exercises/{id}/sets
```

The project uses a simple token-based authentication flow for now, with user identity inferred from the Authorization header.

---

# 58. Development Principles

Keep the implementation:

- Simple
- Modular
- Easy to understand
- API-first
- Properly authenticated
- User-isolated
- Database-driven
- Ready for future AI integration

Do NOT introduce unnecessary infrastructure such as:

```text
Microservices
Redis
Kafka
Vector databases
Complex event systems
```

unless they become necessary later.

The goal is to build a clean monolithic FastAPI backend first.

---

# 59. Final Architecture

```text
                         LiftLog
                            |
          +-----------------+-----------------+
          |                 |                 |
       Booking          Workouts           Diet
          |                 |                 |
          |             Routines          Foods
          |             Workouts      Custom Foods
          |             Exercises      Saved Meals
          |                Sets          Diet Logs
          |                               Goals
          |                              History
          |                                 |
          +----------------+----------------+
                           |
                       AI Coach
                           |
                    Context Builder
                           |
              +------------+------------+
              |                         |
        Workout Analytics         Diet Analytics
              |                         |
              +------------+------------+
                           |
                         LLM
```

The core principle is:

```text
Structured Data
      ↓
Analytics / Context Builder
      ↓
AI Coach
```

Do not send raw, unnecessarily large database responses directly to the LLM.

The backend should expose clean, structured APIs and keep business logic in services.
