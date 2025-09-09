import { Component } from '@angular/core';
import { attributesFromPg, dataToDialogInfoSearch, objGeneralToSpecific } from 'src/app/services/apis-conection.service';

@Component({
  selector: 'app-modal-info-sua-smmap-autorizacoes',
  templateUrl: './modal-info-sua-smmap-autorizacoes.component.html',
  styleUrls: ['./modal-info-sua-smmap-autorizacoes.component.css']
})
export class ModalInfoSuaSmmapAutorizacoesComponent {

  url: string;
  mode: string;

  setDataFromGeneral(e: objGeneralToSpecific) {
    this.mode = e.typeMode
    this.url = "https://producao.aprova.com.br/consulta/process/view/santanadeparnaibasp/" + e.dataOrForm['n_processo'] + "/" + e.dataOrForm['cod_verif'];
  }

  sendToAprova() { 
    window.open(this.url, "_blank");
  }

}
