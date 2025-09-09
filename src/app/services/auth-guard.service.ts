import { Injectable, isDevMode, OnDestroy } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, GuardResult, MaybeAsync, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';
import { last, lastValueFrom, Subscription } from 'rxjs';
import { appConfig, GeoService } from './geo.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate, OnDestroy {

  setApplicationSub: Subscription;
  turnApplication: appConfig;

  constructor(private authService: AuthService, private router: Router, private geoservice: GeoService) {

    this.setApplicationSub = this.geoservice.setApplication.subscribe(e => {
      // console.log('e', e)
      this.turnApplication = e;
    });
  }


  ngOnDestroy(): void {
    this.setApplicationSub.unsubscribe()
  }

  async getLoginResult(): Promise<boolean> {
    var login = false;
    var result = await lastValueFrom(this.authService.isSignedIn());
    if (typeof result == 'boolean' && result) {
      login = true;
    }
    else {
      login = false;
      window.location.href = this.authService.intranetURL + 'SIGEM/login';
    }
    // console.log(login);
    return login
  }

  async analisePorTela() {
    console.log('Entou em analisePorTela()')
    console.log('telaGSUSubsystem', this.turnApplication.telaGSUSubsystem)
    if (this.turnApplication.telaGSUSubsystem) {
      var telasGSU = await lastValueFrom(this.authService.getTelasGSU());
      console.log('telasGSU', telasGSU);
      var tela = telasGSU.filter(tela => this.turnApplication.telaGSUSubsystem.includes(tela.DS_Tela) && tela.IC_Listar == 'S')[0];
      console.log('tela', tela);
      if (tela) {
        return true
      }
      else {
        return false;
      }
    }
    else {
      return true
    }
  }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): MaybeAsync<GuardResult> {
    if (isDevMode()) {
      return true;
    }
    else {
      return this.getLoginResult();
    }
  }
}