import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { LiftlogApiService } from '../../services/liftlog-api.service';

@Component({
  selector: 'app-signup',
  imports: [FormsModule],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup {
  email = '';
  password = '';
  confirmPassword = '';

  constructor(
    private readonly router: Router,
    private readonly api: LiftlogApiService
  ) {}

  createAccount(): void {
    if (!this.email || !this.password) {
      alert('Email and password are required.');
      return;
    }

    if (this.password !== this.confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    this.api.signup(this.email, this.password).subscribe({
      next: () => {
        this.router.navigate(['/onboarding']);
      },
      error: (error) => {
        console.error('Signup failed', error);
        alert('Signup failed. Please try again.');
      },
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
