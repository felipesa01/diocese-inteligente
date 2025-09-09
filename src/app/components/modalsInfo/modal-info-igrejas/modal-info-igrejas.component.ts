// import { Component } from '@angular/core';
import { Component, Inject, OnDestroy } from '@angular/core';
import VectorLayer from 'ol/layer/Vector';
import { Vector } from 'ol/source';
import VectorSource from 'ol/source/Vector';
import { objGeneralToSpecific } from 'src/app/services/apis-conection.service';
import { GeoService } from 'src/app/services/geo.service';
import { LayersManagementService } from 'src/app/services/layers-management.service';

@Component({
  selector: 'app-modal-info-igrejas',
  templateUrl: './modal-info-igrejas.component.html',
  styleUrl: './modal-info-igrejas.component.css'
})
export class ModalInfoIgrejasComponent implements OnDestroy {

  dataFromGeneral: objGeneralToSpecific;
  formatedKeys: {};
  typeMode: objGeneralToSpecific['typeMode'];
  isZeroInfo: boolean;

  keysInfo: string[];

  // quadrasLayers: VectorLayer<VectorSource> = new VectorLayer();
  // temQuadras: boolean = false;


  constructor(private geoservice: GeoService, private layersService: LayersManagementService) { }
  ngOnDestroy(): void {
    // this.quadrasLayers = new VectorLayer();
    // this.geoservice.map.removeLayer(this.quadrasLayers)
  }

  setDataFromGeneral(e: objGeneralToSpecific) {
    console.log(e.dataOrForm)
    this.dataFromGeneral = e;
    this.typeMode = e.typeMode;
    this.formatedKeys = e.formatedKeys;

    // this.getQuadras()
  };


  // getQuadras() {
  //   this.quadrasLayers = new VectorLayer();
  //   this.geoservice.map.addLayer(this.quadrasLayers)

  //   let features = this.layersService.quadrasLayer.getSource().getFeatures().filter(e => e.get('Responsabi') == this.dataFromGeneral.dataOrForm['Nome'])

  //   if (features.length > 0) {
  //     this.temQuadras = true;
  //     this.quadrasLayers.setSource(new VectorSource({
  //       features: features,
  //     }));

  //   }
  // }
}

