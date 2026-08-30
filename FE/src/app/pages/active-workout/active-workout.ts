import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-active-workout',
  imports: [],
  templateUrl: './active-workout.html',
  styleUrl: './active-workout.css',
})
export class ActiveWorkout implements OnInit, OnDestroy {
  elapsedSeconds = 0;

  totalVolume = 0;

  totalSets = 0;

  private timer?: ReturnType<typeof setInterval>;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.timer = setInterval(() => {
      this.elapsedSeconds++;
    }, 1000);
  }

  get formattedDuration(): string {
    const hours = Math.floor(this.elapsedSeconds / 3600);

    const minutes = Math.floor((this.elapsedSeconds % 3600) / 60);

    const seconds = this.elapsedSeconds % 60;

    if (hours > 0) {
      return `${hours}:${this.pad(minutes)}:${this.pad(seconds)}`;
    }

    if (minutes > 0) {
      return `${minutes}:${this.pad(seconds)}`;
    }

    return `${seconds}s`;
  }

  private pad(value: number): string {
    return value.toString().padStart(2, '0');
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  addExercise(): void {
    console.log('Add exercise clicked');
  }

  openSettings(): void {
    console.log('Workout settings clicked');
  }

  discardWorkout(): void {
    const shouldDiscard = window.confirm('Discard this workout?');

    if (!shouldDiscard) {
      return;
    }

    this.router.navigate(['/dashboard']);
  }

  finishWorkout(): void {
    console.log('Workout finished');

    this.router.navigate(['/dashboard']);
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }
}
