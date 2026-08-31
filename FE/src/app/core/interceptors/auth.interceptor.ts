import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpRequest,
} from '@angular/common/http';

import {
  inject,
} from '@angular/core';

import {
  Router,
} from '@angular/router';

import {
  catchError,
  Observable,
  switchMap,
  throwError,
} from 'rxjs';

import {
  AuthService,
} from '../services/auth.service';


export function authInterceptor(
  request: HttpRequest<unknown>,
  next: HttpHandlerFn,
): Observable<HttpEvent<unknown>> {

  const authService =
    inject(AuthService);


  const router =
    inject(Router);


  /* =====================================================
     AUTH ENDPOINTS
  ===================================================== */

  const isSignupRequest =
    request.url.includes(
      '/auth/signup',
    );


  const isLoginRequest =
    request.url.includes(
      '/auth/demo-login',
    );


  const isRefreshRequest =
    request.url.includes(
      '/auth/refresh',
    );


  /*
   * Do not attach an old access token
   * to authentication endpoints.
   */
  if (
    isSignupRequest ||
    isLoginRequest ||
    isRefreshRequest
  ) {

    return next(request);

  }


  /* =====================================================
     ACCESS TOKEN
  ===================================================== */

  const accessToken =
    authService.getAccessToken();


  let authenticatedRequest =
    request;


  if (accessToken) {

    authenticatedRequest =
      request.clone({

        setHeaders: {

          Authorization:
            `Bearer ${accessToken}`,

        },

      });

  }


  /* =====================================================
     SEND REQUEST
  ===================================================== */

  return next(
    authenticatedRequest,
  )
    .pipe(

      catchError(
        (
          error: HttpErrorResponse,
        ) => {


          /* =============================================
             NON-401 ERROR
          ============================================= */

          if (error.status !== 401) {

            return throwError(
              () => error,
            );

          }


          /* =============================================
             CHECK REFRESH TOKEN
          ============================================= */

          const refreshToken =
            authService.getRefreshToken();


          if (!refreshToken) {

            authService.logout();

            router.navigate([
              '/login',
            ]);


            return throwError(
              () => error,
            );

          }


          /* =============================================
             REFRESH ACCESS TOKEN
          ============================================= */

          return authService
            .refreshAccessToken()
            .pipe(

              switchMap(
                (response) => {

                  const newAccessToken =
                    response.user.access_token;


                  /* =====================================
                     RETRY ORIGINAL REQUEST
                  ===================================== */

                  const retryRequest =
                    request.clone({

                      setHeaders: {

                        Authorization:
                          `Bearer ${newAccessToken}`,

                      },

                    });


                  return next(
                    retryRequest,
                  );

                },
              ),


              /* =========================================
                 REFRESH TOKEN EXPIRED / INVALID
              ========================================= */

              catchError(
                (refreshError) => {

                  authService.logout();


                  router.navigate([
                    '/login',
                  ]);


                  return throwError(
                    () => refreshError,
                  );

                },
              ),

            );

        },
      ),

    );

}