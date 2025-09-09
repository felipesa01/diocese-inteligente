import { Component } from '@angular/core';
import { GeoService } from './services/geo.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
 title= 'pmsp-webgeo';

  constructor(private geoService: GeoService) {

    // this.geoService.getMainLayers();
    
  }


}
