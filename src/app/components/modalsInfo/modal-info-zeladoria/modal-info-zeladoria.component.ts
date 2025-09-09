import { Component } from '@angular/core';
import { objGeneralToSpecific } from 'src/app/services/apis-conection.service';

@Component({
  selector: 'app-modal-info-zeladoria',
  standalone: false,
  templateUrl: './modal-info-zeladoria.component.html',
  styleUrl: './modal-info-zeladoria.component.css'
})
export class ModalInfoZeladoriaComponent {
  
 url: string;
  mode: string;

  setDataFromGeneral(e: objGeneralToSpecific) {
    this.mode = e.typeMode
    this.url = "https://intranet.santanadeparnaiba.sp.gov.br/SisGov-ADM/ordem-servico-solicitante/imprimir-ordem-servico?idOrdemServico=" + e.dataOrForm['id_ordemservico'];
  }

  openPDF() {
    window.open(this.url, "_blank");
  }

}
