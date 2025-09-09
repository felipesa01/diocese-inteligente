import { HttpErrorResponse, HttpHandler, HttpInterceptor, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { Injectable, isDevMode } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, delay, throwError } from 'rxjs';
import { GeoService } from '../services/geo.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  system: number

  constructor(private auth: AuthService, private geoService: GeoService) {
    this.geoService.setApplication.subscribe(e => {
      this.system = e.systemIDGSU
    })
  }

  requestsToSkip = ['GetLegendGraphic'];

  erroHandle = (error: HttpErrorResponse) => {
    let errorMessage = '';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.error(errorMessage); // Log the error for debugging
    // You can implement various actions based on the error status or type
    if (error.status === 401) {
      window.location.href = this.auth.intranetURL + 'SIGEM/login';
    } else if (error.status === 404) {
      // Handle not found errors
    }
    return throwError(() => new Error(errorMessage)); // Re-throw the error
  }

  intercept(req: HttpRequest<any>, next: HttpHandler) {

    var skip = this.requestsToSkip.filter(e => req.url.includes(`request=${e}`))

    if (req.url.indexOf('SisGeo-API/') != -1 && skip.length == 0) {
      // Clone the request and replace the original headers with
      // cloned headers, updated with the authorization.
      const authReq = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${this.auth.tokenGSU}`)
      });

      // send cloned request with header to the next handler.
      return next.handle(authReq).pipe(
        catchError(this.erroHandle)
      );
    }
    else if (req.url.indexOf('apiSisGsu/api/permissao/') != -1) {
      const authReq = req.clone({
        url: req.url + `/${this.system}`
      });
      return next.handle(authReq).pipe(
        catchError(this.erroHandle)
      );;
    }
    else {
      return next.handle(req).pipe(
        catchError(this.erroHandle)
      );
    }

  }
}