import {
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';

import {
  ActivatedRoute,
  Router,
} from '@angular/router';

import {
  LiftlogApiService,
  WorkoutDetail,
  WorkoutExerciseDetail,
} from '../../services/liftlog-api.service';


@Component({
  selector: 'app-workout-detail',
  standalone: true,
  imports: [],
  templateUrl: './workout-detail.html',
  styleUrl: './workout-detail.css',
})
export class WorkoutDetailPage
  implements OnInit {

  workout:
    WorkoutDetail | null =
      null;


  isLoading =
    true;


  errorMessage =
    '';


  constructor(
    private readonly route:
      ActivatedRoute,

    private readonly router:
      Router,

    private readonly api:
      LiftlogApiService,

    private readonly changeDetector:
      ChangeDetectorRef,
  ) {}


  ngOnInit(): void {

    const workoutId =
      Number(
        this.route.snapshot
          .paramMap
          .get(
            'workoutId',
          ),
      );


    if (
      !Number.isFinite(
        workoutId,
      ) ||
      workoutId <= 0
    ) {

      this.showError(
        'Invalid workout.',
      );

      return;

    }


    this.loadWorkout(
      workoutId,
    );

  }


  private loadWorkout(
    workoutId: number,
  ): void {

    const token =
      localStorage.getItem(
        'pulseos_access_token',
      );


    if (!token) {

      this.router.navigate([
        '/login',
      ]);

      return;

    }


    this.isLoading =
      true;


    this.errorMessage =
      '';


    this.loadWorkoutPage(
      token,
      workoutId,
      0,
    );

  }


  private loadWorkoutPage(
    token: string,
    workoutId: number,
    offset: number,
  ): void {

    const limit =
      50;


    this.api
      .getWorkoutHistory(
        token,
        limit,
        offset,
      )
      .subscribe({

        next: response => {

          const workout =
            response.items.find(
              item =>
                item.workout_id ===
                workoutId,
            );


          if (workout) {

            this.workout =
              workout;


            this.isLoading =
              false;


            this.changeDetector
              .detectChanges();

            return;

          }


          if (
            response.has_more
          ) {

            this.loadWorkoutPage(
              token,
              workoutId,
              offset + limit,
            );

            return;

          }


          this.showError(
            'Workout not found.',
          );

        },


        error: error => {

          console.error(
            'Unable to load workout:',
            error,
          );


          this.showError(
            'Could not load this workout.',
          );

        },

      });

  }


  private showError(
    message: string,
  ): void {

    this.errorMessage =
      message;


    this.isLoading =
      false;


    this.changeDetector
      .detectChanges();

  }


  /* =====================================================
     NAVIGATION
  ===================================================== */

  goBack(): void {

    this.router.navigate([
      '/profile',
    ]);

  }


  /* =====================================================
     WORKOUT NAME
  ===================================================== */

  get workoutName(): string {

    if (!this.workout) {
      return 'Workout';
    }


    /*
     * Backend now returns workout_name.
     *
     * Keep this compatible even if WorkoutDetail
     * has not yet been updated in the API service.
     */
    const workoutWithName =
      this.workout as WorkoutDetail & {
        workout_name?:
          string |
          null;
      };


    const name =
      workoutWithName
        .workout_name
        ?.trim();


    return (
      name ||
      'Workout'
    );

  }


  /* =====================================================
     COMPLETED DATE
  ===================================================== */

  get completedDate(): string {

    if (
      !this.workout?.finished_at
    ) {
      return '';
    }


    const date =
      new Date(
        this.workout.finished_at,
      );


    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return '';
    }


    return new Intl.DateTimeFormat(
      'en',
      {
        weekday:
          'short',

        month:
          'short',

        day:
          'numeric',

        year:
          'numeric',
      },
    ).format(
      date,
    );

  }


  /* =====================================================
     DURATION
  ===================================================== */

  get durationLabel(): string {

    const seconds =
      Number(
        this.workout
          ?.duration_seconds ??
        0,
      );


    if (
      !Number.isFinite(
        seconds,
      ) ||
      seconds <= 0
    ) {
      return '0 min';
    }


    const minutes =
      Math.max(
        1,
        Math.round(
          seconds /
          60,
        ),
      );


    const hours =
      Math.floor(
        minutes /
        60,
      );


    const remaining =
      minutes %
      60;


    if (
      hours ===
      0
    ) {
      return `${remaining} min`;
    }


    if (
      remaining ===
      0
    ) {
      return `${hours} hr`;
    }


    return (
      `${hours} hr ${remaining} min`
    );

  }


  /* =====================================================
     TOTAL VOLUME
  ===================================================== */

  get totalVolume(): number {

    if (!this.workout) {
      return 0;
    }


    return Math.round(
      this.workout.exercises
        .reduce(
          (
            total,
            exercise,
          ) =>
            total +
            this.exerciseVolume(
              exercise,
            ),
          0,
        ),
    );

  }


  /* =====================================================
     EXERCISE VOLUME
  ===================================================== */

  exerciseVolume(
    exercise:
      WorkoutExerciseDetail,
  ): number {

    return Math.round(
      exercise.sets.reduce(
        (
          total,
          set,
        ) => {

          const weight =
            Number(
              set.weight ??
              0,
            );


          const reps =
            Number(
              set.reps ??
              0,
            );


          return (
            total +
            (
              (
                Number.isFinite(
                  weight,
                )
                  ? weight
                  : 0
              ) *
              (
                Number.isFinite(
                  reps,
                )
                  ? reps
                  : 0
              )
            )
          );

        },
        0,
      ),
    );

  }


  /* =====================================================
     SET SUMMARY
  ===================================================== */

  setSummary(
    exercise:
      WorkoutExerciseDetail,
  ): string {

    const setCount =
      exercise.sets.length;


    if (
      setCount ===
      0
    ) {
      return 'No sets';
    }


    const reps =
      exercise.sets
        .map(
          set =>
            Number(
              set.reps ??
                0,
            ),
        );


    const sameReps =
      reps.every(
        value =>
          value ===
          reps[0],
      );


    if (sameReps) {

      return (
        `${setCount} ${
          setCount === 1
            ? 'set'
            : 'sets'
        } × ${reps[0]} reps`
      );

    }


    return (
      `${setCount} ${
        setCount === 1
          ? 'set'
          : 'sets'
      }`
    );

  }


  /* =====================================================
     FORMAT VOLUME
  ===================================================== */

  formatVolume(
    value: number,
  ): string {

    return new Intl.NumberFormat(
      'en-IN',
      {
        maximumFractionDigits:
          0,
      },
    ).format(
      value,
    );

  }

}