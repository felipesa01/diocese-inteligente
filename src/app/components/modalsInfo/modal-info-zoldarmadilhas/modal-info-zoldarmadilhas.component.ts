import { AfterViewChecked, AfterViewInit, Component, ElementRef, Renderer2, ViewChild } from '@angular/core';
import { consumerBeforeComputation } from '@angular/core/primitives/signals';
import { Chart, ChartConfiguration, ChartOptions } from 'chart.js';

import { objGeneralToSpecific } from 'src/app/services/apis-conection.service';

@Component({
  selector: 'app-modal-info-zoldarmadilhas',
  standalone: false,
  templateUrl: './modal-info-zoldarmadilhas.component.html',
  styleUrl: './modal-info-zoldarmadilhas.component.css'
})
export class ModalInfoZoldarmadilhasComponent implements AfterViewInit {


  dataFromGeneral: objGeneralToSpecific;
  dataReady: boolean = false;

  setDataFromGeneral(e: objGeneralToSpecific) {
    this.dataFromGeneral = e;

    this.createLineChart();

    this.formatWindow();
    // this.dataReady = true;
  }

  formatDataset(): { labels: ChartConfiguration<'line'>['data']['labels'], dataset: ChartConfiguration<'line'>['data']['datasets'] } {
    var dataset: ChartConfiguration<'line'>['data']['datasets'] = []
    var labels: ChartConfiguration<'line'>['data']['labels'] = []

    if (this.dataFromGeneral) {
      var dataFull = JSON.parse(this.dataFromGeneral.dataFull['dados']['valor']) as Array<any>;

      labels = dataFull.map(e => e['data']);

      dataset.push({
        type: 'line',
        data: dataFull.map(e => e['aedes']),
        label: 'Aedes',
        fill: false,
        borderWidth: 1.2,
        tension: 0.7,
        borderColor: '#ca0020',
        backgroundColor: 'transparent',
        pointBorderColor: '#ca0020',
        pointBackgroundColor: '#ca0020',
        pointRadius: 2
      });

      dataset.push({
        type: 'line',
        data: dataFull.map(e => e['culex']),
        label: 'Culex',
        fill: false,
        borderWidth: 1.2,
        tension: 0.7,
        borderColor: '#f4a582',
        backgroundColor: 'transparent',
        pointBorderColor: '#f4a582',
        pointBackgroundColor: '#f4a582',
        pointRadius: 2
      })

      dataset.push({
        type: 'line',
        data: dataFull.map(e => e['outros']),
        label: 'Outros',
        borderWidth: 1.2,
        fill: false,
        tension: 0.5,
        borderColor: '#0571b0',
        backgroundColor: 'transparent',
        pointBorderColor: '#0571b0',
        pointBackgroundColor: '#0571b0',
        pointRadius: 2
      })

      dataset.push({
        type: 'line',
        data: dataFull.map(e => e['total']),
        label: 'Total',
        borderWidth: 2,
        fill: true,
        tension: 1,
        borderColor: 'black',
        backgroundColor: 'transparent',
        pointBorderColor: 'black',
        pointBackgroundColor: 'black',
        pointRadius: 2
      })

      return { labels: labels, dataset: dataset }
    }

  }

  title = 'ng2-charts-demo';

  constructor(private renderer2: Renderer2) {
  }

  ngAfterViewInit(): void {

  }

  ngOnInit() {
  }




  @ViewChild('myLineChart') myLineChart!: ElementRef;
  public chart: any;

  // ngAfterViewInit(): void {
  //   this.createLineChart();
  // }

  createLineChart(): void {
    const ctx = this.myLineChart.nativeElement.getContext('2d');
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.formatDataset().labels,
        datasets: this.formatDataset().dataset
      },
      options: {
        // Add any specific options for your line chart here
        scales: {
          x: { // or xAxes for older Chart.js versions
            type: 'time',
            time: {
              unit: 'month',
              parser: 'YYYY-MM-DDTHH:mm:ss',
              displayFormats: {
                'day': 'DD/MM/YYYY'
              },
              // ... other options
            }
          }
        },
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: this.dataFromGeneral.dataFull['referencia']['valor'] // Your chart title here
          }
        }
      }
    });

  }


  formatWindow() {
    // const parentNode: Node | null = this.myLineChart.nativeElement
    // console.log(parentNode);

    setTimeout(() => {

      const elements = document.getElementsByClassName('box-width-limit');

      for (let i = 0; i < elements.length; i++) {
        var elementRoot = elements[i]
        var element = elementRoot.children[0].children[0].children[0];
        if (element == this.myLineChart.nativeElement) {
          // console.log('Aplicando');
          this.renderer2.setStyle(elementRoot, "width", '650px');
          break
        }
      }
    }, 50);



  }
}

