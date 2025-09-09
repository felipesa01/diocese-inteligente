import { AfterViewInit, Component, Inject, Input, OnDestroy, OnInit, ViewContainerRef } from '@angular/core';
import { interval, lastValueFrom, Subscription, take } from 'rxjs';
import { appConfig, GeoService } from 'src/app/services/geo.service';
import { DOCUMENT } from '@angular/common';
import { AuthService } from 'src/app/services/auth.service';
import { ActivatedRoute, Router, RoutesRecognized } from '@angular/router';
import { ApisConectionService } from 'src/app/services/apis-conection.service';
import { compilePipeFromMetadata } from '@angular/compiler';
import { layerCatalogItem, LayersManagementService } from 'src/app/services/layers-management.service';
import { DialogPosition, MatDialog, MatDialogConfig, MatDialogRef, MatDialogState } from '@angular/material/dialog';
import { SecLayerListComponent } from '../sidebar/sec-layer-list/sec-layer-list.component';

@Component({
	selector: 'app-map',
	templateUrl: './map.component.html',
	styleUrls: ['./map.component.css'],
})
export class MapComponent implements AfterViewInit, OnInit, OnDestroy {

	showModalFilter: boolean = false;
	idToModalFilter: string;
	idToModalTimeLine: string | null;
	elem;
	ctrlSwipeShowed = true;

	timelineShowed: { layerId: number, on: boolean }

	loaderServiceSub: Subscription;
	isLoading: boolean;


	turnApplication: appConfig;


	private _id: string;
	@Input()
	set id(newValue: string) {
		this._id = newValue;
	}
	get id(): string {
		return this._id;
	}

	isOpen = false;

	// private _showLayers: string[];
	// @Input()
	// set showLayers(newValue: string[]) {
	// 	this._showLayers = newValue;
	// }
	// get showLayers(): string[] {
	// 	return this._showLayers;
	// }

	// private _legends: string[];
	// @Input()
	// set legends(newValue: string[]) {
	// 	this._legends = newValue;
	// }
	// get legends(): string[] {
	// 	return this._legends;
	// }

	setApplicationSub: Subscription;
	ctrlSwipeShowedSub: Subscription;
	timelineIsOpenSub: Subscription;
	intervalSubscriptionSub: Subscription;
	resizeSidebarSub: Subscription;
	position: DialogPosition;

	constructor(
		public geoService: GeoService,
		public dialogRef: MatDialogRef<SecLayerListComponent>,
		private dialog: MatDialog,
		private layerService: LayersManagementService,
		@Inject(DOCUMENT) private document: any, private router: Router, private apiService: ApisConectionService) {

		// this.intervalSubscriptionSub = interval(1000).subscribe(val => {
		// 	console.log('Interval value (map):', val);
		// });

		this.setApplicationSub = this.geoService.setApplication.subscribe(e => {
			this.turnApplication = e;
			
		});

		this.ctrlSwipeShowedSub = this.geoService.ctrlSwipeShowed.subscribe((e) => {
			this.ctrlSwipeShowed = e;
		});

		this.timelineIsOpenSub = this.geoService.timelineIsOpen.subscribe(e => {
			this.timelineShowed = e
		});

		this.resizeSidebarSub = this.geoService.resizeSidebar.subscribe((e) => {

			this.position = { left: 15 + 'px', top: '12vh' }
			if (this.dialogRef instanceof MatDialogRef && this.dialogRef.getState() === MatDialogState.OPEN) {
				setTimeout(e => {
					this.dialogRef.updatePosition(this.position)
					// this.openDialog()
				}, 10)
			};
		})

	}
	ngOnDestroy(): void {
		this.unsubcribeAll()
	}

	unsubcribeAll() {
		// console.log('unsubscribing')
		// this.intervalSubscriptionSub.unsubscribe()
		this.setApplicationSub.unsubscribe()
		this.ctrlSwipeShowedSub.unsubscribe()
		this.timelineIsOpenSub.unsubscribe()
		this.resizeSidebarSub.unsubscribe()
	}

	public windowReference: any;
	ngAfterViewInit(): void {
		this.startMap()

		setTimeout(() => {
			this.openDialog();
		}, 1000)
	}

	imgSources: { id: number, img: string }[] = [];
	async getLegend() {
		// var sources = ['pmspwebgeo:monitorAreasPublicas_pontos', 'pmspwebgeo:monitor_areas_publicas']
		// var sources = this.turnApplication.layersLegend

		if (this.turnApplication.layersLegend) {
			await Promise.all(this.turnApplication.layersLegend.map(async e => {
				var layer = (await this.layerService.getLayersFromPG(e))[0]
				var layerSource = layer.get('fonteGS_front')
				this.imgSources.push({
					id: layer.get('id'),
					img: await lastValueFrom(this.apiService.getLegendFileFromGS(this.apiService.getLegendURLFromGS(layerSource)))
				});

			}))
			this.imgSources.sort((a, b) => { return this.turnApplication.layersLegend.indexOf(a.id) - this.turnApplication.layersLegend.indexOf(b.id); })
		};

		// this.imgSources = sources.map(e => this.apiService.getLegendURLFromGS(e));
	}

	startMap() {
		this.geoService.updateView();
		this.geoService.setTileSource();
		this.geoService.updateSize(this._id);

		this.getLegend();

	}

	ngOnInit() {
		this.elem = document.documentElement;
		// Rastrear a rota atual para atualização da view do mapa
		// https://stackoverflow.com/questions/42947133/parent-components-gets-empty-params-from-activatedroute
		this.router.events.subscribe(val => {
			if (val instanceof RoutesRecognized) {
				//  colocar aqui a ação de aproximar o mapa para a feição definida
				// this.unsubcribeAll()
				console.log('Entrou em rota');
				// this.zoomToThere(val.state.root.firstChild.params['layerid']);
				this.geoService.updateSize(this.id);
				
			}
		});
	}


	zoomToThere(idLayer) {
		// this.geoService.updateView(idLayer);
	}


	isFulled: boolean = false;
	toggleFull() {
		if (!this.isFulled) {
			this.openFullscreen();
			// this.geoService.sidebarOpened.next(false);
		}
		else {
			this.closeFullscreen();
			// this.geoService.sidebarOpened.next(true);
		};
	}

	openFullscreen() {
		this.isFulled = true;
		if (this.elem.requestFullscreen) {
			this.elem.requestFullscreen();
		} else if (this.elem.mozRequestFullScreen) {
			/* Firefox */
			this.elem.mozRequestFullScreen();
		} else if (this.elem.webkitRequestFullscreen) {
			/* Chrome, Safari and Opera */
			this.elem.webkitRequestFullscreen();
		} else if (this.elem.msRequestFullscreen) {
			/* IE/Edge */
			this.elem.msRequestFullscreen();
		}
	}

	/* Close fullscreen */
	closeFullscreen() {
		this.isFulled = false;
		if (this.document.exitFullscreen) {
			this.document.exitFullscreen();
		} else if (this.document.mozCancelFullScreen) {
			/* Firefox */
			this.document.mozCancelFullScreen();
		} else if (this.document.webkitExitFullscreen) {
			/* Chrome, Safari and Opera */
			this.document.webkitExitFullscreen();
		} else if (this.document.msExitFullscreen) {
			/* IE/Edge */
			this.document.msExitFullscreen();
		}
	}

	refreshMap() {

		this.geoService.refreshMap();

		// this.router.navigate(['setview', Math.round(Math.random() * (18 - 10) + 10), Math.round(Math.random() * (18 - 10) + 10)]);

		// console.log(this.route.snapshot)

		// this.geoService.changeStreetViewWindow()

		// setTimeout(() => {
		// 	//create the component dynamically
		// 	const comp = this.viewContainerRef.createComponent(StreetViewWindowsComponent);

		// 	this.windowReference = window.open('', '_blank', 'toolbar=0, width=800, height=400, popup');

		// 	this.windowReference.document.body.appendChild(comp.location.nativeElement);

		// 	document.querySelectorAll('link, style').forEach((htmlElement) => { if (this.windowReference) { this.windowReference.document.head.appendChild(htmlElement.cloneNode(true)); } })
		// });
	}

	add3dModel() {

		// this.geoService.add3dModel();

	}

	apply() { }

	open360images() {
		this.geoService.open360image()
	}


	async navigate(rota: string) {
		// console.log(await lastValueFrom(this.authService.getUserGSU()));
		// console.log(await lastValueFrom(this.authService.getTelasGSU()));

		// this.route.navigate(['/map'], {skipLocationChange: true})
		this.router.navigate([`/${rota}`], { skipLocationChange: false })
	}

	async getCookie2() {
		// console.log(await lastValueFrom(this.authService.getUserGSU()));
		// console.log(await lastValueFrom(this.authService.getTelasGSU()));

		// this.route.navigate(['/map'], {skipLocationChange: true})
		this.router.navigate(['/'], { skipLocationChange: false })
	}


	goToHome() {
		this.geoService.map.getView().fit(this.geoService.igrejasLayer.getSource().getExtent(), { padding: Array(4).fill(150), duration: 500, maxZoom: 21 });
	}


	openDialog() {
		const dialogConfig = new MatDialogConfig();
		dialogConfig.disableClose = true;
		dialogConfig.hasBackdrop = false;
		dialogConfig.enterAnimationDuration = 50;
		dialogConfig.position = this.position;
		dialogConfig.panelClass = 'custom-mat-dialog-panel-sec-layer-list'

		this.isOpen = true;
		this.dialogRef = this.dialog.open(SecLayerListComponent, dialogConfig);
		this.dialogRef.afterClosed().pipe(take(1)).subscribe((e) => {
			this.isOpen = false
		});
	}
	modoMapa: 'satelite' | 'mapa' = 'mapa';
	trocarCamada() {
		this.modoMapa = this.modoMapa === 'satelite' ? 'mapa' : 'satelite';
		this.geoService.changeTileSource(this.modoMapa);
	}


}
