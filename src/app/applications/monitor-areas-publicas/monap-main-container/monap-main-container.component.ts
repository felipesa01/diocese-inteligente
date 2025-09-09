import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { appConfig, GeoService } from 'src/app/services/geo.service';

@Component({
  selector: 'app-monap-main-container',
  templateUrl: './monap-main-container.component.html',
  styleUrl: './monap-main-container.component.css'
})
export class MonapMainContainerComponent {

  constructor(private geoService: GeoService, private authService: AuthService) {

    var appConfig = this.geoService.applicationsList.filter(e => e.mapId == 'monap')[0]

    this.resetTelasGSU()
    this.geoService.setApplication.next(appConfig);
    this.geoService.getMainLayers(appConfig.LayersOpened.slice().reverse());
  }

  resetTelasGSU() {
    this.authService.telasGSU = []
  }

}
