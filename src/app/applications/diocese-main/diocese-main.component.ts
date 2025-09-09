import { Component } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { GeoService } from 'src/app/services/geo.service';

@Component({
  selector: 'app-diocese-main',
  standalone: false,
  templateUrl: './diocese-main.component.html',
  styleUrl: './diocese-main.component.css'
})
export class DioceseMainComponent {

  constructor(private geoService: GeoService, private authService: AuthService) {

    var appConfig = this.geoService.applicationsList.filter(e => e.mapId == 'diocese-main')[0]

    this.resetTelasGSU()
    this.geoService.setApplication.next(appConfig);
    // this.geoService.getMainLayers(appConfig.LayersOpened);
  }

  resetTelasGSU() {
    this.authService.telasGSU = []
  }

}
