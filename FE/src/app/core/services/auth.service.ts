import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import {
  Observable,
  finalize,
  shareReplay,
  tap,
} from 'rxjs';

import {
  environment,
} from '../../../environments/environment';


/* =========================================================
   REQUEST MODELS
========================================================= */

export interface SignupRequest {
  full_name: string;
  email: string;
  password: string;
}


export interface LoginRequest {
  email: string;
  password: string;
}


/* =========================================================
   RESPONSE MODELS
========================================================= */

export interface AuthUser {
  access_token: string;
  refresh_token: string;
  email: string;
  full_name: string;
}


export interface AuthResponse {
  message: string;
  user: AuthUser;
}


/* =========================================================
   AUTH SERVICE
========================================================= */

@Injectable({
  providedIn: 'root',
})
export class AuthService {

  private readonly ACCESS_TOKEN_KEY =
    'pulseos_access_token';

  private readonly REFRESH_TOKEN_KEY =
    'pulseos_refresh_token';

  private readonly USER_EMAIL_KEY =
    'pulseos_user_email';

  private readonly USER_FULL_NAME_KEY =
    'pulseos_user_full_name';


  private readonly apiUrl =
    `${environment.apiBaseUrl}/auth`;


  /*
   * Access token expires after 15 minutes.
   *
   * Refresh slightly before expiry so we don't
   * race against the backend expiration time.
   */
  private readonly TOKEN_REFRESH_INTERVAL =
  14 * 60 * 1000;


  private refreshTimer?: ReturnType<typeof setInterval>;

  private refreshRequest$?: Observable<AuthResponse>;


  constructor(
    private http: HttpClient,
  ) {

    /*
     * If the browser is refreshed and tokens already
     * exist in localStorage, restart automatic refresh.
     */
    if (
      this.getAccessToken() &&
      this.getRefreshToken()
    ) {

      this.startTokenRefreshTimer();

    }

  }


  /* =====================================================
     SIGNUP
  ===================================================== */

  signup(
    fullName: string,
    email: string,
    password: string,
  ): Observable<AuthResponse> {

    const body: SignupRequest = {

      full_name:
        fullName.trim(),

      email:
        email.trim(),

      password,

    };


    return this.http
      .post<AuthResponse>(
        `${this.apiUrl}/signup`,
        body,
      )
      .pipe(

        tap((response) => {

          this.handleSuccessfulAuthentication(
            response,
          );

        }),

      );

  }


  /* =====================================================
     LOGIN
  ===================================================== */

  login(
    email: string,
    password: string,
  ): Observable<AuthResponse> {

    const body: LoginRequest = {

      email:
        email.trim(),

      password,

    };


    return this.http
      .post<AuthResponse>(
        `${this.apiUrl}/demo-login`,
        body,
      )
      .pipe(

        tap((response) => {

          this.handleSuccessfulAuthentication(
            response,
          );

        }),

      );

  }


  /* =====================================================
     REFRESH TOKENS
  ===================================================== */

  refreshAccessToken(): Observable<AuthResponse> {

    /*
     * If several protected API calls fail at the same time,
     * only make one refresh request.
     */
    if (this.refreshRequest$) {

      return this.refreshRequest$;

    }


    const refreshToken =
      this.getRefreshToken();


    if (!refreshToken) {

      throw new Error(
        'No refresh token available.',
      );

    }


    this.refreshRequest$ =
      this.http
        .post<AuthResponse>(
          `${this.apiUrl}/refresh`,
          {

            refresh_token:
              refreshToken,

          },
        )
        .pipe(

          tap((response) => {

            /*
             * Your refresh API returns BOTH:
             *
             * access_token
             * refresh_token
             *
             * So replace BOTH stored tokens.
             */
            this.saveTokens(

              response.user.access_token,

              response.user.refresh_token,

            );


            this.saveUserDetails(

              response.user.email,

              response.user.full_name,

            );

          }),


          finalize(() => {

            this.refreshRequest$ =
              undefined;

          }),


          shareReplay(1),

        );


    return this.refreshRequest$;

  }


  /* =====================================================
     AUTOMATIC TOKEN REFRESH
  ===================================================== */

  startTokenRefreshTimer(): void {

    /*
     * Prevent multiple timers from running.
     */
    this.stopTokenRefreshTimer();


    /*
     * Only start the timer if a refresh token exists.
     */
    if (!this.getRefreshToken()) {

      return;

    }


    this.refreshTimer =
      setInterval(() => {

        const refreshToken =
          this.getRefreshToken();


        if (!refreshToken) {

          this.stopTokenRefreshTimer();

          return;

        }


        this.refreshAccessToken()
          .subscribe({

            next: () => {

              console.log(
                'PulseOS authentication refreshed.',
              );

            },


            error: (error) => {

              console.error(
                'Token refresh failed:',
                error,
              );


              /*
               * If refresh token is expired/invalid,
               * clear authentication.
               */
              this.logout();

            },

          });


      }, this.TOKEN_REFRESH_INTERVAL);

  }


  /* =====================================================
     STOP AUTOMATIC REFRESH
  ===================================================== */

  private stopTokenRefreshTimer(): void {

    if (this.refreshTimer) {

      clearInterval(
        this.refreshTimer,
      );

      this.refreshTimer =
        undefined;

    }

  }


  /* =====================================================
     SUCCESSFUL LOGIN / SIGNUP
  ===================================================== */

  private handleSuccessfulAuthentication(
    response: AuthResponse,
  ): void {

    this.saveTokens(

      response.user.access_token,

      response.user.refresh_token,

    );


    this.saveUserDetails(

      response.user.email,

      response.user.full_name,

    );


    /*
     * Start automatic token renewal after
     * successful login/signup.
     */
    this.startTokenRefreshTimer();

  }


  /* =====================================================
     SAVE TOKENS
  ===================================================== */

  private saveTokens(
    accessToken: string,
    refreshToken: string,
  ): void {

    localStorage.setItem(
      this.ACCESS_TOKEN_KEY,
      accessToken,
    );


    localStorage.setItem(
      this.REFRESH_TOKEN_KEY,
      refreshToken,
    );

  }


  /* =====================================================
     GET ACCESS TOKEN
  ===================================================== */

  getAccessToken(): string | null {

    return localStorage.getItem(
      this.ACCESS_TOKEN_KEY,
    );

  }


  /* =====================================================
     GET REFRESH TOKEN
  ===================================================== */

  getRefreshToken(): string | null {

    return localStorage.getItem(
      this.REFRESH_TOKEN_KEY,
    );

  }


  /* =====================================================
     SAVE USER DETAILS
  ===================================================== */

  private saveUserDetails(
    email: string,
    fullName: string,
  ): void {

    localStorage.setItem(
      this.USER_EMAIL_KEY,
      email,
    );


    localStorage.setItem(
      this.USER_FULL_NAME_KEY,
      fullName,
    );

  }


  getUserEmail(): string | null {

    return localStorage.getItem(
      this.USER_EMAIL_KEY,
    );

  }


  getUserFullName(): string | null {

    return localStorage.getItem(
      this.USER_FULL_NAME_KEY,
    );

  }


  /* =====================================================
     LOGIN STATUS
  ===================================================== */

  isLoggedIn(): boolean {

    return !!(
      this.getAccessToken() &&
      this.getRefreshToken()
    );

  }


  /* =====================================================
     LOGOUT
  ===================================================== */

  logout(): void {

    /*
     * Stop token renewal first.
     */
    this.stopTokenRefreshTimer();


    localStorage.removeItem(
      this.ACCESS_TOKEN_KEY,
    );


    localStorage.removeItem(
      this.REFRESH_TOKEN_KEY,
    );


    localStorage.removeItem(
      this.USER_EMAIL_KEY,
    );


    localStorage.removeItem(
      this.USER_FULL_NAME_KEY,
    );

  }

}