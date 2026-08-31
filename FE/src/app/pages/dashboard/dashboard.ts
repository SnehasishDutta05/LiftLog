import { Component } from '@angular/core';
import { Router } from '@angular/router';

interface Routine {
  name: string;
  description: string;
  shortName: string;
  className: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  routines: Routine[] = [
    {
      name: 'Legs',
      description: 'Lower body workout',
      shortName: 'L',
      className: 'legs',
    },
    {
      name: 'Chest',
      description: 'Chest focused workout',
      shortName: 'C',
      className: 'chest',
    },
    {
      name: 'Back',
      description: 'Back focused workout',
      shortName: 'B',
      className: 'back',
    },
    {
      name: 'Arms',
      description: 'Biceps and triceps',
      shortName: 'A',
      className: 'arms',
    },
    {
      name: 'Shoulders',
      description: 'Shoulder focused workout',
      shortName: 'S',
      className: 'shoulders',
    },
  ];

  constructor(private router: Router) {}

  startEmptyWorkout(): void {
    this.router.navigate(['/active-workout']);
  }

  startRoutine(routine: Routine): void {
    console.log('Starting routine:', routine.name);

    // For now routines open the active workout page.
    // Later we can pass the routine id to the backend.
    this.router.navigate(['/active-workout']);
  }
}