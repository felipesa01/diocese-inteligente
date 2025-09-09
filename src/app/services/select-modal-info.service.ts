import { Injectable, Type } from '@angular/core';
import { ModalGeneralInfoComponent } from '../components/modalsInfo/modal-general-info/modal-general-info.component';
import { ModalInfoImgDroneComponent } from '../components/modalsInfo/modal-info-img-drone/modal-info-img-drone.component';
import { ModalInfoImoveisComponent } from '../components/modalsInfo/modal-info-imoveis/modal-info-imoveis.component';
import { ModalInfoSuaSmmapAutorizacoesComponent } from '../components/modalsInfo/modal-info-sua-smmap-autorizacoes/modal-info-sua-smmap-autorizacoes.component';
import { ModalInfoFotoDroneComponent } from '../components/modalsInfo/modal-info-foto-drone/modal-info-foto-drone.component';
import { ModalInfoMonitorAreasPublicasComponent } from '../components/modalsInfo/modal-info-monitor-areas-publicas/modal-info-monitor-areas-publicas.component';
import { ModalInfoZeladoriaComponent } from '../components/modalsInfo/modal-info-zeladoria/modal-info-zeladoria.component';
import { ModalInfoZoldarmadilhasComponent } from '../components/modalsInfo/modal-info-zoldarmadilhas/modal-info-zoldarmadilhas.component';
import { ModalInfoIgrejasComponent } from '../components/modalsInfo/modal-info-igrejas/modal-info-igrejas.component';
// import { ModalInfoImoveisComponent } from '../components/modalsinfo/modal-info-imoveis/modal-info-imoveis.component';

@Injectable({
  providedIn: 'root'
})
export class SelectModalInfoService {


  constructor() { }

  modalInfoList: { component: any, layerOfUse: number[] }[] = [
    {
      component: ModalGeneralInfoComponent,
      layerOfUse: []
    },
    {
      component: ModalInfoIgrejasComponent,
      layerOfUse: [2]
    }

  ];


  getComponent(layerId: number) {
    const modal = this.modalInfoList.filter((e) => e.layerOfUse.includes(layerId));

    if (modal.length === 0) return ModalGeneralInfoComponent as Type<any>;
    else return modal[0].component as Type<any>;
  }
}
