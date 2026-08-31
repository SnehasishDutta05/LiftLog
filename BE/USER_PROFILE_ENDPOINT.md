# User Profile Endpoint Documentation

## New Table: `user_profiles`

### Table Schema
```sql
CREATE TABLE user_profiles (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE FOREIGN KEY REFERENCES users(id),
    
    -- Physical data
    dob VARCHAR,
    height FLOAT,
    weight FLOAT,
    sex VARCHAR,
    
    -- Lifestyle
    wake_time VARCHAR,
    sleep_time VARCHAR,
    work_schedule VARCHAR,
    daily_activity VARCHAR,
    commute VARCHAR,
    available_training_time VARCHAR,
    
    -- Training
    experience VARCHAR,
    training_days INTEGER,
    preferred_time VARCHAR,
    preferred_exercises VARCHAR,
    disliked_exercises VARCHAR,
    limitations VARCHAR,
    
    -- Nutrition
    typical_foods VARCHAR,
    meals_per_day INTEGER,
    eating_out_frequency VARCHAR,
    favorite_foods VARCHAR,
    favorite_snacks VARCHAR,
    dietary_preferences VARCHAR,
    cooking_constraints VARCHAR,
    
    -- Goals
    primary_goal VARCHAR,
    target_weight FLOAT,
    goal_description VARCHAR,
    lifestyle_change_tolerance VARCHAR,
    
    -- Descriptions
    current_description VARCHAR,
    target_description VARCHAR,
    target_characteristics VARCHAR,
    inspiration_description VARCHAR,
    
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL
);
```

### Key Features
- **Foreign Key**: `user_id` links to the `users` table
- **Unique Constraint**: Each user can have only one profile
- **Nullable Fields**: All fields except `id`, `user_id`, `created_at`, and `updated_at` are nullable
- **Timestamps**: Automatically sets `created_at` on creation and `updated_at` on every update

---

## Endpoint: POST `/api/v1/auth/profile`

### Authorization
- **Required**: Access token in `Authorization` header
- **Format**: `Authorization: Bearer <access_token>`

### Request Body (all fields optional)
```json
{
  "dob": "1990-05-15",
  "height": 180.5,
  "weight": 75.0,
  "sex": "male",
  "wake_time": "06:00",
  "sleep_time": "22:00",
  "work_schedule": "9-5 office",
  "daily_activity": "light",
  "commute": "30 mins by car",
  "available_training_time": "1.5 hours",
  "experience": "intermediate",
  "training_days": 4,
  "preferred_time": "morning",
  "preferred_exercises": "compound lifts, running",
  "disliked_exercises": "crossfit",
  "limitations": "lower back pain",
  "typical_foods": "chicken, rice, vegetables",
  "meals_per_day": 3,
  "eating_out_frequency": "2-3 times per week",
  "favorite_foods": "pasta, pizza",
  "favorite_snacks": "protein bar, nuts",
  "dietary_preferences": "no dairy",
  "cooking_constraints": "30 mins max per meal",
  "primary_goal": "muscle gain",
  "target_weight": 85.0,
  "goal_description": "gain 10kg muscle",
  "lifestyle_change_tolerance": "high",
  "current_description": "out of shape",
  "target_description": "athletic",
  "target_characteristics": "defined abs, strong arms",
  "inspiration_description": "want to be strong like a boxer"
}
```

### Response (201 Created)
```json
{
  "message": "Profile updated successfully",
  "profile_id": 1,
  "user_id": 5
}
```

### Error Responses
- **401 Unauthorized**: Invalid or expired access token
- **422 Unprocessable Entity**: Invalid request body format

---

## Example Usage

### Using cURL
```bash
curl -X POST http://localhost:8001/api/v1/auth/profile \
  -H "Authorization: Bearer <your_access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "dob": "1990-05-15",
    "height": 180.5,
    "weight": 75.0,
    "sex": "male",
    "experience": "intermediate",
    "primary_goal": "muscle gain"
  }'
```

### Using Python Requests
```python
import requests

url = "http://localhost:8001/api/v1/auth/profile"
headers = {
    "Authorization": f"Bearer {access_token}",
    "Content-Type": "application/json"
}
payload = {
    "dob": "1990-05-15",
    "height": 180.5,
    "weight": 75.0,
    "sex": "male",
    "experience": "intermediate",
    "primary_goal": "muscle gain"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())
```

---

## Logging

All profile operations are logged to `BE/logs/liftlog.log`. Example log output:

```
INFO liftlog AUTH /profile called for user_id=5 with payload={'dob': '1990-05-15', 'height': 180.5, 'weight': 75.0, 'sex': 'male', 'experience': 'intermediate', 'primary_goal': 'muscle gain'}
INFO liftlog AUTH /profile checking if profile exists for user_id=5
INFO liftlog AUTH /profile creating new profile for user_id=5
INFO liftlog AUTH /profile profile object created
INFO liftlog AUTH /profile saved profile to DB: profile_id=1
INFO liftlog AUTH /profile response={'message': 'Profile updated successfully', 'profile_id': 1, 'user_id': 5}
```

---

## Update Behavior

- **First Call**: Creates a new profile with the provided fields
- **Subsequent Calls**: Updates only the fields provided in the request (upsert behavior)
- **Null Fields**: Any fields not provided in the request remain unchanged

---

## Notes

- The endpoint uses `get_current_user` dependency which validates the access token
- User must be authenticated (have a valid access token)
- All fields are completely optional - send only what you need
- The profile is linked to the user by their `user_id`
