import {
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';

import {
  Router,
} from '@angular/router';


type LocationStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'denied'
  | 'unavailable'
  | 'error';


export interface HomeNotification {
  id: string;
  title: string;
  message: string;
  createdAt: Date;
  isRead: boolean;
}


@Component({
  selector: 'app-home',
  imports: [],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {

  locationStatus: LocationStatus = 'idle';

  latitude: number | null = null;
  longitude: number | null = null;

  locationErrorMessage = '';

  notifications: HomeNotification[] = [];

  showNotifications = false;


  constructor(
  private router: Router,
  private changeDetectorRef: ChangeDetectorRef,
) {}


  ngOnInit(): void {
    this.requestLocation();
  }


  get greeting(): string {
    const hour = new Date().getHours();

    if (hour < 12) {
      return 'Good morning';
    }

    if (hour < 17) {
      return 'Good afternoon';
    }

    return 'Good evening';
  }


  get unreadNotificationCount(): number {
    return this.notifications.filter(
      notification => !notification.isRead,
    ).length;
  }


  get hasUnreadNotifications(): boolean {
    return this.unreadNotificationCount > 0;
  }


  requestLocation(): void {
  console.log('1. requestLocation started');

  this.locationErrorMessage = '';

  if (!navigator.geolocation) {
    console.log('2. Geolocation API unavailable');

    this.locationStatus = 'unavailable';
    this.locationErrorMessage =
      'Location is not supported by this browser.';

    return;
  }

  console.log('2. Geolocation API available');

  this.locationStatus = 'loading';

  navigator.geolocation.getCurrentPosition(
    position => {
      console.log(
        '3. LOCATION SUCCESS',
        position.coords.latitude,
        position.coords.longitude,
      );

      this.latitude = position.coords.latitude;
      this.longitude = position.coords.longitude;

      this.locationStatus = 'ready';
      this.changeDetectorRef.detectChanges();

      console.log(
        '4. locationStatus:',
        this.locationStatus,
      );
    },

    error => {
      console.error(
        '3. LOCATION ERROR',
        error.code,
        error.message,
      );

      this.latitude = null;
      this.longitude = null;

      switch (error.code) {
        case error.PERMISSION_DENIED:
          this.locationStatus = 'denied';
          this.locationErrorMessage =
            'Enable location access to find gyms near you.';
          break;

        case error.POSITION_UNAVAILABLE:
          this.locationStatus = 'unavailable';
          this.locationErrorMessage =
            'Your current location could not be determined.';
          break;

        case error.TIMEOUT:
          this.locationStatus = 'error';
          this.locationErrorMessage =
            'Location detection took too long. Please try again.';
          break;

        default:
          this.locationStatus = 'error';
          this.locationErrorMessage =
            'Unable to access your location. Please try again.';
      }
    },

    {
      enableHighAccuracy: false,
      timeout: 3000,
      maximumAge: 600000,
    },
  );
}


  findNearbyGyms(): void {

    if (
      this.latitude === null ||
      this.longitude === null
    ) {
      this.requestLocation();
      return;
    }

    /*
     * Google Maps search centred around the
     * user's actual device coordinates.
     *
     * No Google Places API is required.
     */

    const query = 'gyms';

    const mapsUrl =
      'https://www.google.com/maps/search/' +
      `${encodeURIComponent(query)}/` +
      `@${this.latitude},${this.longitude},14z`;

    window.open(
      mapsUrl,
      '_blank',
      'noopener,noreferrer',
    );
  }


  toggleNotifications(): void {
    this.showNotifications =
      !this.showNotifications;
  }


  closeNotifications(): void {
    this.showNotifications = false;
  }


  markNotificationRead(
    notification: HomeNotification,
  ): void {

    notification.isRead = true;
  }


  markAllNotificationsRead(): void {

    this.notifications =
      this.notifications.map(
        notification => ({
          ...notification,
          isRead: true,
        }),
      );
  }


  startWorkout(): void {
    this.router.navigate(['/dashboard']);
  }


  goToWorkouts(): void {
    this.router.navigate(['/dashboard']);
  }


  goToNutrition(): void {
    this.router.navigate(['/healthify']);
  }


  goToProfile(): void {
    this.router.navigate(['/profile']);
  }


  goToHome(): void {
    // Already on Home.
  }
}