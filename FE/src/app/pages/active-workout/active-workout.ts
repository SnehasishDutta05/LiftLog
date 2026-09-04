import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';

import {
  FormsModule,
} from '@angular/forms';

import {
  HttpClient,
} from '@angular/common/http';

import {
  Router,
} from '@angular/router';

import {
  environment,
} from '../../../environments/environment';


/* =========================================================
   EXERCISE MODELS
========================================================= */

interface ExerciseRecord {
  id: string;
  n: string;
  bp: string;
  eq: string;
  tg: string;
  mg?: string;
  sm?: string[];
  st?: string[];
  img?: string;
  gif?: string;
}


interface WorkoutSet {
  weight: number | null;
  reps: number | null;
  completed: boolean;
}


interface WorkoutExercise {
  exercise: ExerciseRecord;
  sets: WorkoutSet[];
}


/* =========================================================
   ROUTINE API MODELS
========================================================= */

interface RoutineExerciseRequest {
  exercise_id: number;
  target_sets: number;
}


interface CreateRoutineRequest {
  name: string;
  exercises: RoutineExerciseRequest[];
}


interface RoutineExerciseResponse {
  exercise_id: number;
  name: string;
  target_sets: number | null;
  order_index: number;
}


interface CreateRoutineResponse {
  routine_id: number;
  name: string;
  exercises: RoutineExerciseResponse[];
}


/* =========================================================
   SAVE WORKOUT API MODELS
========================================================= */

interface WorkoutSetRequest {
  weight: number;
  reps: number;
}


interface WorkoutExerciseRequest {
  exercise_id: number;
  sets: WorkoutSetRequest[];
}


interface SaveWorkoutRequest {
  routine_id: number;
  started_at: string;
  finished_at: string;
  exercises: WorkoutExerciseRequest[];
}


interface SavedWorkoutSetResponse {
  set_id: number;
  set_number: number;
  weight: number;
  reps: number;
}


interface SavedWorkoutExerciseResponse {
  workout_exercise_id: number;
  exercise_id: number;
  sets: SavedWorkoutSetResponse[];
}


interface SaveWorkoutResponse {
  workout_id: number;
  routine_id: number;
  started_at: string;
  finished_at: string;
  duration_seconds: number;
  exercises: SavedWorkoutExerciseResponse[];
}


/* =========================================================
   COMPONENT
========================================================= */

@Component({
  selector: 'app-active-workout',

  imports: [
    FormsModule,
  ],

  templateUrl:
    './active-workout.html',

  styleUrl:
    './active-workout.css',
})
export class ActiveWorkout
  implements OnInit, OnDestroy {


  /* =====================================================
     WORKOUT STATE
  ===================================================== */

  elapsedSeconds = 0;

  workoutExercises:
    WorkoutExercise[] = [];


  /* =====================================================
     ROUTINE POPUP STATE
  ===================================================== */

  showRoutineModal = false;

  routineName = '';

  routineError = '';

  isCreatingRoutine = false;


  /* =====================================================
     FINISH WORKOUT STATE
  ===================================================== */

  isFinishingWorkout = false;


  /* =====================================================
     LOCAL STORAGE KEYS
  ===================================================== */

  private readonly WORKOUT_START_KEY =
    'pulseos_workout_start_time';

  private readonly SELECTED_EXERCISES_KEY =
    'pulseos_selected_exercises';

  private readonly WORKOUT_EXERCISES_KEY =
    'pulseos_workout_exercises';


  /* =====================================================
     API
  ===================================================== */

  private readonly apiBaseUrl =
    environment.apiBaseUrl;


  /* =====================================================
     TIMER
  ===================================================== */

  private timer?:
    ReturnType<typeof setInterval>;


  /* =====================================================
     CONSTRUCTOR
  ===================================================== */

  constructor(
    private router: Router,
    private changeDetector:
      ChangeDetectorRef,
    private http: HttpClient,
  ) {}


  /* =====================================================
     INITIALIZE
  ===================================================== */

  ngOnInit(): void {

    this.initializeWorkoutTimer();

    this.loadWorkoutExercises();

    this.importSelectedExercises();

  }


  /* =====================================================
     INITIALIZE WORKOUT TIMER
  ===================================================== */

  private initializeWorkoutTimer(): void {

    let startTime =
      localStorage.getItem(
        this.WORKOUT_START_KEY,
      );


    /*
     * If this is a new workout,
     * create the start timestamp.
     */
    if (!startTime) {

      startTime =
        Date.now().toString();


      localStorage.setItem(
        this.WORKOUT_START_KEY,
        startTime,
      );

    }


    this.updateElapsedTime();

    this.startTimer();

  }


  /* =====================================================
     START TIMER
  ===================================================== */

  private startTimer(): void {

    this.stopTimer();


    this.timer =
      setInterval(
        () => {

          this.updateElapsedTime();

        },
        1000,
      );

  }


  /* =====================================================
     UPDATE TIMER
  ===================================================== */

  private updateElapsedTime(): void {

    const storedStartTime =
      localStorage.getItem(
        this.WORKOUT_START_KEY,
      );


    if (!storedStartTime) {

      this.elapsedSeconds = 0;

      return;

    }


    const startTime =
      Number(
        storedStartTime,
      );


    if (
      Number.isNaN(
        startTime,
      )
    ) {

      this.elapsedSeconds = 0;

      return;

    }


    this.elapsedSeconds =
      Math.max(
        0,

        Math.floor(
          (
            Date.now() -
            startTime
          ) / 1000,
        ),
      );


    this.changeDetector
      .detectChanges();

  }


  /* =====================================================
     FORMATTED DURATION
  ===================================================== */

  get formattedDuration(): string {

    const hours =
      Math.floor(
        this.elapsedSeconds /
        3600,
      );


    const minutes =
      Math.floor(
        (
          this.elapsedSeconds %
          3600
        ) /
        60,
      );


    const seconds =
      this.elapsedSeconds %
      60;


    if (hours > 0) {

      return (
        `${hours}hr ` +
        `${minutes}min ` +
        `${seconds}s`
      );

    }


    if (minutes > 0) {

      return (
        `${minutes}min ` +
        `${seconds}s`
      );

    }


    return `${seconds}s`;

  }


  /* =====================================================
     STOP TIMER
  ===================================================== */

  private stopTimer(): void {

    if (!this.timer) {
      return;
    }


    clearInterval(
      this.timer,
    );


    this.timer =
      undefined;

  }


  /* =====================================================
     CLEAR TIMER
  ===================================================== */

  private clearWorkoutTimer(): void {

    this.stopTimer();


    localStorage.removeItem(
      this.WORKOUT_START_KEY,
    );


    this.elapsedSeconds = 0;

  }


  /* =====================================================
     LOAD WORKOUT EXERCISES
  ===================================================== */

  private loadWorkoutExercises(): void {

    const stored =
      localStorage.getItem(
        this.WORKOUT_EXERCISES_KEY,
      );


    if (!stored) {

      this.workoutExercises = [];

      return;

    }


    try {

      const parsed =
        JSON.parse(
          stored,
        ) as WorkoutExercise[];


      this.workoutExercises =
        parsed.map(
          item => ({

            exercise:
              item.exercise,

            sets:
              Array.isArray(
                item.sets,
              )
                ? item.sets
                : [],

          }),
        );

    } catch (error) {

      console.error(
        'Failed to load workout exercises:',
        error,
      );


      this.workoutExercises = [];

    }

  }


  /* =====================================================
     IMPORT EXERCISES FROM EXERCISE PICKER
  ===================================================== */

  private importSelectedExercises(): void {

    const stored =
      localStorage.getItem(
        this.SELECTED_EXERCISES_KEY,
      );


    if (!stored) {
      return;
    }


    let selectedExercises:
      ExerciseRecord[] = [];


    try {

      selectedExercises =
        JSON.parse(
          stored,
        ) as ExerciseRecord[];

    } catch (error) {

      console.error(
        'Failed to import selected exercises:',
        error,
      );


      localStorage.removeItem(
        this.SELECTED_EXERCISES_KEY,
      );


      return;

    }


    selectedExercises.forEach(
      exercise => {

        const alreadyAdded =
          this.workoutExercises.some(
            workoutExercise =>
              workoutExercise.exercise.id ===
              exercise.id,
          );


        if (alreadyAdded) {
          return;
        }


        this.workoutExercises.push({

          exercise,

          sets: [
            {
              weight: null,
              reps: null,
              completed: false,
            },
          ],

        });

      },
    );


    this.saveWorkoutExercises();


    localStorage.removeItem(
      this.SELECTED_EXERCISES_KEY,
    );

  }


  /* =====================================================
     SAVE CURRENT WORKOUT LOCALLY
  ===================================================== */

  private saveWorkoutExercises(): void {

    localStorage.setItem(
      this.WORKOUT_EXERCISES_KEY,

      JSON.stringify(
        this.workoutExercises,
      ),
    );

  }


  /* =====================================================
     INPUT CHANGED
  ===================================================== */

  updateWorkoutState(): void {

    this.saveWorkoutExercises();

  }


  /* =====================================================
     TOTAL COMPLETED SETS
  ===================================================== */

  get totalSets(): number {

    let count = 0;


    this.workoutExercises.forEach(
      workoutExercise => {

        workoutExercise.sets.forEach(
          set => {

            if (set.completed) {
              count++;
            }

          },
        );

      },
    );


    return count;

  }


  /* =====================================================
     TOTAL VOLUME
  ===================================================== */

  get totalVolume(): number {

    let volume = 0;


    this.workoutExercises.forEach(
      workoutExercise => {

        workoutExercise.sets.forEach(
          set => {

            if (!set.completed) {
              return;
            }


            const weight =
              Number(
                set.weight ?? 0,
              );


            const reps =
              Number(
                set.reps ?? 0,
              );


            volume +=
              weight * reps;

          },
        );

      },
    );


    return volume;

  }


  /* =====================================================
     ADD SET
  ===================================================== */

  addSet(
    workoutExercise:
      WorkoutExercise,
  ): void {

    workoutExercise.sets.push({

      weight: null,

      reps: null,

      completed: false,

    });


    this.saveWorkoutExercises();

  }


  /* =====================================================
     COMPLETE / UNCOMPLETE SET
  ===================================================== */

  toggleSetCompleted(
    workoutExercise:
      WorkoutExercise,

    set:
      WorkoutSet,
  ): void {

    set.completed =
      !set.completed;


    this.saveWorkoutExercises();

  }


  /* =====================================================
     REMOVE EXERCISE
  ===================================================== */

  removeExercise(
    index: number,
  ): void {

    const shouldRemove =
      window.confirm(
        'Remove this exercise?',
      );


    if (!shouldRemove) {
      return;
    }


    this.workoutExercises.splice(
      index,
      1,
    );


    this.saveWorkoutExercises();

  }


  /* =====================================================
     BACK
  ===================================================== */

  goBack(): void {

    /*
     * Do not clear workout or timer.
     *
     * User can return to the workout later.
     */

    this.router.navigate([
      '/dashboard',
    ]);

  }


  /* =====================================================
     ADD EXERCISE
  ===================================================== */

  addExercise(): void {

    /*
     * Timer and workout remain in localStorage
     * while the exercise picker is open.
     */

    this.router.navigate([
      '/exercise-picker',
    ]);

  }


  /* =====================================================
     OPEN ADD ROUTINE POPUP
  ===================================================== */

  addRoutine(): void {

    this.routineName = '';

    this.routineError = '';


    if (
      this.workoutExercises.length === 0
    ) {

      this.routineError =
        'Add at least one exercise first.';

    }


    this.showRoutineModal = true;

  }


  /* =====================================================
     CLOSE ROUTINE POPUP
  ===================================================== */

  closeRoutineModal(): void {

    if (
      this.isCreatingRoutine
    ) {
      return;
    }


    this.showRoutineModal = false;

    this.routineName = '';

    this.routineError = '';

  }


  /* =====================================================
     CREATE ROUTINE
  ===================================================== */

  createRoutine(): void {

    if (
      this.isCreatingRoutine
    ) {
      return;
    }


    const name =
      this.routineName.trim();


    /* -----------------------------------------------------
       VALIDATE NAME
    ------------------------------------------------------ */

    if (!name) {

      this.routineError =
        'Please enter a routine name.';

      return;

    }


    /* -----------------------------------------------------
       VALIDATE EXERCISES
    ------------------------------------------------------ */

    if (
      this.workoutExercises.length === 0
    ) {

      this.routineError =
        'Add at least one exercise before creating a routine.';

      return;

    }


    /* -----------------------------------------------------
       BUILD ROUTINE EXERCISES
    ------------------------------------------------------ */

    const exercises:
      RoutineExerciseRequest[] =
        this.workoutExercises.map(
          workoutExercise => {

            const exerciseId =
              Number(
                workoutExercise.exercise.id,
              );


            const targetSets =
              Math.max(
                1,
                workoutExercise.sets.length,
              );


            return {

              exercise_id:
                exerciseId,

              target_sets:
                targetSets,

            };

          },
        );


    /* -----------------------------------------------------
       VALIDATE EXERCISE IDS
    ------------------------------------------------------ */

    const invalidExercise =
      exercises.some(
        exercise =>
          !Number.isInteger(
            exercise.exercise_id,
          ) ||
          exercise.exercise_id <= 0,
      );


    if (invalidExercise) {

      this.routineError =
        'One or more exercises have an invalid exercise ID.';

      return;

    }


    /* -----------------------------------------------------
       BUILD ROUTINE REQUEST
    ------------------------------------------------------ */

    const requestBody:
      CreateRoutineRequest = {

        name,

        exercises,

      };


    /* -----------------------------------------------------
       CALL ROUTINE API
    ------------------------------------------------------ */

    this.isCreatingRoutine = true;

    this.routineError = '';


    this.http
      .post<CreateRoutineResponse>(
        `${this.apiBaseUrl}/routines`,
        requestBody,
      )
      .subscribe({

        /* =================================================
           ROUTINE SUCCESS
        ================================================= */

        next: response => {

          console.log(
            'Routine created successfully:',
            response,
          );


          this.isCreatingRoutine = false;

          this.showRoutineModal = false;

          this.routineName = '';

          this.routineError = '';


          /*
           * IMPORTANT:
           *
           * Do not clear workout.
           * Do not clear timer.
           * Do not navigate.
           *
           * User stays on Active Workout.
           */

        },


        /* =================================================
           ROUTINE ERROR
        ================================================= */

        error: error => {

          console.error(
            'Create routine failed:',
            error,
          );


          this.isCreatingRoutine = false;


          if (
            error.status === 400
          ) {

            this.routineError =
              error.error?.detail ||
              'Unable to create this routine.';

            return;

          }


          if (
            error.status === 404
          ) {

            this.routineError =
              error.error?.detail ||
              'One of the selected exercises could not be found.';

            return;

          }


          if (
            error.status === 422
          ) {

            this.routineError =
              'The routine information is invalid. Please check the exercises and try again.';

            return;

          }


          if (
            error.status === 401
          ) {

            /*
             * Do not navigate from here.
             *
             * Existing authentication/interceptor
             * remains responsible for authentication.
             */

            this.routineError =
              'Your session could not be authenticated. Please try again.';

            return;

          }


          this.routineError =
            'Something went wrong while creating the routine. Please try again.';

        },

      });

  }


  /* =====================================================
     DISCARD WORKOUT
  ===================================================== */

  discardWorkout(): void {

    const shouldDiscard =
      window.confirm(
        'Discard this workout?',
      );


    if (!shouldDiscard) {
      return;
    }


    this.clearWorkoutTimer();


    localStorage.removeItem(
      this.SELECTED_EXERCISES_KEY,
    );


    localStorage.removeItem(
      this.WORKOUT_EXERCISES_KEY,
    );


    this.workoutExercises = [];


    this.router.navigate([
      '/dashboard',
    ]);

  }


  /* =====================================================
     FINISH WORKOUT
  ===================================================== */

  finishWorkout(): void {

    /*
     * Prevent double-clicking Finish from
     * creating two workouts.
     */
    if (
      this.isFinishingWorkout
    ) {
      return;
    }


    /* -----------------------------------------------------
       REQUIRE AT LEAST ONE EXERCISE
    ------------------------------------------------------ */

    if (
      this.workoutExercises.length === 0
    ) {

      window.alert(
        'Add at least one exercise before finishing the workout.',
      );

      return;

    }


    /* -----------------------------------------------------
       GET ORIGINAL WORKOUT START TIME
    ------------------------------------------------------ */

    const storedStartTime =
      localStorage.getItem(
        this.WORKOUT_START_KEY,
      );


    if (!storedStartTime) {

      window.alert(
        'Workout start time could not be found.',
      );

      return;

    }


    const startTimestamp =
      Number(
        storedStartTime,
      );


    if (
      Number.isNaN(
        startTimestamp,
      )
    ) {

      window.alert(
        'Workout start time is invalid.',
      );

      return;

    }


    /* -----------------------------------------------------
       BUILD WORKOUT EXERCISES
    ------------------------------------------------------ */

    const exercises:
      WorkoutExerciseRequest[] =
        this.workoutExercises.map(
          workoutExercise => {

            const exerciseId =
              Number(
                workoutExercise.exercise.id,
              );


            const sets:
              WorkoutSetRequest[] =
                workoutExercise.sets.map(
                  set => ({

                    weight:
                      Number(
                        set.weight ?? 0,
                      ),

                    reps:
                      Number(
                        set.reps ?? 0,
                      ),

                  }),
                );


            return {

              exercise_id:
                exerciseId,

              sets,

            };

          },
        );


    /* -----------------------------------------------------
       VALIDATE EXERCISE IDS
    ------------------------------------------------------ */

    const invalidExercise =
      exercises.some(
        exercise =>
          !Number.isInteger(
            exercise.exercise_id,
          ) ||
          exercise.exercise_id <= 0,
      );


    if (invalidExercise) {

      window.alert(
        'One or more exercises have an invalid exercise ID.',
      );

      return;

    }


    /* -----------------------------------------------------
       BUILD API REQUEST BODY
    ------------------------------------------------------ */

    const requestBody:
      SaveWorkoutRequest = {

        /*
         * 0 means this workout was started
         * without choosing a saved routine.
         */
        routine_id: 0,


        /*
         * This is the timestamp created when
         * Active Workout originally started.
         */
        started_at:
          new Date(
            startTimestamp,
          ).toISOString(),


        /*
         * Finish time is generated only when
         * the user presses Finish.
         */
        finished_at:
          new Date().toISOString(),


        exercises,

      };


    console.log(
      'Saving workout:',
      requestBody,
    );


    /* -----------------------------------------------------
       CALL WORKOUT API
    ------------------------------------------------------ */

    this.isFinishingWorkout = true;


    this.http
      .post<SaveWorkoutResponse>(
        `${this.apiBaseUrl}/workouts`,
        requestBody,
      )
      .subscribe({

        /* =================================================
           WORKOUT SAVE SUCCESS
        ================================================= */

        next: response => {

          console.log(
            'Workout saved successfully:',
            response,
          );


          this.isFinishingWorkout = false;


          /*
           * Only after the backend confirms that
           * the workout has been saved do we
           * delete local workout state.
           */

          this.clearWorkoutTimer();


          localStorage.removeItem(
            this.SELECTED_EXERCISES_KEY,
          );


          localStorage.removeItem(
            this.WORKOUT_EXERCISES_KEY,
          );


          this.workoutExercises = [];


          /*
           * Workout successfully saved.
           * Return to Dashboard.
           */

          this.router.navigate([
            '/dashboard',
          ]);

        },


        /* =================================================
           WORKOUT SAVE ERROR
        ================================================= */

        error: error => {

          console.error(
            'Save workout failed:',
            error,
          );


          this.isFinishingWorkout = false;


          /*
           * IMPORTANT:
           *
           * Do not clear:
           * - timer
           * - exercises
           * - sets
           * - localStorage
           *
           * The workout remains available
           * so the user can retry Finish.
           */


          if (
            error.status === 400
          ) {

            window.alert(
              error.error?.detail ||
              'Unable to save this workout.',
            );

            return;

          }


          if (
            error.status === 404
          ) {

            window.alert(
              error.error?.detail ||
              'One of the exercises could not be found.',
            );

            return;

          }


          if (
            error.status === 401
          ) {

            window.alert(
              'Your session could not be authenticated. Please try again.',
            );

            return;

          }


          if (
            error.status === 422
          ) {

            console.error(
              'Workout validation response:',
              error.error,
            );


            window.alert(
              'The workout information is invalid. Please check your sets and try again.',
            );

            return;

          }


          window.alert(
            'Unable to save the workout. Please try again.',
          );

        },

      });

  }


  /* =====================================================
     DESTROY
  ===================================================== */

  ngOnDestroy(): void {

    /*
     * Stop only the JavaScript interval.
     *
     * Do NOT remove WORKOUT_START_KEY here.
     *
     * This means:
     *
     * Active Workout
     *      ↓
     * Exercise Picker
     *      ↓
     * Active Workout
     *
     * continues the same workout timer.
     */

    this.stopTimer();

  }

}