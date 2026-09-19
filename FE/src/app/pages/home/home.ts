import {
  Component,
  OnInit,
} from '@angular/core';

import {
  DecimalPipe,
} from '@angular/common';

import {
  HttpClient,
} from '@angular/common/http';

import {
  Router,
} from '@angular/router';

import {
  environment,
} from '../../../environments/environment';


/* =========================================================
   LOCATION STATE
========================================================= */

type LocationStatus =
  | 'idle'
  | 'loading'
  | 'ready'
  | 'denied'
  | 'unavailable'
  | 'error';


/* =========================================================
   GYM MODEL
========================================================= */

export interface NearbyGym {

  id: string;

  name: string;

  latitude: number;

  longitude: number;

  distanceMeters: number | null;

  rating: number | null;

  ratingCount: number | null;

  address: string | null;

  isOpen: boolean | null;

  photoUrl: string | null;

}


/* =========================================================
   GEOAPIFY RESPONSE
========================================================= */

interface GeoapifyPlaceProperties {

  place_id?: string;

  name?: string;

  lat: number;

  lon: number;

  formatted?: string;

  address_line1?: string;

  address_line2?: string;

  categories?: string[];

  distance?: number;

}


interface GeoapifyPlaceFeature {

  type: string;

  properties: GeoapifyPlaceProperties;

}


interface GeoapifyPlacesResponse {

  type: string;

  features: GeoapifyPlaceFeature[];

}


/* =========================================================
   NOTIFICATION MODEL
========================================================= */

export interface HomeNotification {

  id: string;

  title: string;

  message: string;

  createdAt: Date;

  isRead: boolean;

}


/* =========================================================
   COMPONENT
========================================================= */

@Component({

  selector: 'app-home',

  imports: [
    DecimalPipe,
  ],

  templateUrl: './home.html',

  styleUrl: './home.css',

})

export class Home
  implements OnInit {


  /* =====================================================
     LOCATION
  ===================================================== */

  locationStatus:
    LocationStatus =
    'idle';


  latitude:
    number | null =
    null;


  longitude:
    number | null =
    null;


  locationErrorMessage =
    '';


  /* =====================================================
     NEARBY GYMS
  ===================================================== */

  nearbyGyms:
    NearbyGym[] = [];


  isLoadingGyms =
    false;


  gymErrorMessage =
    '';


  private readonly GYM_SEARCH_RADIUS =
    5000;


  private readonly GEOAPIFY_PLACES_URL =
    'https://api.geoapify.com/v2/places';


  /* =====================================================
     NOTIFICATIONS
  ===================================================== */

  notifications:
    HomeNotification[] = [];


  showNotifications =
    false;


  /* =====================================================
     CONSTRUCTOR
  ===================================================== */

  constructor(
    private router:
      Router,

    private http:
      HttpClient,
  ) {}


  /* =====================================================
     INITIALIZE HOME
  ===================================================== */

  ngOnInit(): void {

    this.requestLocation();

  }


  /* =====================================================
     GREETING
  ===================================================== */

  get greeting(): string {

    const hour =
      new Date()
        .getHours();


    if (
      hour < 12
    ) {

      return 'Good morning';

    }


    if (
      hour < 17
    ) {

      return 'Good afternoon';

    }


    return 'Good evening';

  }


  /* =====================================================
     UNREAD NOTIFICATION COUNT
  ===================================================== */

  get unreadNotificationCount():
    number {

    return this.notifications
      .filter(
        notification =>
          !notification.isRead,
      )
      .length;

  }


  get hasUnreadNotifications():
    boolean {

    return (
      this.unreadNotificationCount >
      0
    );

  }


  /* =====================================================
     REQUEST DEVICE LOCATION
  ===================================================== */

  requestLocation(): void {

    this.locationErrorMessage =
      '';


    this.gymErrorMessage =
      '';


    if (
      !navigator.geolocation
    ) {

      this.locationStatus =
        'unavailable';


      this.locationErrorMessage =
        'Location is not supported by this browser.';


      return;

    }


    this.locationStatus =
      'loading';


    navigator.geolocation
      .getCurrentPosition(

        position => {

          this.latitude =
            position.coords.latitude;


          this.longitude =
            position.coords.longitude;


          this.locationStatus =
            'ready';


          this.loadNearbyGyms();

        },


        error => {

          this.latitude =
            null;


          this.longitude =
            null;


          this.nearbyGyms =
            [];


          this.isLoadingGyms =
            false;


          switch (
            error.code
          ) {

            case error.PERMISSION_DENIED:

              this.locationStatus =
                'denied';


              this.locationErrorMessage =
                'Enable location access to discover gyms near you.';

              break;


            case error.POSITION_UNAVAILABLE:

              this.locationStatus =
                'unavailable';


              this.locationErrorMessage =
                'Your current location could not be determined.';

              break;


            case error.TIMEOUT:

              this.locationStatus =
                'error';


              this.locationErrorMessage =
                'Location detection took too long. Please try again.';

              break;


            default:

              this.locationStatus =
                'error';


              this.locationErrorMessage =
                'Unable to access your location. Please try again.';

          }

        },


        {

          enableHighAccuracy:
            true,

          timeout:
            10000,

          maximumAge:
            300000,

        },

      );

  }


  /* =====================================================
     LOAD NEARBY GYMS FROM GEOAPIFY
  ===================================================== */

  private loadNearbyGyms():
    void {

    if (
      this.latitude === null ||
      this.longitude === null
    ) {

      return;

    }


    this.isLoadingGyms =
      true;


    this.gymErrorMessage =
      '';


    this.nearbyGyms =
      [];


    const latitude =
      this.latitude;


    const longitude =
      this.longitude;


    const url =
      `${this.GEOAPIFY_PLACES_URL}` +
      `?categories=sport.fitness` +
      `&filter=circle:${longitude},${latitude},${this.GYM_SEARCH_RADIUS}` +
      `&bias=proximity:${longitude},${latitude}` +
      `&limit=20` +
      `&apiKey=${encodeURIComponent(environment.geoapifyApiKey)}`;


    this.http
      .get<GeoapifyPlacesResponse>(
        url,
      )
      .subscribe({

        next: response => {

          this.nearbyGyms =
            response.features
              .map(
                feature =>
                  this.mapGeoapifyPlaceToGym(
                    feature,
                    latitude,
                    longitude,
                  ),
              )
              .filter(
                (
                  gym,
                ): gym is NearbyGym =>
                  gym !== null,
              )
              .sort(
                (
                  first,
                  second,
                ) =>
                  (
                    first.distanceMeters ??
                    Number.MAX_SAFE_INTEGER
                  ) -
                  (
                    second.distanceMeters ??
                    Number.MAX_SAFE_INTEGER
                  ),
              );


          this.isLoadingGyms =
            false;

        },


        error: error => {

          console.error(
            'Unable to load nearby gyms from Geoapify:',
            error,
          );


          this.nearbyGyms =
            [];


          this.isLoadingGyms =
            false;


          this.gymErrorMessage =
            'Unable to load nearby gyms right now. Please try again.';

        },

      });

  }


  /* =====================================================
     CONVERT GEOAPIFY PLACE TO PULSEOS GYM
  ===================================================== */

  private mapGeoapifyPlaceToGym(
    feature:
      GeoapifyPlaceFeature,

    userLatitude:
      number,

    userLongitude:
      number,
  ): NearbyGym | null {

    const place =
      feature.properties;


    if (
      !place.name ||
      typeof place.lat !== 'number' ||
      typeof place.lon !== 'number'
    ) {

      return null;

    }


    const addressParts =
      [
        place.address_line1,
        place.address_line2,
      ]
        .filter(
          (
            value,
          ): value is string =>
            Boolean(value),
        );


    const address =
      place.formatted ||
      (
        addressParts.length > 0
          ? addressParts.join(', ')
          : null
      );


    return {

      id:
        place.place_id ??
        `${place.lat}-${place.lon}`,

      name:
        place.name,

      latitude:
        place.lat,

      longitude:
        place.lon,

      distanceMeters:
        typeof place.distance === 'number'
          ? Math.round(
              place.distance,
            )
          : Math.round(
              this.calculateDistanceMeters(
                userLatitude,
                userLongitude,
                place.lat,
                place.lon,
              ),
            ),

      /*
       * Geoapify Places does not give us
       * Google-style review ratings here.
       * Do not fabricate them.
       */
      rating:
        null,

      ratingCount:
        null,

      address,

      isOpen:
        null,

      photoUrl:
        null,

    };

  }


  /* =====================================================
     DISTANCE CALCULATION
  ===================================================== */

  private calculateDistanceMeters(
    latitude1:
      number,

    longitude1:
      number,

    latitude2:
      number,

    longitude2:
      number,
  ): number {

    const earthRadius =
      6371000;


    const toRadians =
      (
        degrees:
          number,
      ) =>
        degrees *
        (
          Math.PI /
          180
        );


    const latitudeDifference =
      toRadians(
        latitude2 -
        latitude1,
      );


    const longitudeDifference =
      toRadians(
        longitude2 -
        longitude1,
      );


    const firstLatitude =
      toRadians(
        latitude1,
      );


    const secondLatitude =
      toRadians(
        latitude2,
      );


    const haversine =
      Math.sin(
        latitudeDifference /
        2,
      ) ** 2 +
      Math.cos(
        firstLatitude,
      ) *
      Math.cos(
        secondLatitude,
      ) *
      Math.sin(
        longitudeDifference /
        2,
      ) ** 2;


    const angularDistance =
      2 *
      Math.atan2(
        Math.sqrt(
          haversine,
        ),
        Math.sqrt(
          1 -
          haversine,
        ),
      );


    return (
      earthRadius *
      angularDistance
    );

  }


  /* =====================================================
     DIRECTIONS
  ===================================================== */

  openDirections(
    gym:
      NearbyGym,
  ): void {

    const destination =
      `${gym.latitude},${gym.longitude}`;


    /*
     * This opens the normal Google Maps website.
     * It does not use the paid Google Maps API.
     */
    const url =
      'https://www.google.com/maps/dir/?api=1' +
      `&destination=${encodeURIComponent(destination)}`;


    window.open(
      url,
      '_blank',
      'noopener,noreferrer',
    );

  }


  /* =====================================================
     NOTIFICATIONS
  ===================================================== */

  toggleNotifications():
    void {

    this.showNotifications =
      !this.showNotifications;

  }


  closeNotifications():
    void {

    this.showNotifications =
      false;

  }


  markNotificationRead(
    notification:
      HomeNotification,
  ): void {

    notification.isRead =
      true;

  }


  markAllNotificationsRead():
    void {

    this.notifications =
      this.notifications.map(
        notification => ({

          ...notification,

          isRead:
            true,

        }),
      );

  }


  /* =====================================================
     START WORKOUT
  ===================================================== */

  startWorkout():
    void {

    this.router.navigate([
      '/dashboard',
    ]);

  }


  /* =====================================================
     QUICK ACTION — WORKOUTS
  ===================================================== */

  goToWorkouts():
    void {

    this.router.navigate([
      '/dashboard',
    ]);

  }


  /* =====================================================
     QUICK ACTION — NUTRITION
  ===================================================== */

  goToNutrition():
    void {

    this.router.navigate([
      '/healthify',
    ]);

  }


  /* =====================================================
     PROFILE
  ===================================================== */

  goToProfile():
    void {

    this.router.navigate([
      '/profile',
    ]);

  }


  /* =====================================================
     HOME
  ===================================================== */

  goToHome():
    void {

    /*
     * Already on Home.
     */

  }

}