import {
  HttpClient,
  HttpHeaders,
} from '@angular/common/http';

import {
  Injectable,
} from '@angular/core';

import {
  Observable,
} from 'rxjs';

import {
  environment,
} from '../../environments/environment';


/* =========================================================
   USER
========================================================= */

export interface UserPublic {
  id: number;
  email: string;
  full_name: string;
  auth_provider: string;
}


/* =========================================================
   AUTH
========================================================= */

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: UserPublic;
}


export interface SignupResponse {
  message: string;
  user: UserPublic;
}

/* =========================================================
   PROFILE
========================================================= */

export interface UserProfile {
  dob: string | null;
  height: string | null;
  weight: string | null;
  sex: string | null;

  wake_time: string | null;
  sleep_time: string | null;
  work_schedule: string | null;
  daily_activity: string | null;
  commute: string | null;
  available_training_time: string | null;

  experience: string | null;
  training_days: string | null;
  preferred_time: string | null;
  preferred_exercises: string | null;
  disliked_exercises: string | null;
  limitations: string | null;

  typical_foods: string | null;
  meals_per_day: string | null;
  eating_out_frequency: string | null;
  favorite_foods: string | null;
  favorite_snacks: string | null;
  dietary_preferences: string | null;
  cooking_constraints: string | null;

  primary_goal: string | null;
  target_weight: string | null;
  goal_description: string | null;
  lifestyle_change_tolerance: string | null;

  current_description: string | null;
  target_description: string | null;
  target_characteristics: string | null;
  inspiration_description: string | null;

  version: number;
  created_at: string;
}
/* =========================================================
   ROUTINES
========================================================= */

export interface Routine {
  id: number;
  user_id: number;
  name: string;
  created_at: string;
  updated_at: string;
}


export interface RoutineListResponse {
  routines: Routine[];
}


/* =========================================================
   LEGACY WORKOUT TYPE

   Keep this because existing workout/dashboard code may
   already depend on it.
========================================================= */

export interface Workout {
  id: number;
  user_id: number;
  status: string;
  started_at: string;
  completed_at: string | null;
}


/* =========================================================
   COMPLETED WORKOUT HISTORY
========================================================= */

export interface WorkoutSetDetail {
  set_number: number;
  weight: number | null;
  reps: number | null;
}


export interface WorkoutExerciseDetail {
  workout_exercise_id: number;
  exercise_id: number;
  exercise_name: string | null;
  sets: WorkoutSetDetail[];
}


export interface WorkoutDetail {
  workout_id: number;
  routine_id: number | null;
  started_at: string;
  finished_at: string | null;
  duration_seconds: number | null;
  exercises: WorkoutExerciseDetail[];
}


export interface WorkoutHistoryResponse {
  items: WorkoutDetail[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}


/* =========================================================
   EXERCISES
========================================================= */

export interface ExerciseApiRecord {
  exercise_id: number;
  name: string;
}


/* =========================================================
   SERVICE
========================================================= */

@Injectable({
  providedIn: 'root',
})
export class LiftlogApiService {

  private readonly apiUrl =
    environment.apiBaseUrl;


  constructor(
    private readonly http:
      HttpClient,
  ) {}


  /* =====================================================
     AUTH HEADERS
  ===================================================== */

  private authHeaders(
    token: string,
  ): HttpHeaders {

    return new HttpHeaders({
      'Content-Type':
        'application/json',

      Authorization:
        `Bearer ${token}`,
    });

  }


  /* =====================================================
     SIGNUP
  ===================================================== */

  signup(
    email: string,
    password: string,
  ):
    Observable<SignupResponse> {

    return this.http
      .post<SignupResponse>(
        `${this.apiUrl}/auth/signup`,
        {
          email,
          password,
        },
      );

  }


  /* =====================================================
     LOGIN
  ===================================================== */

  login(
    email: string,
    password: string,
  ):
    Observable<AuthResponse> {

    return this.http
      .post<AuthResponse>(
        `${this.apiUrl}/auth/login`,
        {
          email,
          password,
        },
      );

  }


  /* =====================================================
     CURRENT USER
  ===================================================== */

  getMe(
    token: string,
  ):
    Observable<UserPublic> {

    return this.http
      .get<UserPublic>(
        `${this.apiUrl}/auth/me`,
        {
          headers:
            this.authHeaders(
              token,
            ),
        },
      );

  }
    /* =====================================================
     PROFILE
  ===================================================== */

  getProfile(
    token: string,
  ):
    Observable<UserProfile> {

    return this.http
      .get<UserProfile>(
        `${this.apiUrl}/profile`,
        {
          headers:
            this.authHeaders(
              token,
            ),
        },
      );

  }

  /* =====================================================
     ROUTINES
  ===================================================== */

  getRoutines(
    token: string,
  ):
    Observable<RoutineListResponse> {

    return this.http
      .get<RoutineListResponse>(
        `${this.apiUrl}/routines`,
        {
          headers:
            this.authHeaders(
              token,
            ),
        },
      );

  }


  createRoutine(
    token: string,
    name: string,
  ):
    Observable<Routine> {

    return this.http
      .post<Routine>(
        `${this.apiUrl}/routines`,
        {
          name,
        },
        {
          headers:
            this.authHeaders(
              token,
            ),
        },
      );

  }


  /* =====================================================
     LEGACY WORKOUT METHODS

     Leave these unchanged so existing screens continue
     compiling exactly as before.
  ===================================================== */

  getWorkouts(
    token: string,
  ):
    Observable<{
      workouts: Workout[];
    }> {

    return this.http
      .get<{
        workouts: Workout[];
      }>(
        `${this.apiUrl}/workouts`,
        {
          headers:
            this.authHeaders(
              token,
            ),
        },
      );

  }


  createWorkout(
    token: string,
  ):
    Observable<Workout> {

    return this.http
      .post<Workout>(
        `${this.apiUrl}/workouts`,
        {},
        {
          headers:
            this.authHeaders(
              token,
            ),
        },
      );

  }


  addExerciseToWorkout(
    token: string,
    workoutId: number,
    exerciseId: number,
    orderIndex = 0,
  ):
    Observable<any> {

    return this.http
      .post(
        `${this.apiUrl}/workouts/${workoutId}/exercises`,
        {
          exercise_id:
            exerciseId,

          order_index:
            orderIndex,
        },
        {
          headers:
            this.authHeaders(
              token,
            ),
        },
      );

  }


  completeWorkout(
    token: string,
    workoutId: number,
  ):
    Observable<Workout> {

    return this.http
      .post<Workout>(
        `${this.apiUrl}/workouts/${workoutId}/complete`,
        {},
        {
          headers:
            this.authHeaders(
              token,
            ),
        },
      );

  }


  /* =====================================================
     COMPLETED WORKOUT HISTORY

     Matches the current FastAPI response:

     {
       items,
       total,
       limit,
       offset,
       has_more
     }
  ===================================================== */

  getWorkoutHistory(
    token: string,
    limit = 50,
    offset = 0,
  ):
    Observable<WorkoutHistoryResponse> {

    return this.http
      .get<WorkoutHistoryResponse>(
        `${this.apiUrl}/workouts`,
        {
          headers:
            this.authHeaders(
              token,
            ),

          params: {
            limit:
              limit.toString(),

            offset:
              offset.toString(),
          },
        },
      );

  }


  /* =====================================================
     EXERCISES
  ===================================================== */

  getExercises():
    Observable<ExerciseApiRecord[]> {

    return this.http
      .get<ExerciseApiRecord[]>(
        `${this.apiUrl}/exercises`,
      );

  }

}