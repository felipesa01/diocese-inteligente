import { Component } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { GeoService } from 'src/app/services/geo.service';

@Component({
  selector: 'app-cult-main',
  standalone: false,
  templateUrl: './cult-main.component.html',
  styleUrl: './cult-main.component.css'
})
export class CultMainComponent {

    constructor(private geoService: GeoService, private authService: AuthService) {
    
      var appConfig = this.geoService.applicationsList.filter(e => e.mapId == 'cult')[0]
  
      this.resetTelasGSU()
      this.geoService.setApplication.next(appConfig);
      this.geoService.getMainLayers(appConfig.LayersOpened);
    }
  
    resetTelasGSU() {
      this.authService.telasGSU = []
    }

}
