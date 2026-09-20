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
  UserProfile,
  UserPublic,
} from '../../services/liftlog-api.service';


@Component({
  selector: 'app-account',
  standalone: true,
  imports: [],
  templateUrl: './account.html',
  styleUrl: './account.css',
})
export class Account implements OnInit {

  user: UserPublic | null = null;
  profile: UserProfile | null = null;

  isLoading = true;
  errorMessage = '';


  constructor(
    private readonly api:
      LiftlogApiService,

    private readonly router:
      Router,

    private readonly changeDetector:
      ChangeDetectorRef,
  ) {}


  ngOnInit(): void {
    this.loadAccount();
  }


  private loadAccount(): void {

  const token =
    localStorage.getItem(
      'pulseos_access_token',
    );

  if (!token) {
    this.router.navigate(['/login']);
    return;
  }

  this.isLoading = true;
  this.errorMessage = '';

  this.api
    .getProfile(token)
    .subscribe({

      next: profile => {

        this.profile = profile;
        this.isLoading = false;

        this.changeDetector
          .detectChanges();
      },

      error: error => {

        console.error(
          'Unable to load profile:',
          error,
        );

        this.isLoading = false;

        this.errorMessage =
          'Could not load your profile.';

        this.changeDetector
          .detectChanges();
      },

    });

}


  goBack(): void {
    this.router.navigate(['/profile']);
  }


  display(
    value:
      string |
      null |
      undefined,
  ): string {

    const cleaned =
      value?.trim();

    return cleaned || 'Not set';
  }


  get initials(): string {

    const name =
      this.user?.full_name?.trim();

    if (name) {

      const words =
        name
          .split(/\s+/)
          .filter(Boolean);

      if (words.length >= 2) {
        return (
          words[0][0] +
          words[words.length - 1][0]
        ).toUpperCase();
      }

      return name
        .slice(0, 2)
        .toUpperCase();
    }

    const email =
      this.user?.email?.trim();

    if (email) {
      return email
        .slice(0, 2)
        .toUpperCase();
    }

    return 'P';
  }


  get accountName(): string {

    const name =
      this.user?.full_name?.trim();

    return name || 'PulseOS User';
  }


  get email(): string {
    return this.user?.email || 'Not set';
  }


  get height(): string {

    const value =
      this.profile?.height?.trim();

    return value
      ? `${value} ft`
      : 'Not set';
  }


  get weight(): string {

    const value =
      this.profile?.weight?.trim();

    return value
      ? `${value} kg`
      : 'Not set';
  }


  get targetWeight(): string {

    const value =
      this.profile
        ?.target_weight
        ?.trim();

    return value
      ? `${value} kg`
      : 'Not set';
  }

}