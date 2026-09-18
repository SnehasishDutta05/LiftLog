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

import {
  ConfirmDialog,
} from '../../shared/confirm-dialog/confirm-dialog';


interface RecentWorkoutView {
  workoutId: number;
  title: string;
  dateLabel: string;
  durationLabel: string;
  exerciseCount: number;
  volume: number;
}


@Component({
  selector: 'app-profile',

  imports: [
    ConfirmDialog,
  ],

  templateUrl:
    './profile.html',

  styleUrl:
    './profile.css',
})
export class Profile
  implements OnInit {


  private readonly WORKOUTS_CHANGED_KEY =
    'pulseos_workouts_changed';


  /* =====================================================
     SETTINGS
  ===================================================== */

  showSettings =
    false;


  /* =====================================================
     LOGOUT CONFIRMATION
  ===================================================== */

  showLogoutDialog =
    false;


  /* =====================================================
     USER
  ===================================================== */

  fullName =
    'PulseOS User';

  email =
    '';


  /* =====================================================
     PROGRESS
  ===================================================== */

  workoutsThisWeek =
    0;

  volumeThisWeek =
    0;

  streakDays =
    0;

  exercisesThisWeek =
    0;


  recentWorkouts:
    RecentWorkoutView[] = [];


  isLoadingProgress =
    false;

  progressError =
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

    this.loadUserData();

    this.loadWorkoutProgress();

  }


  /* =====================================================
     USER
  ===================================================== */

  private loadUserData(): void {

    this.fullName =
      localStorage.getItem(
        'pulseos_user_full_name',
      ) ||
      'PulseOS User';


    this.email =
      localStorage.getItem(
        'pulseos_user_email',
      ) ||
      '';

  }


  get profileInitial(): string {

    return (
      this.fullName
        .trim()
        .charAt(0)
        .toUpperCase() ||
      'P'
    );

  }


  /* =====================================================
     WORKOUT DATA

     Load ALL completed workouts.

     Profile uses:
     - all history for streak
     - current week for progress
     - newest 3 for Recent Activity
  ===================================================== */

  private loadWorkoutProgress(): void {

    const token =
      localStorage.getItem(
        'pulseos_access_token',
      );


    if (!token) {

      this.resetWorkoutProgress();

      this.progressError =
        'Workout progress is unavailable.';

      this.isLoadingProgress =
        false;

      this.changeDetector
        .detectChanges();

      return;

    }


    this.isLoadingProgress =
      true;

    this.progressError =
      '';

    this.recentWorkouts =
      [];


    this.changeDetector
      .detectChanges();


    this.loadWorkoutPage(
      token,
      0,
      [],
    );

  }


  private loadWorkoutPage(
    token: string,
    offset: number,
    collectedWorkouts:
      WorkoutDetail[],
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

          const completedOnPage =
            response.items.filter(
              workout =>
                Boolean(
                  workout.finished_at,
                ),
            );


          const allCompletedWorkouts = [
            ...collectedWorkouts,
            ...completedOnPage,
          ];


          /*
           * If backend has more history,
           * continue loading it.
           */
          if (
            response.has_more
          ) {

            this.loadWorkoutPage(
              token,
              offset +
                response.limit,
              allCompletedWorkouts,
            );

            return;

          }


          /*
           * We now have every completed workout.
           */
          allCompletedWorkouts.sort(
            (
              first,
              second,
            ) =>
              this.workoutTimestamp(
                second,
              ) -
              this.workoutTimestamp(
                first,
              ),
          );


          this.applyWorkoutData(
            allCompletedWorkouts,
          );


          localStorage.removeItem(
            this.WORKOUTS_CHANGED_KEY,
          );


          this.isLoadingProgress =
            false;


          this.changeDetector
            .detectChanges();

        },


        error: error => {

          console.error(
            'Unable to load workout progress:',
            error,
          );


          this.resetWorkoutProgress();


          this.progressError =
            'Could not load workout progress.';


          this.isLoadingProgress =
            false;


          this.changeDetector
            .detectChanges();

        },

      });

  }


  private applyWorkoutData(
    completedWorkouts:
      WorkoutDetail[],
  ): void {

    /*
     * CONDITION 1:
     *
     * User has NEVER completed a workout.
     *
     * Progress = zero
     * Recent Activity = empty state
     */
    if (
      completedWorkouts.length ===
      0
    ) {

      this.resetWorkoutProgress();

      return;

    }


    /*
     * CONDITIONS 2 + 3:
     *
     * Weekly cards are calculated ONLY from
     * workouts completed during this week.
     *
     * Recent Activity uses ALL completed
     * workout history, newest first.
     */
    this.calculateWeeklyProgress(
      completedWorkouts,
    );


    this.streakDays =
      this.calculateStreak(
        completedWorkouts,
      );


    /*
     * Profile intentionally shows only 3.
     * View All handles complete history.
     */
    this.recentWorkouts =
      completedWorkouts
        .slice(
          0,
          3,
        )
        .map(
          workout =>
            this.toRecentWorkout(
              workout,
            ),
        );

  }


  private resetWorkoutProgress(): void {

    this.workoutsThisWeek =
      0;

    this.volumeThisWeek =
      0;

    this.streakDays =
      0;

    this.exercisesThisWeek =
      0;

    this.recentWorkouts =
      [];

  }


  /* =====================================================
     WEEKLY PROGRESS
  ===================================================== */

  private calculateWeeklyProgress(
    workouts:
      WorkoutDetail[],
  ): void {

    const startOfWeek =
      this.getStartOfWeek(
        new Date(),
      );


    const startOfNextWeek =
      new Date(
        startOfWeek,
      );


    startOfNextWeek.setDate(
      startOfNextWeek.getDate() +
      7,
    );


    const weeklyWorkouts =
      workouts.filter(
        workout => {

          const completedAt =
            this.getWorkoutDate(
              workout,
            );


          if (!completedAt) {
            return false;
          }


          return (
            completedAt >=
              startOfWeek &&
            completedAt <
              startOfNextWeek
          );

        },
      );


    this.workoutsThisWeek =
      weeklyWorkouts.length;


    this.volumeThisWeek =
      Math.round(
        weeklyWorkouts.reduce(
          (
            total,
            workout,
          ) =>
            total +
            this.calculateWorkoutVolume(
              workout,
            ),
          0,
        ),
      );


    this.exercisesThisWeek =
      weeklyWorkouts.reduce(
        (
          total,
          workout,
        ) =>
          total +
          workout.exercises.length,
        0,
      );

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
     VOLUME

     volume = weight × reps
  ===================================================== */

  calculateWorkoutVolume(
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
                  this.safeNumber(
                    set.weight,
                  );


                const reps =
                  this.safeNumber(
                    set.reps,
                  );


                return (
                  setTotal +
                  (
                    weight *
                    reps
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


  private safeNumber(
    value:
      number |
      null |
      undefined,
  ): number {

    const numberValue =
      Number(
        value,
      );


    return Number.isFinite(
      numberValue,
    )
      ? numberValue
      : 0;

  }


  /* =====================================================
     STREAK
  ===================================================== */

  private calculateStreak(
    workouts:
      WorkoutDetail[],
  ): number {

    const workoutDays =
      new Set<string>();


    workouts.forEach(
      workout => {

        const workoutDate =
          this.getWorkoutDate(
            workout,
          );


        if (!workoutDate) {
          return;
        }


        workoutDays.add(
          this.toLocalDateKey(
            workoutDate,
          ),
        );

      },
    );


    if (
      workoutDays.size ===
      0
    ) {
      return 0;
    }


    const today =
      this.startOfDay(
        new Date(),
      );


    const yesterday =
      new Date(
        today,
      );


    yesterday.setDate(
      yesterday.getDate() -
      1,
    );


    let cursor:
      Date;


    if (
      workoutDays.has(
        this.toLocalDateKey(
          today,
        ),
      )
    ) {

      cursor =
        new Date(
          today,
        );

    } else if (
      workoutDays.has(
        this.toLocalDateKey(
          yesterday,
        ),
      )
    ) {

      cursor =
        new Date(
          yesterday,
        );

    } else {

      return 0;

    }


    let streak =
      0;


    while (
      workoutDays.has(
        this.toLocalDateKey(
          cursor,
        ),
      )
    ) {

      streak +=
        1;


      cursor.setDate(
        cursor.getDate() -
        1,
      );

    }


    return streak;

  }


  private startOfDay(
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


    return result;

  }


  private toLocalDateKey(
    date: Date,
  ): string {

    const year =
      date.getFullYear();


    const month =
      String(
        date.getMonth() +
        1,
      )
        .padStart(
          2,
          '0',
        );


    const day =
      String(
        date.getDate(),
      )
        .padStart(
          2,
          '0',
        );


    return (
      `${year}-${month}-${day}`
    );

  }


  /* =====================================================
     RECENT ACTIVITY
  ===================================================== */

  private toRecentWorkout(
    workout:
      WorkoutDetail,
  ): RecentWorkoutView {

    const workoutDate =
      this.getWorkoutDate(
        workout,
      );


    return {

      workoutId:
        workout.workout_id,

      /*
       * Backend currently does not return
       * the routine name in workout history.
       *
       * Do not invent workout names.
       */
      title:
        'Workout',

      dateLabel:
        workoutDate
          ? this.formatWorkoutDate(
              workoutDate,
            )
          : 'Completed',

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

    /*
     * Only completed workouts should contribute
     * to Profile.
     */
    const value =
      workout.finished_at;


    if (!value) {
      return null;
    }


    const parsed =
      new Date(
        value,
      );


    if (
      Number.isNaN(
        parsed.getTime(),
      )
    ) {
      return null;
    }


    return parsed;

  }


  private workoutTimestamp(
    workout:
      WorkoutDetail,
  ): number {

    return (
      this.getWorkoutDate(
        workout,
      )?.getTime() ||
      0
    );

  }


  private formatWorkoutDate(
    date: Date,
  ): string {

    const today =
      this.startOfDay(
        new Date(),
      );


    const workoutDay =
      this.startOfDay(
        date,
      );


    const difference =
      Math.round(
        (
          today.getTime() -
          workoutDay.getTime()
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
      },
    ).format(
      date,
    );

  }


  private formatDuration(
    durationSeconds:
      number |
      null,
  ): string {

    const seconds =
      this.safeNumber(
        durationSeconds,
      );


    if (
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


  /* =====================================================
     SETTINGS
  ===================================================== */

  openSettings(): void {

    this.showSettings =
      true;

  }


  closeSettings(): void {

    this.showSettings =
      false;

  }


  openAppearance(): void {

    window.alert(
      'Appearance settings will be connected next.',
    );

  }


  openAccount(): void {

    this.closeSettings();


    this.router.navigate([
      '/account',
    ]);

  }


  openNotifications(): void {

    window.alert(
      'Notification settings will be connected next.',
    );

  }


  openPrivacy(): void {

    window.alert(
      'Privacy settings will be connected next.',
    );

  }


  openSupport(): void {

    window.alert(
      'Help & Support will be connected next.',
    );

  }


  openAbout(): void {

    window.alert(
      'PulseOS',
    );

  }


  /* =====================================================
     NAVIGATION
  ===================================================== */

  goHome(): void {

    this.router.navigate([
      '/dashboard',
    ]);

  }


  goToWorkouts(): void {

    this.router.navigate([
      '/dashboard',
    ]);

  }


  goToHealthify(): void {

    this.router.navigate([
      '/healthify',
    ]);

  }


  goToProfile(): void {

    /*
     * If already on Profile, explicitly refresh
     * workout data instead of doing nothing.
     */
    this.loadWorkoutProgress();

  }


  editProfile(): void {

    this.router.navigate([
      '/account',
    ]);

  }


  viewAllWorkouts(): void {

    this.router.navigate([
      '/workout-history',
    ]);

  }


  openRecentWorkout(
    workoutId: number,
  ): void {

    this.router.navigate([
      '/workout-history',
      workoutId,
    ]);

  }


  /* =====================================================
     LOGOUT CONFIRMATION
  ===================================================== */

  logout(): void {

    /*
     * Keep the Settings sheet open underneath
     * the confirmation dialog.
     *
     * If the user cancels, they return exactly
     * where they were.
     */
    this.showLogoutDialog =
      true;

  }


  cancelLogout(): void {

    this.showLogoutDialog =
      false;

  }


  confirmLogout(): void {

    this.showLogoutDialog =
      false;


    localStorage.removeItem(
      'pulseos_access_token',
    );


    localStorage.removeItem(
      'pulseos_refresh_token',
    );


    localStorage.removeItem(
      'pulseos_user_email',
    );


    localStorage.removeItem(
      'pulseos_user_full_name',
    );


    this.showSettings =
      false;


    this.router.navigate([
      '/login',
    ]);

  }

}