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
  Router,
} from '@angular/router';


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


@Component({
  selector: 'app-active-workout',
  imports: [
    FormsModule,
  ],
  templateUrl: './active-workout.html',
  styleUrl: './active-workout.css',
})
export class ActiveWorkout
  implements OnInit, OnDestroy {

  elapsedSeconds = 0;

  workoutExercises:
    WorkoutExercise[] = [];


  private readonly WORKOUT_START_KEY =
    'pulseos_workout_start_time';

  private readonly SELECTED_EXERCISES_KEY =
    'pulseos_selected_exercises';

  private readonly WORKOUT_EXERCISES_KEY =
    'pulseos_workout_exercises';


  private timer?:
    ReturnType<typeof setInterval>;


  constructor(
    private router: Router,
    private changeDetector:
      ChangeDetectorRef,
  ) {}


  /* =========================================================
     INITIALIZE
  ========================================================= */

  ngOnInit(): void {

    this.initializeWorkoutTimer();

    this.loadWorkoutExercises();

    this.importSelectedExercises();

  }


  /* =========================================================
     TIMER
  ========================================================= */

  private initializeWorkoutTimer(): void {

    let startTime =
      localStorage.getItem(
        this.WORKOUT_START_KEY,
      );


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


  get formattedDuration():
    string {

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


  private clearWorkoutTimer(): void {

    this.stopTimer();


    localStorage.removeItem(
      this.WORKOUT_START_KEY,
    );


    this.elapsedSeconds = 0;

  }


  /* =========================================================
     LOAD WORKOUT EXERCISES
  ========================================================= */

  private loadWorkoutExercises():
    void {

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
        );


      this.workoutExercises =
        parsed.map(
          (
            item:
              WorkoutExercise & {
                notes?: string;
              },
          ) => ({
            exercise:
              item.exercise,

            sets:
              item.sets ?? [],
          }),
        );

    } catch {

      this.workoutExercises = [];

    }

  }


  /* =========================================================
     IMPORT EXERCISES FROM PICKER
  ========================================================= */

  private importSelectedExercises():
    void {

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
        );

    } catch {

      return;

    }


    selectedExercises.forEach(
      exercise => {

        const alreadyAdded =
          this.workoutExercises
            .some(
              item =>
                item.exercise.id ===
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


  /* =========================================================
     SAVE WORKOUT
  ========================================================= */

  private saveWorkoutExercises():
    void {

    localStorage.setItem(
      this.WORKOUT_EXERCISES_KEY,
      JSON.stringify(
        this.workoutExercises,
      ),
    );

  }


  updateWorkoutState():
    void {

    this.saveWorkoutExercises();

  }


  /* =========================================================
     WORKOUT STATS
  ========================================================= */

  get totalSets(): number {

    let count = 0;


    this.workoutExercises
      .forEach(
        workoutExercise => {

          workoutExercise.sets
            .forEach(
              set => {

                if (
                  set.completed
                ) {

                  count++;

                }

              },
            );

        },
      );


    return count;

  }


  get totalVolume(): number {

    let volume = 0;


    this.workoutExercises
      .forEach(
        workoutExercise => {

          workoutExercise.sets
            .forEach(
              set => {

                if (
                  !set.completed
                ) {

                  return;

                }


                const weight =
                  set.weight ?? 0;


                const reps =
                  set.reps ?? 0;


                volume +=
                  weight *
                  reps;

              },
            );

        },
      );


    return volume;

  }


  /* =========================================================
     ADD SET
  ========================================================= */

  addSet(
    workoutExercise:
      WorkoutExercise,
  ): void {

    workoutExercise
      .sets
      .push({
        weight: null,
        reps: null,
        completed: false,
      });


    this.saveWorkoutExercises();

  }


  /* =========================================================
     COMPLETE SET
  ========================================================= */

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


  /* =========================================================
     REMOVE EXERCISE
  ========================================================= */

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


    this.workoutExercises
      .splice(
        index,
        1,
      );


    this.saveWorkoutExercises();

  }


  /* =========================================================
     BACK
  ========================================================= */

  goBack(): void {

    this.router.navigate([
      '/dashboard',
    ]);

  }


  /* =========================================================
     ADD EXERCISE
  ========================================================= */

  addExercise(): void {

    this.router.navigate([
      '/exercise-picker',
    ]);

  }


  /* =========================================================
     ADD ROUTINE
  ========================================================= */

  addRoutine(): void {

    console.log(
      'Add routine clicked',
    );

  }


  /* =========================================================
     DISCARD WORKOUT
  ========================================================= */

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


  /* =========================================================
     FINISH WORKOUT
  ========================================================= */

  finishWorkout(): void {

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


  /* =========================================================
     DESTROY
  ========================================================= */

  ngOnDestroy(): void {

    /*
     * Only stop the JavaScript interval.
     *
     * Do not remove the stored start timestamp.
     * This allows the timer to continue while
     * navigating to the Exercise Picker.
     */
    this.stopTimer();

  }

}