import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { LiftlogApiService } from '../../services/liftlog-api.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  email = 'demo@liftlog.app';
  password = '123456';

  constructor(
    private readonly router: Router,
    private readonly api: LiftlogApiService
  ) {}

  signIn(): void {
    this.api.login(this.email, this.password).subscribe({
      next: (response) => {
        localStorage.setItem('liftlog_token', response.access_token);
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        console.error('Login failed', error);
        alert('Login failed. Please check your email and password.');
      },
    });
  }

  goToSignup(): void {
    this.router.navigate(['/signup']);
  }
}
