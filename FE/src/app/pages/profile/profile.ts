import {
  Component,
  OnInit,
} from '@angular/core';

import {
  Router,
} from '@angular/router';

@Component({
  selector: 'app-profile',
  imports: [],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {

  showSettings = false;

  fullName = 'PulseOS User';

  email = '';

  workoutsThisWeek = 0;

  volumeThisWeek = 0;

  streakDays = 0;

  exercisesThisWeek = 0;

  age = '—';

  height = '—';

  weight = '—';

  fitnessLevel = '—';

  goal = '—';


  constructor(
    private router: Router,
  ) {}


  ngOnInit(): void {

    this.loadUserData();

  }


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


    /*
     * These are placeholders until we wire
     * the profile/progress APIs.
     */
    this.workoutsThisWeek = 0;

    this.volumeThisWeek = 0;

    this.streakDays = 0;

    this.exercisesThisWeek = 0;

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


  openSettings(): void {

    this.showSettings = true;

  }


  closeSettings(): void {

    this.showSettings = false;

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

    this.router.navigate([
      '/profile',
    ]);

  }


  editProfile(): void {

    window.alert(
      'Edit Profile will be connected next.',
    );

  }


  openAppearance(): void {

    window.alert(
      'Appearance settings will be connected next.',
    );

  }


  openAccount(): void {

    window.alert(
      'Account settings will be connected next.',
    );

  }


  logout(): void {

    const shouldLogout =
      window.confirm(
        'Log out of PulseOS?',
      );


    if (!shouldLogout) {
      return;
    }


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


    this.router.navigate([
      '/login',
    ]);

  }
  

}