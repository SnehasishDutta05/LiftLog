import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup',
  imports: [FormsModule],
  templateUrl: './signup.html',
  styleUrl: './signup.css',
})
export class Signup {
  fullName = '';
  email = '';
  password = '';
  confirmPassword = '';

  showPassword = false;
  showConfirmPassword = false;

  submitted = false;

  constructor(private router: Router) {}

  get validFullName(): boolean {
    return this.fullName.trim().length >= 2;
  }

  get validEmail(): boolean {
    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    return emailRegex.test(this.email.trim());
  }

  get hasMinimumLength(): boolean {
    return this.password.length >= 8;
  }

  get hasUppercase(): boolean {
    return /[A-Z]/.test(this.password);
  }

  get hasLowercase(): boolean {
    return /[a-z]/.test(this.password);
  }

  get hasDigit(): boolean {
    return /\d/.test(this.password);
  }

  get hasSpecialCharacter(): boolean {
    return /[^A-Za-z0-9]/.test(this.password);
  }

  get validPassword(): boolean {
    return (
      this.hasMinimumLength &&
      this.hasUppercase &&
      this.hasLowercase &&
      this.hasDigit &&
      this.hasSpecialCharacter
    );
  }

  get passwordsMatch(): boolean {
    return (
      this.confirmPassword.length > 0 &&
      this.password === this.confirmPassword
    );
  }

  get formValid(): boolean {
    return (
      this.validFullName &&
      this.validEmail &&
      this.validPassword &&
      this.passwordsMatch
    );
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword =
      !this.showConfirmPassword;
  }

  createAccount(): void {
    this.submitted = true;

    if (!this.formValid) {
      return;
    }

    console.log('Signup data:', {
      fullName: this.fullName.trim(),
      email: this.email.trim(),
      password: this.password,
    });

    this.router.navigate(['/onboarding']);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}