import { Component } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { appConfig, GeoService } from 'src/app/services/geo.service';

@Component({
  selector: 'app-zela-main',
  standalone: false,
  templateUrl: './zela-main.component.html',
  styleUrl: './zela-main.component.css'
})
export class ZelaMainComponent {

  constructor(private geoService: GeoService, private authService: AuthService) {
  
      // var appConfig: appConfig = {
      //   mapId: 'zela',
      //   systemIDGSU: 200,
      //   systemName: 'Zeladoria',
      //   haveSidebar: false,
      //   haveTileLayer: false,
      //   initOpenSidebar: false,
      //   multipleISFEModal: false,
      //   streetView: false,
      //   search: [170],
      //   toolbox: ['cursor', 'filter', 'timeline'],
      //   mainLayer: 170,
      //   layersLegend: [170],
      //   LayersOpened: [170]
      // }

      var appConfig = this.geoService.applicationsList.filter(e => e.mapId == 'zela')[0]
  
      this.resetTelasGSU()
      this.geoService.setApplication.next(appConfig);
      this.geoService.getMainLayers(appConfig.LayersOpened);
    }
  
    resetTelasGSU() {
      this.authService.telasGSU = []
    }

}
