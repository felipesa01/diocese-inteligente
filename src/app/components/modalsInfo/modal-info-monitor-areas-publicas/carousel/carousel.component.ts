import { ContentObserver } from '@angular/cdk/observers';
import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NgbCarousel } from '@ng-bootstrap/ng-bootstrap';
import { it } from 'node:test';
import { mainAPIFileItem } from 'src/app/services/apis-conection.service';

@Component({
  selector: 'app-carousel',
  templateUrl: './carousel.component.html',
  styleUrl: './carousel.component.css'
})
export class CarouselComponent implements OnInit {

  @ViewChild('carousel', { static: true }) carousel: NgbCarousel;

  objUrls: { id?: number, url?: string } = {}

  get activated() {
    return `slideId-${this.carouselObject.idxOpened}`
  }

  showNavigationArrows: boolean = true;

  constructor(@Inject(MAT_DIALOG_DATA) public carouselObject: { data: mainAPIFileItem[], idxOpened: string }) { }

  ngOnInit(): void {
    this.carouselObject.data.forEach(e => {
      this.objUrls[e.ID_Arquivo] = this.getBlobURL(e.ID_Arquivo)
    })

    if (this.carouselObject.data.length == 1) {
      this.showNavigationArrows = false;
    }
    this.carousel.pause();
  }
 
  getBlobURL(id: number) {
    var item = this.carouselObject.data.filter(e => e.ID_Arquivo == id)[0]
    var contentType = item.SG_ArquivoExtensao == 'png' || item.SG_ArquivoExtensao == 'jpeg' ? `image/${item.SG_ArquivoExtensao}` : '';
    return this.base64ToBlob(item.BIN_Arquivo, contentType)
  }

  base64ToBlob(base64String: string, contentType: string = '') {
    const byteCharacters = atob(base64String);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);

    var image = new Blob([byteArray], { type: contentType })
    const urlCreator = window.URL || (window as any).webkitURL;
    const imageUrl = urlCreator.createObjectURL(image);
    return imageUrl;
  }

}
