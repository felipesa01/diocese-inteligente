import { Component } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { GeoService, appConfig } from 'src/app/services/geo.service';

@Component({
  selector: 'app-bc-main-container',
  templateUrl: './bc-main-container.component.html',
  styleUrl: './bc-main-container.component.css'
})
export class BcMainContainerComponent {

  constructor(private geoService: GeoService, private authService: AuthService) {

    // var appConfig: appConfig = {
    //   mapId: 'bc',
    //   systemIDGSU: 200,
    //   systemName: 'Base Cartográfica',
    //   haveSidebar: true,
    //   haveTileLayer: true,
    //   initOpenSidebar: true,
    //   multipleISFEModal: true,
    //   streetView: true,
    //   search:
    //     [ 8,
    //       19,
    //       // 172
    //     ],
    //   toolbox: ['cursor', 'swipe', 'measuretool', 'go-to-coords'],
    //   mainLayer: undefined,
    //   layersLegend: [],
    //   LayersOpened: []
    // }

    var appConfig = this.geoService.applicationsList.filter(e => e.mapId == 'bc')[0]

    this.resetTelasGSU()
    this.geoService.setApplication.next(appConfig);
    this.geoService.getMainLayers(appConfig.LayersOpened);
  }

  resetTelasGSU() {
    this.authService.telasGSU = []
  }

}
