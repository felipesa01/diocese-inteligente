import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { GeoService } from 'src/app/services/geo.service';

interface Card {
  icon: string;
  title: string;
  description: string;
  color?: string;
}

@Component({
  selector: 'app-modal-select-application',
  standalone: false,
  templateUrl: './modal-select-application.component.html',
  styleUrl: './modal-select-application.component.css'
})

export class ModalSelectApplicationComponent {
  cards: Card[] = [
    {
      icon: 'rocket',
      title: 'Desenvolvimento Rápido',
      description: 'Soluções ágeis e eficientes para impulsionar seu negócio.',
      color: '#FF5722'
    },
    {
      icon: 'devices',
      title: 'Design Responsivo',
      description: 'Interfaces que se adaptam a qualquer dispositivo.',
      color: '#2196F3'
    },
    // {
    //   icon: 'analytics',
    //   title: 'Análise de Dados',
    //   description: 'Transformamos dados em insights valiosos.',
    //   color: '#4CAF50'
    // },
    // {
    //   icon: 'security',
    //   title: 'Segurança',
    //   description: 'Proteção avançada para seus dados.',
    //   color: '#9C27B0'
    // }
  ];

  constructor(public dialogRef: MatDialogRef<ModalSelectApplicationComponent>, private geoService: GeoService) {


  } 

  close(): void {
    this.dialogRef.close();
  }
}
