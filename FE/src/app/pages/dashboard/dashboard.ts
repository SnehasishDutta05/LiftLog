import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';

import { LiftlogApiService, Routine } from '../../services/liftlog-api.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  routines: Routine[] = [];

  constructor(private readonly api: LiftlogApiService) {}

  ngOnInit(): void {
    const token = localStorage.getItem('liftlog_token');

    if (!token) {
      return;
    }

    this.api.getRoutines(token).subscribe({
      next: (response) => {
        this.routines = response.routines ?? [];
      },
      error: (error) => {
        console.error('Failed to load routines', error);
      },
    });
  }

  startEmptyWorkout(): void {
    const token = localStorage.getItem('liftlog_token');

    if (!token) {
      return;
    }

    this.api.createWorkout(token).subscribe({
      next: (response) => {
        console.log('Workout created', response);
      },
      error: (error) => {
        console.error('Failed to create workout', error);
      },
    });
  }
}
