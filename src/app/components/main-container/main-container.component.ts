import { AfterContentChecked, AfterViewInit, ChangeDetectorRef, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild } from '@angular/core';
import { ResizeEvent } from 'angular-resizable-element';
import { Coordinate, format } from 'ol/coordinate';
import { appConfig, GeoService } from 'src/app/services/geo.service';
import { toStringHDMS } from 'ol/coordinate';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ModalSelectApplicationComponent } from '../modal-select-application/modal-select-application.component';
import { interval, Subscription, take } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-main-container',
  templateUrl: './main-container.component.html',
  styleUrls: ['./main-container.component.css']
})
export class MainContainerComponent implements AfterContentChecked, OnDestroy, AfterViewInit {

  @ViewChild('appSidebar', { read: ElementRef<HTMLElement> }) sideBarElementRef: ElementRef;
  get openSideNav() {
    return this.application.initOpenSidebar
  }
  minWidthStyle: number = 280;
  maxWidthStyle: number = 500
  widthStyle: number = this.minWidthStyle;

  scaleNumber: string;

  isCoordsWGSDecimal: boolean;
  scaleMap = 'Carregando...';

  layersIsLoading: boolean = true;


  // private _initOpenSidebar: boolean;
  // @Input()
  // set initOpenSidebar(newValue: boolean) {
  //   this.geoService.sidebarOpened.next(newValue);
  //   this._initOpenSidebar = newValue;
  // }
  // get initOpenSidebar(): boolean {
  //   return this._initOpenSidebar;
  // }

  // private _idMap: string;
  // @Input()
  // set idMap(newValue: string) {
  //   this._idMap = newValue;
  // }
  // get idMap(): string {
  //   return this._idMap;
  // }

  application: appConfig;

  // private _layersOpened: string[];
  // @Input()
  // set layersOpened(newValue: string[]) {
  //   this._layersOpened = newValue;
  // }
  // get layersOpened(): string[] {
  //   return this._layersOpened;
  // }

  // private _legends: string[];
  // @Input()
  // set legends(newValue: string[]) {
  //   this._legends = newValue;
  // }
  // get legends(): string[] {
  //   return this._legends;
  // }

  setApplicationSub: Subscription;
  layersIsLoadingSub: Subscription;
  intervalSubscriptionSub: Subscription;

  constructor(public geoService: GeoService, private cdRef: ChangeDetectorRef, private dialog: MatDialog, private auth: AuthService, private toastr: ToastrService) {

    // this.intervalSubscriptionSub = interval(1000).subscribe(val => {
    //   console.log('Interval value (main-container):', val);
    // });

    this.setApplicationSub = this.geoService.setApplication.subscribe(e => {
      this.application = e
    });
    // this.geoService.sidebarOpened.subscribe(e => this.openSideNav = e);
    this.layersIsLoadingSub = this.geoService.layersIsLoading$.subscribe(e => this.layersIsLoading = e);
    this.geoService.resizeSidebar.next(this.widthStyle);
  }
  async ngAfterViewInit(): Promise<void> {
    // if (!(await this.auth.canAccessSubSystem(this.application.telaGSUSubsystem!))) {
    //   this.toastr.error('Você não tem permissão para acessar essa interface. Por isso, estamos redirecionando você.', undefined, { progressBar: true, timeOut: 5000, positionClass: 'toast-top-right' }).onHidden.pipe(take(1)).subscribe(e => {
    //     window.location.href = this.auth.intranetURL + 'SIGEM/login';
    //   })
    // }
  }

  unsubscribeAll() {
    this.setApplicationSub.unsubscribe();
    this.layersIsLoadingSub.unsubscribe();
    // this.intervalSubscriptionSub.unsubscribe();
  }

  ngOnDestroy(): void {
    this.unsubscribeAll();
  }

  setScale(e) {
    this.scaleNumber = e.target.value;
    this.geoService.setMapScale(this.scaleNumber);
  };

  ngAfterContentChecked() {
    this.geoService.mapScale.subscribe(e => {
      if (e) this.scaleMap = 'Escala aprox. 1:' + e.toFixed(1).toString();
      this.scaleNumber = e.toFixed(0);
    });
    this.cdRef.detectChanges();
  };

  onResizing(event: ResizeEvent): void {
    this.widthStyle = event.rectangle.width < this.minWidthStyle ? this.minWidthStyle : event.rectangle.width;
    this.widthStyle = this.widthStyle > this.maxWidthStyle ? this.maxWidthStyle : this.widthStyle;
    this.geoService.resizeSidebar.next(this.widthStyle);
  }

  toStringHDMSFunction(coords: Coordinate) {
    return toStringHDMS(coords);
  }

  formatCoordsWGS(coords: Coordinate) {
    if (!coords) return 'Mouse fora do mapa'
    const template = '{y}°, {x}°';
    return format(coords, template, 5);
  }

  formatCoordsUTM(coords: Coordinate) {
    if (!coords) return 'Mouse fora do mapa'
    const template = '{x} E, {y} N';
    return format(coords, template, 2);
  }

  getScale(scale) {
    if (scale === 0) return 'Carregando...'
    return 'Escala aprox. 1:' + scale.toFixed(1);
  }


  openSelectAppliction() {

    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = false;
    dialogConfig.hasBackdrop = true;

    this.dialog.open(ModalSelectApplicationComponent, dialogConfig)
  }


}
