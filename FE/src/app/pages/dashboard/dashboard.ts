import {
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';

import {
  HttpClient,
} from '@angular/common/http';

import {
  Router,
} from '@angular/router';

import {
  forkJoin,
  of,
} from 'rxjs';

import {
  catchError,
} from 'rxjs/operators';

import {
  environment,
} from '../../../environments/environment';


/* =========================================================
   GET /api/v1/routines RESPONSE
========================================================= */

interface RoutineSummary {
  routine_id: number;
  user_id: number;
  name: string;
  created_at: string;
  updated_at: string;
}


interface RoutineListResponse {
  routines: RoutineSummary[];
}


/* =========================================================
   GET /api/v1/routines/{routine_id} RESPONSE
========================================================= */

interface RoutineExercise {
  exercise_id: number;
  name: string;
  target_sets: number | null;
  order_index: number;
}


interface RoutineDetail {
  routine_id: number;
  name: string;
  exercises: RoutineExercise[];
}


/* =========================================================
   DASHBOARD DISPLAY MODEL
========================================================= */

interface DashboardRoutine {
  routine_id: number;
  name: string;
  description: string;
  shortName: string;
  className: string;
  isDeleting: boolean;
}


/* =========================================================
   ACTIVE WORKOUT STORAGE MODELS
========================================================= */

interface StoredWorkoutSet {
  weight: number | null;
  reps: number | null;
  completed: boolean;
}


interface StoredWorkoutExercise {

  exercise: {

    id: string;

    n: string;

    bp: string;

    eq: string;

    tg: string;

  };

  sets: StoredWorkoutSet[];

}


/* =========================================================
   COMPONENT
========================================================= */

@Component({
  selector: 'app-dashboard',

  imports: [],

  templateUrl:
    './dashboard.html',

  styleUrl:
    './dashboard.css',
})
export class Dashboard
  implements OnInit {


  /* =====================================================
     DASHBOARD ROUTINES
  ===================================================== */

  routines:
    DashboardRoutine[] = [];


  isLoadingRoutines = false;


  /* =====================================================
     LOCAL STORAGE KEYS
  ===================================================== */

  private readonly WORKOUT_START_KEY =
    'pulseos_workout_start_time';


  private readonly SELECTED_EXERCISES_KEY =
    'pulseos_selected_exercises';


  private readonly WORKOUT_EXERCISES_KEY =
    'pulseos_workout_exercises';


  private readonly ACTIVE_ROUTINE_ID_KEY =
    'pulseos_active_routine_id';


  /* =====================================================
     API
  ===================================================== */

  private readonly apiBaseUrl =
    environment.apiBaseUrl;


  /* =====================================================
     CONSTRUCTOR
  ===================================================== */

  constructor(
    private router:
      Router,

    private http:
      HttpClient,

    private changeDetector:
      ChangeDetectorRef,
  ) {}


  /* =====================================================
     INITIALIZE DASHBOARD
  ===================================================== */

  ngOnInit(): void {

    this.loadRoutines();

  }


  /* =====================================================
     LOAD ROUTINES
  ===================================================== */

  private loadRoutines(): void {

    this.isLoadingRoutines =
      true;


    this.http
      .get<RoutineListResponse>(
        `${this.apiBaseUrl}/routines`,
      )
      .subscribe({

        next: response => {

          const summaries =
            Array.isArray(
              response.routines,
            )
              ? response.routines
              : [];


          if (
            summaries.length ===
            0
          ) {

            this.routines = [];

            this.isLoadingRoutines =
              false;


            this.changeDetector
              .detectChanges();


            return;

          }


          const detailRequests =
            summaries.map(
              summary =>
                this.http
                  .get<RoutineDetail>(
                    `${this.apiBaseUrl}/routines/${summary.routine_id}`,
                  )
                  .pipe(

                    catchError(
                      error => {

                        console.error(
                          `Failed to load routine ${summary.routine_id}:`,
                          error,
                        );


                        return of<RoutineDetail>({

                          routine_id:
                            summary.routine_id,

                          name:
                            summary.name,

                          exercises: [],

                        });

                      },
                    ),

                  ),
            );


          forkJoin(
            detailRequests,
          )
            .subscribe({

              next: details => {

                this.routines =
                  summaries.map(
                    (
                      summary,
                      index,
                    ) => {

                      const detail =
                        details.find(
                          item =>
                            item.routine_id ===
                            summary.routine_id,
                        );


                      const name =
                        summary
                          .name
                          ?.trim() ||
                        detail
                          ?.name
                          ?.trim() ||
                        'Routine';


                      const exerciseCount =
                        detail
                          ?.exercises
                          ?.length ??
                        0;


                      return {

                        routine_id:
                          summary.routine_id,

                        name,

                        description:
                          exerciseCount === 1
                            ? '1 exercise'
                            : `${exerciseCount} exercises`,

                        shortName:
                          name
                            .charAt(0)
                            .toUpperCase(),

                        className:
                          this.getRoutineClass(
                            index,
                          ),

                        isDeleting:
                          false,

                      };

                    },
                  );


                this.isLoadingRoutines =
                  false;


                this.changeDetector
                  .detectChanges();

              },


              error: error => {

                console.error(
                  'Unable to construct routine cards:',
                  error,
                );


                this.isLoadingRoutines =
                  false;


                this.changeDetector
                  .detectChanges();

              },

            });

        },


        error: error => {

          console.error(
            'GET /api/v1/routines failed:',
            error,
          );


          this.routines =
            [];


          this.isLoadingRoutines =
            false;


          this.changeDetector
            .detectChanges();

        },

      });

  }


  /* =====================================================
     ROUTINE BADGE COLOUR
  ===================================================== */

  private getRoutineClass(
    index: number,
  ): string {

    const classes = [
      'legs',
      'chest',
      'back',
      'arms',
      'shoulders',
    ];


    return classes[
      index %
      classes.length
    ];

  }


  /* =====================================================
     DELETE ROUTINE

     DELETE /api/v1/routines/{routine_id}
  ===================================================== */

  deleteRoutine(
    routine:
      DashboardRoutine,
  ): void {

    if (
      routine.isDeleting
    ) {

      return;

    }


    const shouldDelete =
      window.confirm(
        `Delete "${routine.name}"?`,
      );


    if (
      !shouldDelete
    ) {

      return;

    }


    routine.isDeleting =
      true;


    this.changeDetector
      .detectChanges();


    this.http
      .delete<void>(
        `${this.apiBaseUrl}/routines/${routine.routine_id}`,
      )
      .subscribe({

        next: () => {

          /*
           * DELETE returned 204.
           *
           * Remove the routine immediately
           * from the UI.
           */

          this.routines =
            this.routines.filter(
              item =>
                item.routine_id !==
                routine.routine_id,
            );


          const activeRoutineId =
            localStorage.getItem(
              this.ACTIVE_ROUTINE_ID_KEY,
            );


          if (
            activeRoutineId &&
            Number(
              activeRoutineId,
            ) ===
              routine.routine_id
          ) {

            localStorage.removeItem(
              this.ACTIVE_ROUTINE_ID_KEY,
            );

          }


          this.changeDetector
            .detectChanges();

        },


        error: error => {

          console.error(
            'DELETE routine failed:',
            error,
          );


          routine.isDeleting =
            false;


          this.changeDetector
            .detectChanges();


          if (
            error.status ===
            404
          ) {

            /*
             * Backend already does not
             * have this routine.
             *
             * Remove it locally too.
             */

            this.routines =
              this.routines.filter(
                item =>
                  item.routine_id !==
                  routine.routine_id,
              );


            this.changeDetector
              .detectChanges();


            return;

          }


          if (
            error.status ===
            401
          ) {

            window.alert(
              'Your session could not be authenticated. Please try again.',
            );


            return;

          }


          window.alert(
            error.error?.detail ||
            'Unable to delete this routine. Please try again.',
          );

        },

      });

  }


  /* =====================================================
     CLEAR EXISTING WORKOUT STATE
  ===================================================== */

  private clearPreviousWorkout():
    void {

    localStorage.removeItem(
      this.WORKOUT_START_KEY,
    );


    localStorage.removeItem(
      this.SELECTED_EXERCISES_KEY,
    );


    localStorage.removeItem(
      this.WORKOUT_EXERCISES_KEY,
    );


    localStorage.removeItem(
      this.ACTIVE_ROUTINE_ID_KEY,
    );

  }


  /* =====================================================
     START EMPTY WORKOUT
  ===================================================== */

  startEmptyWorkout():
    void {

    this.clearPreviousWorkout();


    localStorage.setItem(
      this.WORKOUT_START_KEY,

      Date.now()
        .toString(),
    );


    this.router.navigate([
      '/active-workout',
    ]);

  }


  /* =====================================================
     START SAVED ROUTINE
  ===================================================== */

  startRoutine(
    routine:
      DashboardRoutine,
  ): void {

    if (
      routine.isDeleting
    ) {

      return;

    }


    this.http
      .get<RoutineDetail>(
        `${this.apiBaseUrl}/routines/${routine.routine_id}`,
      )
      .subscribe({

        next: response => {

          this.clearPreviousWorkout();


          const orderedExercises =
            [
              ...response.exercises,
            ]
              .sort(
                (
                  first,
                  second,
                ) =>
                  first.order_index -
                  second.order_index,
              );


          const workoutExercises:
            StoredWorkoutExercise[] =
              orderedExercises.map(
                routineExercise => {

                  const setCount =
                    Math.max(
                      1,

                      routineExercise
                        .target_sets ??
                      1,
                    );


                  const sets:
                    StoredWorkoutSet[] =
                      Array.from(

                        {
                          length:
                            setCount,
                        },

                        () => ({

                          weight:
                            null,

                          reps:
                            null,

                          completed:
                            false,

                        }),

                      );


                  return {

                    exercise: {

                      id:
                        String(
                          routineExercise
                            .exercise_id,
                        ),

                      n:
                        routineExercise
                          .name,

                      bp:
                        '',

                      eq:
                        '',

                      tg:
                        'Saved routine',

                    },


                    sets,

                  };

                },
              );


          localStorage.setItem(
            this.WORKOUT_EXERCISES_KEY,

            JSON.stringify(
              workoutExercises,
            ),
          );


          localStorage.setItem(
            this.ACTIVE_ROUTINE_ID_KEY,

            String(
              response.routine_id,
            ),
          );


          localStorage.setItem(
            this.WORKOUT_START_KEY,

            Date.now()
              .toString(),
          );


          this.router.navigate([
            '/active-workout',
          ]);

        },


        error: error => {

          console.error(
            'Unable to start routine:',
            error,
          );


          window.alert(
            'Unable to start this routine. Please try again.',
          );

        },

      });

  }


  /* =====================================================
     BOTTOM NAVIGATION
  ===================================================== */

  goToProfile(): void {

    this.router.navigate([
      '/profile',
    ]);

  }

}