import { Injectable } from '@angular/core';
import { jsPDF } from "jspdf";

@Injectable({
  providedIn: 'root'
})
export class PdfMakerService {

  constructor() { }

  makeTestPDF() {
    console.log('Gerando PDF')
    
    const doc = new jsPDF();

    doc.text("Hello world!", 10, 10);
    doc.autoPrint();
    // doc.save("a4.pdf");
    window.open(doc.output('bloburl'), '_blank',"toolbar=no,status=no,menubar=no,scrollbars=no,resizable=no,modal=yes,top=100,left=350,width=1000,height=800");

  }


}
