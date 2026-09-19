import {
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';

import {
  Router,
} from '@angular/router';

import {
  LiftlogApiService,
  WorkoutDetail,
} from '../../services/liftlog-api.service';


type HistoryFilter =
  | 'all'
  | 'week'
  | 'month'
  | 'year';


interface WorkoutHistoryItem {
  workoutId: number;
  title: string;
  completedAt: Date;
  dateLabel: string;
  durationLabel: string;
  exerciseCount: number;
  volume: number;
}


@Component({
  selector: 'app-workout-history',

  imports: [],

  templateUrl:
    './workout-history.html',

  styleUrl:
    './workout-history.css',
})
export class WorkoutHistory
  implements OnInit {


  selectedFilter:
    HistoryFilter =
      'all';


  allWorkouts:
    WorkoutHistoryItem[] =
      [];


  filteredWorkouts:
    WorkoutHistoryItem[] =
      [];


  isLoading =
    false;


  errorMessage =
    '';


  /* =====================================================
     CONSTRUCTOR
  ===================================================== */

  constructor(
    private readonly router:
      Router,

    private readonly liftlogApi:
      LiftlogApiService,

    private readonly changeDetector:
      ChangeDetectorRef,
  ) {}


  /* =====================================================
     INIT
  ===================================================== */

  ngOnInit(): void {

    this.loadAllWorkouts();

  }


  /* =====================================================
     LOAD ALL COMPLETED WORKOUTS

     Backend allows max 50 per request, so this keeps
     requesting pages until has_more becomes false.
  ===================================================== */

  private loadAllWorkouts(): void {

    const token =
      localStorage.getItem(
        'pulseos_access_token',
      );


    if (!token) {

      this.errorMessage =
        'Workout history is unavailable.';

      return;

    }


    this.isLoading =
      true;


    this.errorMessage =
      '';


    this.allWorkouts =
      [];


    this.filteredWorkouts =
      [];


    this.loadWorkoutPage(
      token,
      0,
    );

  }


  private loadWorkoutPage(
    token: string,
    offset: number,
  ): void {

    const limit =
      50;


    this.liftlogApi
      .getWorkoutHistory(
        token,
        limit,
        offset,
      )
      .subscribe({

        next: response => {

          const pageItems =
            response.items
              .filter(
                workout =>
                  Boolean(
                    workout.finished_at,
                  ),
              )
              .map(
                workout =>
                  this.toHistoryItem(
                    workout,
                  ),
              );


          this.allWorkouts = [
            ...this.allWorkouts,
            ...pageItems,
          ];


          /*
           * Keep loading until the backend
           * reports that there are no more pages.
           */
          if (
            response.has_more
          ) {

            this.loadWorkoutPage(
              token,
              offset +
                response.limit,
            );

            return;

          }


          /*
           * Newest completed workouts first.
           */
          this.allWorkouts = [
            ...this.allWorkouts,
          ].sort(
            (
              first,
              second,
            ) =>
              second.completedAt
                .getTime() -
              first.completedAt
                .getTime(),
          );


          /*
           * Apply whichever filter is
           * currently selected.
           */
          this.applyFilter();


          this.isLoading =
            false;


          this.changeDetector
            .detectChanges();

        },


        error: error => {

          console.error(
            'Unable to load workout history:',
            error,
          );


          this.isLoading =
            false;


          this.errorMessage =
            'Could not load your workout history.';


          this.changeDetector
            .detectChanges();

        },

      });

  }


  /* =====================================================
     FILTERS
  ===================================================== */

  selectFilter(
    filter:
      HistoryFilter,
  ): void {

    this.selectedFilter =
      filter;


    this.applyFilter();

  }


  private applyFilter(): void {

    const now =
      new Date();


    switch (
      this.selectedFilter
    ) {


      /* -------------------------------------------------
         THIS WEEK
      ------------------------------------------------- */

      case 'week': {

        const start =
          this.getStartOfWeek(
            now,
          );


        const end =
          new Date(
            start,
          );


        end.setDate(
          end.getDate() +
          7,
        );


        this.filteredWorkouts =
          this.allWorkouts.filter(
            workout =>
              workout.completedAt >=
                start &&
              workout.completedAt <
                end,
          );


        break;

      }


      /* -------------------------------------------------
         THIS MONTH
      ------------------------------------------------- */

      case 'month': {

        const start =
          new Date(
            now.getFullYear(),
            now.getMonth(),
            1,
          );


        const end =
          new Date(
            now.getFullYear(),
            now.getMonth() +
              1,
            1,
          );


        this.filteredWorkouts =
          this.allWorkouts.filter(
            workout =>
              workout.completedAt >=
                start &&
              workout.completedAt <
                end,
          );


        break;

      }


      /* -------------------------------------------------
         THIS YEAR
      ------------------------------------------------- */

      case 'year': {

        const start =
          new Date(
            now.getFullYear(),
            0,
            1,
          );


        const end =
          new Date(
            now.getFullYear() +
              1,
            0,
            1,
          );


        this.filteredWorkouts =
          this.allWorkouts.filter(
            workout =>
              workout.completedAt >=
                start &&
              workout.completedAt <
                end,
          );


        break;

      }


      /* -------------------------------------------------
         ALL
      ------------------------------------------------- */

      default: {

        this.filteredWorkouts = [
          ...this.allWorkouts,
        ];


        break;

      }

    }

  }


  private getStartOfWeek(
    date: Date,
  ): Date {

    const result =
      new Date(
        date,
      );


    result.setHours(
      0,
      0,
      0,
      0,
    );


    const day =
      result.getDay();


    const daysSinceMonday =
      day === 0
        ? 6
        : day - 1;


    result.setDate(
      result.getDate() -
        daysSinceMonday,
    );


    return result;

  }


  /* =====================================================
     WORKOUT VIEW MODEL
  ===================================================== */

  private toHistoryItem(
    workout:
      WorkoutDetail,
  ): WorkoutHistoryItem {

    const completedAt =
      this.getWorkoutDate(
        workout,
      ) ??
      new Date();


    /*
     * Backend now returns workout_name.
     *
     * Keep this compatibility cast so this page
     * continues compiling even if WorkoutDetail
     * has not yet been updated with workout_name.
     */
    const workoutWithName =
      workout as WorkoutDetail & {
        workout_name?:
          string |
          null;
      };


    const workoutName =
      workoutWithName
        .workout_name
        ?.trim();


    return {

      workoutId:
        workout.workout_id,


      /*
       * New workouts use their saved workout name.
       *
       * Older workouts that were created before
       * workout_name existed safely remain "Workout".
       */
      title:
        workoutName ||
        'Workout',


      completedAt,


      dateLabel:
        this.formatDate(
          completedAt,
        ),


      durationLabel:
        this.formatDuration(
          workout.duration_seconds,
        ),


      exerciseCount:
        workout.exercises.length,


      volume:
        Math.round(
          this.calculateWorkoutVolume(
            workout,
          ),
        ),

    };

  }


  private getWorkoutDate(
    workout:
      WorkoutDetail,
  ): Date | null {

    const value =
      workout.finished_at;


    if (!value) {

      return null;

    }


    const result =
      new Date(
        value,
      );


    return Number.isNaN(
      result.getTime(),
    )
      ? null
      : result;

  }


  /* =====================================================
     VOLUME
  ===================================================== */

  private calculateWorkoutVolume(
    workout:
      WorkoutDetail,
  ): number {

    return workout.exercises
      .reduce(
        (
          workoutTotal,
          exercise,
        ) => {

          const exerciseVolume =
            exercise.sets.reduce(
              (
                setTotal,
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


                const safeWeight =
                  Number.isFinite(
                    weight,
                  )
                    ? weight
                    : 0;


                const safeReps =
                  Number.isFinite(
                    reps,
                  )
                    ? reps
                    : 0;


                return (
                  setTotal +
                  (
                    safeWeight *
                    safeReps
                  )
                );

              },
              0,
            );


          return (
            workoutTotal +
            exerciseVolume
          );

        },
        0,
      );

  }


  /* =====================================================
     FORMATTERS
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


  private formatDuration(
    secondsValue:
      number |
      null,
  ): string {

    const seconds =
      Number(
        secondsValue ??
          0,
      );


    if (
      !Number.isFinite(
        seconds,
      ) ||
      seconds <=
        0
    ) {

      return '0 min';

    }


    const totalMinutes =
      Math.max(
        1,
        Math.round(
          seconds /
            60,
        ),
      );


    const hours =
      Math.floor(
        totalMinutes /
          60,
      );


    const minutes =
      totalMinutes %
        60;


    if (
      hours ===
        0
    ) {

      return (
        `${minutes} min`
      );

    }


    if (
      minutes ===
        0
    ) {

      return (
        `${hours} hr`
      );

    }


    return (
      `${hours} hr ${minutes} min`
    );

  }


  private formatDate(
    date: Date,
  ): string {

    const today =
      new Date();


    today.setHours(
      0,
      0,
      0,
      0,
    );


    const workoutDate =
      new Date(
        date,
      );


    workoutDate.setHours(
      0,
      0,
      0,
      0,
    );


    const difference =
      Math.round(
        (
          today.getTime() -
          workoutDate.getTime()
        ) /
          86_400_000,
      );


    if (
      difference ===
        0
    ) {

      return 'Today';

    }


    if (
      difference ===
        1
    ) {

      return 'Yesterday';

    }


    return new Intl.DateTimeFormat(
      'en',
      {
        month:
          'short',

        day:
          'numeric',

        year:
          date.getFullYear() !==
          today.getFullYear()
            ? 'numeric'
            : undefined,
      },
    ).format(
      date,
    );

  }


  /* =====================================================
     NAVIGATION
  ===================================================== */

  goBack(): void {

    this.router.navigate([
      '/profile',
    ]);

  }


  openWorkout(
    workoutId: number,
  ): void {

    this.router.navigate([
      '/workout-history',
      workoutId,
    ]);

  }

}