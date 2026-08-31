import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  Observable,
  finalize,
  shareReplay,
  tap,
} from 'rxjs';

import { environment } from '../../../environments/environment';


export interface SignupRequest {
  full_name: string;
  email: string;
  password: string;
}


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

  private refreshRequest$?: Observable<AuthResponse>;


  constructor(
    private http: HttpClient,
  ) {}


  /* =====================================================
     SIGNUP
  ===================================================== */

  signup(
    fullName: string,
    email: string,
    password: string,
  ): Observable<AuthResponse> {

    const body: SignupRequest = {
      full_name: fullName.trim(),
      email: email.trim(),
      password,
    };

    return this.http
      .post<AuthResponse>(
        `${this.apiUrl}/signup`,
        body,
      )
      .pipe(
        tap((response) => {

          this.saveTokens(
            response.user.access_token,
            response.user.refresh_token,
          );

          this.saveUserDetails(
            response.user.email,
            response.user.full_name,
          );

        }),
      );
  }


  /* =====================================================
     REFRESH ACCESS TOKEN
  ===================================================== */

  refreshAccessToken(): Observable<AuthResponse> {

    /*
     * If multiple requests receive 401 at the same time,
     * reuse the refresh request that is already running.
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
            refresh_token: refreshToken,
          },
        )
        .pipe(

          tap((response) => {

            /*
             * Your refresh API returns BOTH tokens.
             * Therefore we replace both stored values.
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
            this.refreshRequest$ = undefined;
          }),

          shareReplay(1),
        );

    return this.refreshRequest$;
  }


  /* =====================================================
     SAVE TOKENS
  ===================================================== */

  saveTokens(
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
     USER DETAILS
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

    return !!this.getAccessToken();
  }


  /* =====================================================
     LOGOUT
  ===================================================== */

  logout(): void {

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