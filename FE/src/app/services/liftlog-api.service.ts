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
   WORKOUTS
========================================================= */

export interface Workout {
  id: number;

  user_id: number;

  status: string;

  started_at: string;

  completed_at: string | null;
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
     LEGACY AUTH HEADERS

     Existing workout/routine methods still use these.
     We are leaving them unchanged so nothing else breaks.

     New exercise loading uses the global auth interceptor.
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
     WORKOUTS
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
     EXERCISES

     GET /api/v1/exercises

     No token argument is required here.

     auth.interceptor.ts automatically attaches:

     Authorization: Bearer <access_token>
  ===================================================== */

  getExercises():
    Observable<ExerciseApiRecord[]> {

    return this.http
      .get<ExerciseApiRecord[]>(
        `${this.apiUrl}/exercises`,
      );

  }

}