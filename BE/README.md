# LiftLog
This is web-app where you can book you gym session , track your workouts and meals. Get customised traning and diet suggestion from our personal AI trainer.


# Fitness App — Backend Project Context

## 1. Project Overview

A fitness web/PWA application with three main areas:

1. **Book a gym/swimming/etc. session**
2. **Track gym workouts and progress**
3. **Track macros/nutrition**

The application will eventually have an **AI Coach**, but the current development phase is focused ONLY on the workout tracker.

The workout experience should be inspired by the functional structure of apps like **Hevy**, but this project should have its own UI, branding, and implementation.

---

## 2. Current Development Scope

### Current priority

Build the **workout tracker backend** step by step.

Do NOT implement AI yet.

Do NOT implement nutrition yet.

Do NOT implement booking yet.

The first feature being built is the **Workout page** and its saved routines.

---

# 3. Technology Direction

### Backend

- Python
- FastAPI
- PostgreSQL
- REST APIs
- Token-based authentication
- User identity obtained from the access token

The developer is comfortable with FastAPI but is relatively new to system design, so architecture should remain simple and understandable.

### Frontend

Planned as a web application/PWA to provide an app-like experience.

The frontend is not being developed in this phase.

---

# 4. Authentication Concept

The user signs in using:

- Google
- Phone number
- Email

After authentication, the backend issues an access token.

For API requests:

```http
Authorization: Bearer <access_token>
```

The frontend should NOT send `user_id` as a request parameter for normal authenticated APIs.

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

---

# 5. Workout Home Page

When the user opens the Workout page:

```text
Workout Page
    │
    ├── Start Empty Workout
    ├── New Routine
    ├── Explore
    └── Saved Routines
```

For the initial page load:

```text
GET /api/v1/routines
```

is the required API call.

The other items are UI buttons and do not need an API call just to display the buttons.

---

# 6. GET /routines

## Purpose

Return the authenticated user's saved workout routines.

## Flow

```text
User opens Workout page
        ↓
Frontend
        ↓
GET /api/v1/routines
        ↓
FastAPI
        ↓
Validate access token
        ↓
Extract user_id
        ↓
Routine Service
        ↓
PostgreSQL
        ↓
Return user's routines
        ↓
Frontend displays routines
```

## Important

The response should NOT contain exercises.

The user does not want exercises displayed underneath each routine.

Therefore:

```text
GET /routines
    ↓
Returns only routines
```

Example response:

```json
{
  "routines": [
    {
      "id": 101,
      "name": "Legs"
    },
    {
      "id": 102,
      "name": "ChestTricep"
    },
    {
      "id": 103,
      "name": "Shoulders & Arms"
    }
  ]
}
```

---

# 7. Routine vs Workout

This distinction is critical.

## Routine

A reusable workout template created by the user.

Example:

```text
Routine: Push Day

Bench Press
Incline DB Press
Cable Fly
Lateral Raise
Tricep Pushdown
```

## Workout

An actual workout session performed by the user.

Example:

```text
Workout — August 15

Bench Press
80kg × 8
80kg × 8
82.5kg × 6

Cable Fly
15kg × 12
15kg × 10
```

A routine is the plan.

A workout is what actually happened.

---

# 8. Start Empty Workout

When the user clicks:

```text
Start Empty Workout
```

an actual workout session is created.

Conceptual API:

```http
POST /api/v1/workouts
```

Backend creates something like:

```text
workout
----------------
id
user_id
status
started_at
completed_at
```

Example:

```text
id = 847
user_id = 123
status = "in_progress"
started_at = current time
completed_at = null
```

The frontend then opens the Active Workout page.

---

# 9. Active Workout Page

The workout page should follow this structure:

```text
┌─────────────────────────────────────┐
│                                     │
│ Duration    Volume      Sets        │
│ 00:12       0 kg        0           │
│                                     │
│ + Add Exercise                      │
│                                     │
│ Exercise                            │
│                                     │
│ SET       PREV       KG       REPS  │
│  1        --         --        --   │
│                                     │
│ + Add Set                           │
│                                     │
│ + Add Exercise                      │
└─────────────────────────────────────┘
```

## Top metrics

### Duration

Derived from:

```text
current_time - workout.started_at
```

Do not continuously store the duration.

### Sets

Count completed sets in the workout.

### Volume

For weight × reps exercises:

```text
Volume = SUM(weight × reps)
```

Example:

```text
80 × 8 = 640
80 × 8 = 640
82.5 × 6 = 495

Total = 1775 kg
```

These values are derived data, not the primary source of truth.

---

# 10. Add Exercise

When the user clicks:

```text
+ Add Exercise
```

open an exercise-selection page.

The user can:

1. Search/select an existing exercise
2. Create/write a custom exercise if it cannot be found

Example:

```text
Add Exercise

Search exercises...

Chest
- Bench Press
- Incline Bench Press
- Dumbbell Fly
- Cable Fly

Shoulders
- Shoulder Press
- Lateral Raise

Can't find it?
+ Create Exercise
```

After selecting an exercise, it appears on the Active Workout page.

---

# 11. Exercise Library

Use a centralized `exercises` table.

System exercises:

```text
id = 101
name = "Bench Press"
created_by = null
is_custom = false
```

User-created exercise:

```text
id = 982
name = "My Gym Chest Press"
created_by = 123
is_custom = true
```

Do NOT store exercise names directly inside a workout.

Reference exercises by `exercise_id`.

---

# 12. Workout Exercises

An actual workout contains exercises.

Example:

```text
Workout #847
    │
    ├── Bench Press
    │
    ├── Incline DB Press
    │
    └── Cable Fly
```

Database table:

```text
workout_exercises
-------------------------
id
workout_id
exercise_id
order_index
```

`order_index` determines the exercise order.

---

# 13. Sets

Each exercise contains sets.

Example:

```text
Bench Press

Set 1 → 80kg × 8
Set 2 → 80kg × 8
Set 3 → 82.5kg × 6
```

Database table:

```text
workout_sets
-------------------------
id
workout_exercise_id
set_number
weight
reps
completed
created_at
```

Set numbers are automatically generated.

The user does NOT enter the set number.

Example:

```text
+ Add Set
    ↓
Set 1

+ Add Set
    ↓
Set 2

+ Add Set
    ↓
Set 3
```

The backend should not blindly trust a set number supplied by the frontend.

---

# 14. PREV Column

The Active Workout page contains:

```text
SET | PREV | KG | REPS
```

`PREV` means the user's performance for the same exercise in the previous completed workout where that exercise was performed.

Example previous workout:

```text
Bench Press

Set 1 → 80kg × 10
Set 2 → 80kg × 10
Set 3 → 85kg × 8
```

Today's workout displays:

```text
SET       PREV       KG       REPS

1         80 × 10     --       --
2         80 × 10     --       --
3         85 × 8      --       --
```

The user then enters today's values.

If the exercise has never been performed before:

```text
PREV = --
```

Important:

Do NOT store `prev_weight` or `prev_reps` inside today's set.

PREV is derived by querying the user's previous workout history for that exercise.

---

# 15. Add Set

When the user presses:

```text
+ Add Set
```

a new row appears:

```text
SET       PREV       KG       REPS

1         80 × 10     85       10
2         80 × 10     85        9
3         85 × 8      87.5      7
4         --          --        --
```

The frontend can create the empty row locally for immediate UI response.

When the user enters the values, sync them with the backend.

---

# 16. Rest Timer

A rest timer is NOT required.

Do not implement it for the current version.

---

# 17. Routine Creation

There is a:

```text
+ New Routine
```

button.

Flow:

```text
Workout Page
    ↓
New Routine
    ↓
Create Routine Page
    ↓
Enter routine name
    ↓
Add exercises
    ↓
Save
```

Example:

```text
Routine Name:
[ Push Day ]

Exercises:

1. Bench Press
2. Incline DB Press
3. Cable Fly

+ Add Exercise

[ Save ]
```

---

# 18. Routine Database

Initial table:

```text
routines
-------------------------
id
user_id
name
created_at
updated_at
```

Exercises belonging to routines:

```text
routine_exercises
-------------------------
id
routine_id
exercise_id
order_index
created_at
```

Relationship:

```text
User
 │
 └── Routine
       │
       ├── Routine Exercise → Exercise
       ├── Routine Exercise → Exercise
       └── Routine Exercise → Exercise
```

Do NOT store the exercise name directly inside the routine.

Use `exercise_id`.

`order_index` allows drag-and-drop/reordering.

---

# 19. Routine APIs

Initial APIs:

```http
GET    /api/v1/routines
POST   /api/v1/routines
GET    /api/v1/routines/{routine_id}
PATCH  /api/v1/routines/{routine_id}
DELETE /api/v1/routines/{routine_id}
```

Potential exercise ordering API:

```http
PATCH /api/v1/routines/{routine_id}/exercises/order
```

For the current first page, only this is required:

```http
GET /api/v1/routines
```

---

# 20. Workout APIs

Planned:

```http
POST   /api/v1/workouts
GET    /api/v1/workouts
GET    /api/v1/workouts/{workout_id}
PATCH  /api/v1/workouts/{workout_id}

POST   /api/v1/workouts/{workout_id}/exercises
PATCH  /api/v1/workout-exercises/{id}
DELETE /api/v1/workout-exercises/{id}

POST   /api/v1/workout-exercises/{id}/sets
PATCH  /api/v1/sets/{id}
DELETE /api/v1/sets/{id}
```

Workout completion:

```http
POST /api/v1/workouts/{workout_id}/complete
```

---

# 21. Initial Database Model

Core tables:

```text
users
  │
  ├── routines
  │      │
  │      └── routine_exercises
  │                 │
  │                 └── exercises
  │
  └── workouts
         │
         └── workout_exercises
                    │
                    └── workout_sets
```

Simplified:

```text
User
 │
 ├── Routine
 │     └── Exercises
 │
 └── Workout
       └── Exercises
             └── Sets
```

---

# 22. Backend Project Structure

Suggested FastAPI structure:

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
│   └── sets.py
│
├── models/
│   ├── user.py
│   ├── routine.py
│   ├── exercise.py
│   ├── workout.py
│   └── workout_set.py
│
├── schemas/
│   ├── routine.py
│   ├── exercise.py
│   ├── workout.py
│   └── workout_set.py
│
├── services/
│   ├── routine_service.py
│   ├── exercise_service.py
│   ├── workout_service.py
│   └── analytics_service.py
│
└── db/
    ├── session.py
    └── migrations/
```

Keep business logic in services rather than putting everything inside FastAPI route functions.

---

# 23. Important Development Principle

Build this **page by page and API by API**.

Current task:

```text
Workout Page
    ↓
GET /routines
    ↓
Display user's saved routines
```

Do not build the entire workout system at once.

Next:

```text
New Routine
    ↓
Create routine API
    ↓
Add exercises
    ↓
Save routine
```

Then:

```text
Start Empty Workout
    ↓
Create workout
    ↓
Active Workout page
```

Then:

```text
Add Exercise
    ↓
Add Sets
    ↓
PREV
    ↓
Progress/history
```

---

# 24. Future AI Architecture

AI is intentionally NOT part of the current implementation.

Later, the architecture can become:

```text
Workout Data
     +
Nutrition Data
     +
User Profile
     +
Recent History
     ↓
Context Builder
     ↓
AI Coach
```

The workout tracker should therefore keep its data **structured and clean**, because the future AI Coach will consume this data.

---

# Current Goal

Build the backend starting with:

```text
FastAPI
   ↓
GET /api/v1/routines
   ↓
PostgreSQL
   ↓
Return:
{
  "routines": [
    {"id": 101, "name": "Legs"},
    {"id": 102, "name": "ChestTricep"},
    {"id": 103, "name": "Shoulders & Arms"}
  ]
}
```

Keep the implementation simple, modular, and easy to understand.

Do not introduce microservices, Redis, Kafka, vector databases, or AI services unless they become necessary later.

## Backend setup (implemented)

A FastAPI backend has been added for the current workout-tracker phase.

Run it locally:

```bash
cd /Users/snehasishdutta/Desktop/LiftLog/LiftLog
python3 -m pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Available endpoints:

- POST /api/v1/auth/demo-login
- GET /api/v1/auth/me
- GET /api/v1/routines
- POST /api/v1/routines
- GET /api/v1/routines/{routine_id}
- PATCH /api/v1/routines/{routine_id}
- DELETE /api/v1/routines/{routine_id}
- POST /api/v1/workouts
- GET /api/v1/workouts
- GET /api/v1/workouts/{workout_id}
- POST /api/v1/workouts/{workout_id}/complete
- POST /api/v1/workouts/{workout_id}/exercises
- POST /api/v1/workout-exercises/{id}/sets

The project uses a simple token-based auth flow for now, with user identity inferred from the Authorization header.
