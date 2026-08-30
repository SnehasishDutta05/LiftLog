import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup',
  imports: [],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup {
  constructor(private router: Router) {}

  createAccount(): void {
    this.router.navigate(['/onboarding']);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
