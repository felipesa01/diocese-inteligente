import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Injectable, isDevMode } from '@angular/core';
import { Observable, catchError, lastValueFrom, map, mergeMap, of, switchMap, throwError } from 'rxjs';
import { CookieService } from 'ngx-cookie-service';
import { mainAPIObject, telaGSU, telasGSUResponse } from './apis-conection.service';
import { ToastrService } from 'ngx-toastr';
import { appConfig } from './geo.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  userId: string;
  tokenGSU: string;
  public permanentAuthToken = 'fDdYi9-m7I9BlXt9IMImxq7wQApmBo9nm3OJvSpmYckfV8a-nwXEDwuEDzY-SXlhdPESA1UJ-ddkRtFn2-7X92H4Qq_DcsFG1Nzu5yIyk-9GqJMoNkbpIE7nReRerZPcCZLxuubgeETqv-HFYu-P4O-4UVS-Xwpx5geHg40q3rndqZzFyGVNHPQya1uPMpi8ekwXxgy3mbb0enAkYewLTqhjgk8'
  public intranetURL = environment.apiBaseUrl
  gsuURL = isDevMode() ? '/apiSisGsu/api/' : this.intranetURL + 'apiSisGsu/api/';
  loggedURL = isDevMode() ? '/sisgeo-adm/logged-in/' : this.intranetURL + 'sisgeo-adm/logged-in'

  turnApplication: appConfig

  private handleError(error: HttpErrorResponse) {
    this.toastr.error(`Teste`, undefined, { progressBar: true, timeOut: 2500 });
    // console.log(error);
    if (error.status === 0) {
      // A client-side or network error occurred. Handle it accordingly.
      // console.error('An error occurred:', error.error);
      this.toastr.error(`A client-side or network error occurred`, undefined, { progressBar: true, timeOut: 2500 });
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong.
      // console.error(
      //   `Backend returned code ${error.status}, body was: `, error.error);
      this.toastr.error(`Backend returned code ${error.status}, body was: `, undefined, { progressBar: true, timeOut: 2500 });
    }
    // Return an observable with a user-facing error message.
    return throwError(() => new Error('Something bad happened; please try again later.'));
  }

  constructor(private http: HttpClient, private cookieService: CookieService, private toastr: ToastrService) {
    this.getUserId();
    this.getTokenGSU();
  }

  getUserId() {
    this.userId = isDevMode() ? '18792' : this.cookieService.get('OUID');
    // this.userId = isDevMode() ? '18792' : '18792';

  }

  getTokenGSU() {
    this.tokenGSU = isDevMode() ? this.permanentAuthToken : this.cookieService.get('OUTK');
    // this.tokenGSU = isDevMode() ? this.permanentAuthToken :this.permanentAuthToken;

  }

  public getUserGSU() {
    return this.http.get<mainAPIObject>(this.gsuURL + 'usuario/' + this.userId, { headers: new HttpHeaders({ 'Authorization': `Bearer ${this.tokenGSU}`, }) }).pipe(
      switchMap((value, index) => {
        return of<boolean>(value.Data.Rows[0]);
      }),
      catchError(() => {
        this.handleError
        return of(false)
      })
    )
  }

  isSignedInGSU(): Observable<boolean> {
    return this.http.get<mainAPIObject>(this.gsuURL + 'usuario/' + this.userId, { headers: new HttpHeaders({ 'Authorization': `Bearer ${this.tokenGSU}`, }) }).pipe(
      switchMap((value, index) => {
        return of<boolean>(value.Success);
      }),
      catchError(() => {
        this.handleError
        return of(false)
      })
    )
  }

  isSignedInSIGEM(): Observable<boolean> {
    return this.http.post<{ loggedIn: boolean }>(this.loggedURL, undefined).pipe(
      switchMap((data, index) => {
        return of<boolean>(data.loggedIn)
      }),
      catchError(() => {
        this.handleError
        return of(false)
      })
    )
  }

  public isSignedIn() {
    var GSU;
    var SIGEM;

    return this.isSignedInGSU().pipe(
      map(gsuResult => {
        GSU = gsuResult;
        return gsuResult;
      }),
      mergeMap(gsuResult => {
        return this.isSignedInSIGEM().pipe(
          map(sigemResult => {
            SIGEM = gsuResult;
            return (typeof gsuResult == 'boolean' && typeof sigemResult == 'boolean' && gsuResult && sigemResult);
          })
        )
      })
    )
  }


  getUserInfo(): Observable<any[]> {
    console.log('userId', this.userId)
    return this.http.get<mainAPIObject>(this.gsuURL + 'usuario/' + this.userId, { headers: new HttpHeaders({ 'Authorization': `Bearer ${this.tokenGSU}` }) }).pipe(
      map(data => {
        if (data.Success) {
          return data.Data.Rows;
        }
        else {
          return [];
        }
      })
    )
  }

  // Apartir daqui GSU
  public telasGSU: telaGSU[] = [];
  getTelasGSU(): Observable<telaGSU[]> {
    // var telas = sessionStorage.getItem('telasGSU')
    var telas = this.telasGSU

    if (telas.length > 0) {
      // return of(JSON.parse(telas) as telaGSU[])
      return of(telas)
    }

    else {
      return this.http.get<telasGSUResponse>(this.gsuURL + 'permissao/' + this.userId, { headers: new HttpHeaders({ 'Authorization': `Bearer ${this.tokenGSU}` }) }).pipe(
        map(data => {
          if (data.Success) {
            // sessionStorage.setItem('telasGSU', JSON.stringify(data.Data.Rows))
            this.telasGSU = data.Data.Rows
            return data.Data.Rows
          }
          else {
            return [];
          }
        })
      )
    }
  }

  async canAccessSubSystem(subsystem: string) {
    if (!subsystem) return true;
    var telasGSU = await lastValueFrom(this.getTelasGSU());
    var tela = telasGSU.filter(tela => subsystem == tela.DS_Tela && tela.IC_Listar == 'S')[0];
    if (tela) {
      return true
    }
    else {
      return false;
    }
  }
}
