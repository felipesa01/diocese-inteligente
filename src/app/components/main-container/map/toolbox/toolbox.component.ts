import { AfterViewInit, Component, Inject, Input, OnDestroy, QueryList, TemplateRef, ViewChildren, ɵɵNgModuleDeclaration } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef, MatDialogState } from '@angular/material/dialog';
import { NgxPrintService, PrintOptions } from 'ngx-print';
import TileLayer from 'ol/layer/Tile';
import { interval, Subscription } from 'rxjs';
import { NgTemplateNameDirective } from 'src/app/directives/ng-template-name.directive';
import { appConfig, GeoService } from 'src/app/services/geo.service';
import { mappingResultObject } from 'src/app/services/layers-management.service';
import { ToolboxConfig } from 'src/modules/toolbox-config';
import { PassThrough } from 'stream';

// export interface functionDict {
//   id: string,
//   function: Function
// };

@Component({
  selector: 'app-toolbox',
  templateUrl: './toolbox.component.html',
  styleUrls: ['./toolbox.component.css']
})
export class ToolboxComponent implements OnDestroy {

  @ViewChildren(NgTemplateNameDirective) submenuItems: QueryList<NgTemplateNameDirective>;
  activeTools: string[] = [];
  streetViewIsOpen: boolean;
  // openedSubMenu: string | null;
  subMenuDialogRef: MatDialogRef<any>;

  whichMeasure: string;
  multipleMeasure: boolean = false
  geomMeasure: string;


  functionMapperbackup = [
    {
      id: 'cursor',
      icon: 'arrow_selector_tool',
      tip: 'Navegação livre',
      func: (e) => this.defaultTool(),
      childOf: null
    },
    {
      id: 'swipe',
      icon: 'fg-swipe-map-v',
      tip: 'Comparar mapas',
      func: (e) => this.openSubMenu(e),
      childOf: null
    },
    {
      id: 'swipe-ver',
      icon: 'fg-screen-split-h',
      tip: 'Vertical',
      func: (e) => this.swipeCtrl('swipe-ver'),
      childOf: 'swipe'
    },
    {
      id: 'swipe-hor',
      icon: 'fg-screen-split-v',
      tip: 'Horizontal',
      func: (e) => this.swipeCtrl('swipe-hor'),
      childOf: 'swipe'
    },
    {
      id: 'measuretool',
      icon: 'fg-measure',
      tip: 'Ferramenta de medição',
      func: (e) => this.openSubMenu(e),
      childOf: null
    },
    {
      id: 'measuretool-lin',
      icon: 'fg-polyline-pt',
      tip: 'Medir distância',
      func: (e) => this.toggleMeasureTool('measuretool-lin'),
      childOf: 'measuretool'
    },
    {
      id: 'measuretool-pol',
      icon: 'fg-polygon-pt',
      tip: 'Medir área',
      func: (e) => this.toggleMeasureTool('measuretool-pol'),
      childOf: 'measuretool'
    },
    {
      id: 'go-to-coords',
      icon: 'fg-pushpin',
      tip: 'Inserir coordenadas',
      func: (e) => this.goToCoords('go-to-coords'),
      childOf: null
    },
    {
      id: 'filter',
      icon: 'filter_alt',
      tip: 'Filtro',
      func: (e) => this.openFilter('filter'),
      childOf: null
    },
    {
      id: 'timeline',
      icon: 'timeline',
      tip: 'Linha do tempo',
      func: (e) => this.toggleTimeline('timeline'),
      childOf: null,
    }
  ];
  functionMapper = this.functionMapperbackup.slice();



  // toolboxConfig = new ToolboxConfig(this.geoservice, this.dialog, this.printService);
  // functionMapper = this.toolboxConfig.functionMapper

  streetViewIsOpenSub: Subscription;
  mapResizingSub: Subscription;

  application: appConfig;
  applicationSub: Subscription;
  intervalSubscriptionSub: Subscription;

  constructor(public geoservice: GeoService, private dialog: MatDialog, private printService: NgxPrintService) {

    // this.intervalSubscriptionSub = interval(1000).subscribe(val => {
    //   console.log('Interval value (toolbox):', val);
    // });

    this.streetViewIsOpenSub = this.geoservice.streetViewIsOpen.subscribe((e) => {
      this.streetViewIsOpen = e;
      this.subMenuDialogRef?.close();
    });

    this.mapResizingSub = this.geoservice.mapResizing.subscribe((e) => {
      this.subMenuDialogRef?.close();
    });

    this.applicationSub = this.geoservice.setApplication.subscribe(e => {
      this.application = e;
      this.functionMapper = this.functionMapper.filter(i => e.toolbox.map(text => text).some(z => i.id.includes(z)))
    })

    this.geoservice.goToCoordCloser.subscribe(e => {
      if (e) { this.goToCoords('go-to-coords') }
    });

  }

  // Configurações genéricas gerais
  getIdOfEvent(e: Event): string {
    var el = e.currentTarget as HTMLButtonElement;
    return el.getAttribute('id');
  }

  toggleActiveTool(id: string, slice: number = -1) {
    // caso não haja valor definido para segmentar o id (casos sem submenu)
    if (slice === -1) {
      if (this.activeTools.includes(id)) {
        this.activeTools = this.activeTools.filter(e => e !== id);
        return false
      }
      else {
        this.activeTools.push(id);
        return true
      }
    }
    // Caso haja valor para segmentar o id (casos de submenu)
    else {
      // Define a lista com os "ids" de funcoes de submenu ativas
      var flexibleArray = this.activeTools.filter(e => e.slice(0, slice) === id.slice(0, slice));

      // Caso a lista contenha o id especificado, o remove e retorna false (desativar)
      if (flexibleArray.length > 0 && flexibleArray.includes(id)) {
        this.activeTools = this.activeTools.filter(e => e !== id);
        return false

      }
      // Caso a lista não contenha o id especificado, o insere e retorna true (ativar)
      else {
        this.activeTools = this.activeTools.filter(e => e.slice(0, slice) !== id.slice(0, slice))
        this.activeTools.push(id);
        return true
      }
    }
  }

  isActive(id: string, slice: number = 0) {
    return this.activeTools.map(e => e.split('-')[0]).includes(id)
  }

  doApply(e: Event) {
    var id = (e.currentTarget as HTMLButtonElement).getAttribute('id');
    var func = this.functionMapper.filter(e => e.id === id)[0].func
    func(e);
  }

  // Configurações genéricas do submenu
  getTemplateRefByName(name: string): TemplateRef<any> {
    const dir = this.submenuItems.find(dir => dir.name === name);
    return dir ? dir.template : null
  }

  openSubMenu(e: Event) {

    var elem = e.currentTarget as HTMLElement;
    var targetAttr = elem.getBoundingClientRect();
    var submenuPosition = this.getPositions(targetAttr, !this.streetViewIsOpen);
    const tamplate = this.getTemplateRefByName(elem.id);

    if (this.subMenuDialogRef instanceof MatDialogRef && this.subMenuDialogRef.getState() === MatDialogState.OPEN) {
      this.activeTools.forEach((id) => {
        if (id.slice(0, -4).includes(elem.id)) {
          var func = this.functionMapper.filter((el) => el.id === id)[0].func;
          func(id);
        }
      });
      this.subMenuDialogRef.close();
    }
    else {
      this.openDialog(tamplate, submenuPosition);

    }
  }

  openDialog(e: TemplateRef<any>, position: { top: string, left: string }): void {
    const dialogConfig = new MatDialogConfig();
    // dialogConfig.disableClose = false;
    dialogConfig.hasBackdrop = false;
    dialogConfig.enterAnimationDuration = 0;
    dialogConfig.panelClass = !this.streetViewIsOpen ? 'custom-mat-dialog-subitem-toolbox-main' : 'custom-mat-dialog-subitem-toolbox-sec';
    dialogConfig.position = position;

    this.subMenuDialogRef = this.dialog.open(e, dialogConfig);
  }

  getPositions(targetAttr: DOMRect, main: boolean = true) {
    if (main) {
      return {
        top: targetAttr.y + (targetAttr.height / 2) + "px",
        left: targetAttr.x + "px"
      };
    }

    else return {
      top: targetAttr.y + targetAttr.height + "px",
      left: targetAttr.x + targetAttr.width / 2 + "px"
    };
  }

  // Ferramentas

  // -- Desativar todas as ferramentas 
  defaultTool() {
    this.geoservice.clearHighligthAllFeature('higthlihtInfo');
    this.subMenuDialogRef?.close()
    this.activeTools.forEach((id) => {
      this.functionMapper.filter(el => el.id === id)[0].func(id);
    });
    this.activeTools = []
  }

  // -- Comparador de mapa base 
  swipeCtrl(string: 'swipe-hor' | 'swipe-ver') {
    var pos: 'vertical' | 'horizontal' = string.slice(-3) == 'ver' ? 'vertical' : 'horizontal';
    var action = this.toggleActiveTool(string, -4);

    if (action) {
      this.geoservice.changeSwipeOrientation(pos)
      if (!this.geoservice.ctrlSwipeShowed.value) this.geoservice.setSwipeCtrl(true)
    }
    if (!(action && this.geoservice.ctrlSwipeShowed.value)) {
      this.geoservice.setSwipeCtrl(action)
    };
  }

  // -- Ferramenta de medição
  toggleMeasureTool(string: string) {
    var action = this.toggleActiveTool(string, -4);
    if (action) {
      this.geomMeasure = string.includes('lin') ? 'LineString' : 'Polygon';
    }
    else {
      this.geomMeasure = undefined;
    }
    this.geoservice.setMeasureTool(action, this.multipleMeasure, this.geomMeasure)
  }

  //  -- Inserir coordenadas
  goToCoords(string: string) {
    var action = this.toggleActiveTool(string);
    this.geoservice.setGoToCoords(action);
  }

  changeMultpleMeasureTool() {
    // this.toggleMeasureTool(this.whichMeasure);
    this.geoservice.setMeasureTool(true, this.multipleMeasure, this.geomMeasure);
  }

  clearMeasureVector() {
    this.geoservice.clearMeasureToolVector();
  }

  printMe() {
    const customPrintOptions: PrintOptions = new PrintOptions({
      printSectionId: 'map'
      // previewOnly: true
      // Add any other print options as needed
    });

    // this.geoservice.updateSize('header-bar')
    this.printService.print(customPrintOptions)
  }

  ngOnDestroy(): void {
    // this.intervalSubscriptionSub.unsubscribe();
    this.streetViewIsOpenSub.unsubscribe();
    this.mapResizingSub.unsubscribe();
    this.applicationSub.unsubscribe();
  }


  openFilter(id: string) {
    var action = this.toggleActiveTool(id)
    var mappedResult = this.getMappedResultObj()
    if (mappedResult) {
      this.geoservice.openGeneralFeatureInfo(this.getMappedResultObj(), false, 'filter')
    }
    else {
      console.log('Ignorando filtros');
    }
  }

  getMappedResultObj(): mappingResultObject {
    var layerId = this.geoservice.setApplication.value.mainLayer;

    if (layerId) {
      var layer = this.geoservice.map.getAllLayers().filter(e => e.get('id') == layerId)[0]
      return {
        layerId: layer.get('id'),
        layerName: layer.get('name'),
        fonteGS_front: layer.get('fonteGS_front'),
        fonteGS_back: layer.get('fonteGS_back'),
        pk_name: layer.get('pk_name'),
        pk_value: null,
        geomFeature: null,
        nameFeature: null
      }
    }
    else {
      return null
    }


  }

  timelineIsOpen: boolean = false;
  toggleTimeline(string: string) {
    var action = this.toggleActiveTool(string);
    var layerId = this.geoservice.setApplication.value.mainLayer
    this.timelineIsOpen = !this.timelineIsOpen
    if (!this.timelineIsOpen && layerId) {
      this.geoservice.resetTimelineLayer(this.geoservice.map.getAllLayers().filter(e => e.get('id') == layerId)[0] as TileLayer<any>)
    }
    if (layerId) {
      this.geoservice.timelineIsOpen$.next({ layerId: layerId, on: this.timelineIsOpen });
    }
  }


}
