import {
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';

import {
  ActivatedRoute,
  Router,
} from '@angular/router';

import {
  GymDetails as GymDetailsModel,
  LiftlogApiService,
} from '../../services/liftlog-api.service';


interface TimingView {
  day: string;
  open: string;
  close: string;
}


@Component({
  selector: 'app-gym-details',
  imports: [],
  templateUrl: './gym-details.html',
  styleUrl: './gym-details.css',
})
export class GymDetails
  implements OnInit {

  gymId =
    0;


  gym:
    GymDetailsModel |
    null =
    null;


  isLoading =
    true;

  errorMessage =
    '';

  failedPhotos =
    new Set<string>();


  constructor(
    private readonly route:
      ActivatedRoute,

    private readonly router:
      Router,

    private readonly liftlogApi:
      LiftlogApiService,

    private readonly changeDetectorRef:
      ChangeDetectorRef,
  ) {}


  ngOnInit(): void {

    this.gymId =
      Number(
        this.route.snapshot
          .paramMap
          .get(
            'gymId',
          ),
      );


    if (
      !Number.isInteger(
        this.gymId,
      ) ||
      this.gymId <=
        0
    ) {

      this.router.navigate(
        [
          '/home',
        ],
      );

      return;

    }


    this.loadGymDetails();

  }


  get timings():
    TimingView[] {

    if (
      !this.gym
    ) {

      return [];

    }


    const preferredOrder = [
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
      'sunday',
    ];


    const keys =
      Object.keys(
        this.gym.timings ||
        {},
      );


    keys.sort(
      (
        first,
        second,
      ) => {

        const firstIndex =
          preferredOrder.indexOf(
            first.toLowerCase(),
          );


        const secondIndex =
          preferredOrder.indexOf(
            second.toLowerCase(),
          );


        return (
          (
            firstIndex ===
              -1
              ? 99
              : firstIndex
          ) -
          (
            secondIndex ===
              -1
              ? 99
              : secondIndex
          )
        );

      },
    );


    return keys.map(
      key => ({

        day:
          key.charAt(
            0,
          ).toUpperCase() +
          key.slice(
            1,
          ),

        open:
          this.gym!
            .timings[
              key
            ].open,

        close:
          this.gym!
            .timings[
              key
            ].close,

      }),
    );

  }


  private loadGymDetails(): void {

    this.isLoading =
      true;

    this.errorMessage =
      '';


    this.changeDetectorRef
      .detectChanges();


    this.liftlogApi
      .getGymDetails(
        this.gymId,
      )
      .subscribe({

        next: gym => {

          console.log(
            'GYM DETAILS RESPONSE:',
            gym,
          );


          this.gym =
            gym;

          this.isLoading =
            false;


          this.changeDetectorRef
            .detectChanges();

        },


        error: error => {

          console.error(
            'Unable to load gym details:',
            error,
          );


          this.gym =
            null;

          this.errorMessage =
            'Could not load the gym details.';


          this.isLoading =
            false;


          this.changeDetectorRef
            .detectChanges();

        },

      });

  }


  openDirections(): void {

    if (
      !this.gym?.maps_url
    ) {

      return;

    }


    window.open(
      this.gym.maps_url,
      '_blank',
      'noopener,noreferrer',
    );

  }


  callGym(): void {

    const phone =
      this.gym?.contact
        ?.phone
        ?.trim();


    if (
      !phone
    ) {

      return;

    }


    window.location.href =
      `tel:${phone}`;

  }


  emailGym(): void {

    const email =
      this.gym?.contact
        ?.email
        ?.trim();


    if (
      !email
    ) {

      return;

    }


    window.location.href =
      `mailto:${email}`;

  }


  bookSession(): void {

    this.router.navigate(
      [
        '/gyms',
        this.gymId,
      ],
    );

  }


  onPhotoError(
    photo:
      string,
  ): void {

    this.failedPhotos
      .add(
        photo,
      );


    this.changeDetectorRef
      .detectChanges();

  }


  goBack(): void {

    this.router.navigate(
      [
        '/gyms',
        this.gymId,
      ],
    );

  }


  formatTime(
    time:
      string,
  ): string {

    const [
      hoursText,
      minutesText,
    ] =
      time.split(
        ':',
      );


    const hours =
      Number(
        hoursText,
      );


    const minutes =
      Number(
        minutesText,
      );


    if (
      !Number.isFinite(
        hours,
      ) ||
      !Number.isFinite(
        minutes,
      )
    ) {

      return time;

    }


    const suffix =
      hours >=
        12
        ? 'PM'
        : 'AM';


    const displayHour =
      hours %
        12 ||
      12;


    return (
      `${displayHour}:${String(
        minutes,
      ).padStart(
        2,
        '0',
      )} ${suffix}`
    );

  }

}