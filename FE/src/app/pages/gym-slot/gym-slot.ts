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
  BookingResponse,
  GymSlotDetail,
  LiftlogApiService,
} from '../../services/liftlog-api.service';


@Component({
  selector: 'app-gym-slot',
  imports: [],
  templateUrl: './gym-slot.html',
  styleUrl: './gym-slot.css',
})
export class GymSlot
  implements OnInit {

  gymId =
    0;

  slotId =
    0;


  detail:
    GymSlotDetail |
    null =
    null;

  booking:
    BookingResponse |
    null =
    null;


  isLoading =
    true;

  isBooking =
    false;

  loadError =
    '';

  bookingError =
    '';

  gymImageFailed =
    false;


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


    this.slotId =
      Number(
        this.route.snapshot
          .paramMap
          .get(
            'slotId',
          ),
      );


    if (
      !Number.isInteger(
        this.gymId,
      ) ||
      this.gymId <=
        0 ||
      !Number.isInteger(
        this.slotId,
      ) ||
      this.slotId <=
        0
    ) {

      this.router.navigate(
        [
          '/home',
        ],
      );

      return;

    }


    this.loadSlot();

  }


  private loadSlot(): void {

    this.isLoading =
      true;

    this.loadError =
      '';


    this.changeDetectorRef
      .detectChanges();


    this.liftlogApi
      .getGymSlotDetail(
        this.gymId,
        this.slotId,
      )
      .subscribe({

        next: detail => {

          console.log(
            'GYM SLOT DETAIL:',
            detail,
          );


          this.detail =
            detail;

          this.isLoading =
            false;


          this.changeDetectorRef
            .detectChanges();

        },


        error: error => {

          console.error(
            'Unable to load slot detail:',
            error,
          );


          this.detail =
            null;

          this.loadError =
            'Could not load this booking session.';


          this.isLoading =
            false;


          this.changeDetectorRef
            .detectChanges();

        },

      });

  }


  confirmBooking(): void {

    if (
      !this.detail ||
      this.isBooking ||
      this.booking
    ) {

      return;

    }


    const token =
      localStorage.getItem(
        'pulseos_access_token',
      );


    if (
      !token
    ) {

      this.bookingError =
        'Your session has expired. Please sign in again.';


      this.changeDetectorRef
        .detectChanges();


      return;

    }


    this.isBooking =
      true;

    this.bookingError =
      '';


    this.changeDetectorRef
      .detectChanges();


    this.liftlogApi
      .createBooking(
        token,
        {
          gym_id:
            this.detail.gym.gym_id,

          slot_id:
            this.detail.slot.slot_id,

          date:
            this.detail.slot.date,
        },
      )
      .subscribe({

        next: booking => {

          console.log(
            'BOOKING RESPONSE:',
            booking,
          );


          this.booking =
            booking;

          this.isBooking =
            false;


          this.changeDetectorRef
            .detectChanges();

        },


        error: error => {

          console.error(
            'Unable to create booking:',
            error,
          );


          this.bookingError =
            this.readBookingError(
              error,
            );


          this.isBooking =
            false;


          this.changeDetectorRef
            .detectChanges();

        },

      });

  }


  openDirections(): void {

    const mapsUrl =
      this.detail?.maps_url;


    if (
      !mapsUrl
    ) {

      return;

    }


    window.open(
      mapsUrl,
      '_blank',
      'noopener,noreferrer',
    );

  }


  openGymDetails(): void {

    this.router.navigate(
      [
        '/gyms',
        this.gymId,
        'details',
      ],
    );

  }


  onGymImageError(): void {

    this.gymImageFailed =
      true;


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


  goHome(): void {

    this.router.navigate(
      [
        '/home',
      ],
    );

  }


  formatDate(
    value:
      string,
  ): string {

    const date =
      this.parseLocalDate(
        value,
      );


    if (
      !date
    ) {

      return value;

    }


    return new Intl.DateTimeFormat(
      'en',
      {
        weekday:
          'short',

        day:
          'numeric',

        month:
          'short',

        year:
          'numeric',
      },
    ).format(
      date,
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


  private parseLocalDate(
    value:
      string,
  ): Date | null {

    const parts =
      value
        .split(
          '-',
        )
        .map(
          Number,
        );


    if (
      parts.length !==
        3 ||
      parts.some(
        part =>
          !Number.isFinite(
            part,
          ),
      )
    ) {

      return null;

    }


    return new Date(
      parts[0],
      parts[1] -
        1,
      parts[2],
    );

  }


  private readBookingError(
    error:
      any,
  ): string {

    const detail =
      error?.error?.detail;


    if (
      typeof detail ===
        'string' &&
      detail.trim()
    ) {

      return detail;

    }


    return (
      'We could not confirm this booking. The slot may no longer be available.'
    );

  }

}