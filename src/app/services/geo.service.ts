import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import Attribution from 'ol/control/Attribution';
import Swipe from 'ol-ext/control/Swipe';
import { fromLonLat, METERS_PER_UNIT } from 'ol/proj';
import { defaults as defaultControls, ScaleLine } from 'ol/control';
import { defaults as defaultInteractions, Draw, PinchZoom } from 'ol/interaction';
import { AfterViewInit, Injectable, NgZone, OnInit, Renderer2, RendererFactory2 } from '@angular/core';
import { Feature } from 'ol';
import { Circle, GeometryCollection, LinearRing, LineString, MultiLineString, MultiPoint, MultiPolygon, Point, Polygon } from 'ol/geom';
import Collection from 'ol/Collection.js';
import { toGeometry, } from 'ol/render/Feature';
import RenderFeature from "ol/render/Feature";
import { LayersManagementService, mappingResultObject } from './layers-management.service';
import BaseLayer from 'ol/layer/Base';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { BehaviorSubject, lastValueFrom, take } from 'rxjs';
import { unByKey } from 'ol/Observable';
import { transform } from 'ol/proj';
import proj4 from 'proj4/dist/proj4';
import { register } from 'ol/proj/proj4';
import Scale from 'ol-ext/control/Scale'
import StreetView, { BtnControlSize, MapSize, Language } from 'ol-street-view';
import { Coordinate } from 'ol/coordinate';
import { SelectModalInfoService } from './select-modal-info.service';
import { ImageWMS, TileWMS, VectorTile } from 'ol/source';
import { Layer } from 'ol/layer';
import BaseVectorLayer from 'ol/layer/BaseVector';
import BaseTileLayer from 'ol/layer/BaseTile';
import BaseImageLayer from 'ol/layer/BaseImage';
import GeoJSON from 'ol/format/GeoJSON.js';


import { dataToDialogInfoSearch } from './apis-conection.service';
import LayerGroup from 'ol/layer/Group';
import { OnClickComponent } from '../components/on-click/on-click.component';
import { ModalResumeLayerComponent } from '../components/modal-resume-layer/modal-resume-layer.component';
import { listItem } from '../components/main-container/sidebar/main-layer-list/main-layer-list.component';
import { ModalGoToCoordsComponent } from '../components/main-container/map/toolbox/modal-go-to-coords/modal-go-to-coords.component';
import { TestPanoramaComponent } from '../components/test-panorama/test-panorama.component';
import ImageLayer from 'ol/layer/Image';
import { MenuOnClickComponent } from '../components/on-click/menu-on-click/menu-on-click.component';
import { AuthService } from './auth.service';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import VectorSource from 'ol/source/Vector';

export interface appConfig {
  // Id do mapa onde será acoplado a instancia Map do OpenLayers
  mapId: string,
  // Sistema usado para análise das permissões. No caso da rota /apiSisGsu/api/permissao/[ID], será inserido esse numero na url.
  systemIDGSU: number
  // Nome utilizado na lista de seleção de subsistemas (ainda será implementado)
  systemName: string,
  // Nome da tela iniciada com "SISTEMA - " que será avaliada se o usuário pode acessar. Em caso de subsistema sem necessidade de permissão, deixar em branco.
  telaGSUSubsystem: string | null,
  // Se apresenta a barra lateral de gerenciamento das camadas ou não
  haveSidebar: boolean,
  // Se a barra lateral de gerenciamento das camadas, caso apresente, inicia aberta ou fechada
  initOpenSidebar: boolean,
  // Se apresenta a opção de mudar a imagem de fundo ou não
  haveTileLayer: boolean,
  // Se será possível habilitar o recurso do StreetView
  streetView: boolean,
  // Se é possível abrir mais de uma janela de Informação/Busca/Edição/Filtro
  multipleISFEModal: boolean,
  // Quais as funções existentes na barra de ferramenta na lateral direita 
  toolbox: string[],
  // Quais as camadas possíveis de busca na janela de Busca Rápida
  search: number[],
  // Qual a camada principal do mapa (para os casos em que não há barra lateral de gerenciamento de camadas). É nela que vai ser aplicado o filtro, a busca..
  mainLayer: number,
  // Camadas abertas ao iniciar o mapa
  LayersOpened: number[],
  // Camadas cuja legenda irá aparecer
  layersLegend: number[],
}


@Injectable()
export class GeoService implements OnInit, AfterViewInit {

  applicationsList: appConfig[] = [
    {
      mapId: 'diocese-main',
      systemIDGSU: environment.production ? 201 : 200,
      systemName: 'Diocese Inteligente',
      telaGSUSubsystem: null,
      haveSidebar: false,
      haveTileLayer: true,
      initOpenSidebar: false,
      multipleISFEModal: true,
      streetView: false,
      search: [8, 19],
      toolbox: ['cursor', 'swipe', 'measuretool', 'go-to-coords'],
      mainLayer: undefined,
      layersLegend: [],
      LayersOpened: []
    },
    {
      mapId: 'bc',
      systemIDGSU: environment.production ? 201 : 200,
      systemName: 'Base Cartográfica',
      telaGSUSubsystem: null,
      haveSidebar: true,
      haveTileLayer: true,
      initOpenSidebar: true,
      multipleISFEModal: true,
      streetView: true,
      search: [8, 19],
      toolbox: ['cursor', 'swipe', 'measuretool', 'go-to-coords'],
      mainLayer: undefined,
      layersLegend: [],
      LayersOpened: []
    },
    {
      mapId: 'monap',
      systemIDGSU: environment.production ? 221 : 1226,
      systemName: 'Monitoramento de áreas públicas',
      telaGSUSubsystem: null,
      haveSidebar: false,
      haveTileLayer: false,
      initOpenSidebar: false,
      multipleISFEModal: false,
      streetView: false,
      search: [172, 171],
      toolbox: ['cursor', 'filter', 'timeline'],
      mainLayer: 172,
      layersLegend: [172, 173, 215, 216],
      LayersOpened: [172, 173, 215, 216, 171]
    },
    {
      mapId: 'zela',
      systemIDGSU: environment.production ? 201 : 200,
      systemName: 'Zeladoria',
      telaGSUSubsystem: 'SISTEMA - Zeladoria',
      haveSidebar: false,
      haveTileLayer: false,
      initOpenSidebar: false,
      multipleISFEModal: false,
      streetView: false,
      search: [170, 19],
      toolbox: ['cursor', 'filter', 'timeline'],
      mainLayer: 170,
      layersLegend: [170],
      LayersOpened: [170, 171]
    },
    {
      mapId: 'cult',
      systemIDGSU: environment.production ? 201 : 200,
      systemName: 'Cultura',
      telaGSUSubsystem: 'SISTEMA - Cultura',
      haveSidebar: false,
      haveTileLayer: false,
      initOpenSidebar: false,
      multipleISFEModal: false,
      streetView: false,
      search: [176, 171],
      toolbox: ['cursor', 'filter', 'timeline'],
      mainLayer: 176,
      layersLegend: [176],
      LayersOpened: [176, 171]
    }
  ]

  public geomTypes = {
    'Point': Point,
    'LineString': LineString,
    'LinearRing': LinearRing,
    'Polygon': Polygon,
    'MultiPoint': MultiPoint,
    'MultiLineString': MultiLineString,
    'MultiPolygon': MultiPolygon,
    'GeometryCollection': GeometryCollection,
    'Circle': Circle
  }

  // Variaveis do Street View (ol-street-view)
  streetView_opt_options = {
    apiKey: null,
    size: BtnControlSize.Small,
    radius: 100,
    updatePegmanToClosestPanorama: true,
    transparentButton: true,
    // zoomOnInit: 18,
    minZoom: null,
    resizable: true,
    sizeToggler: false,
    defaultMapSize: MapSize.Expanded,
    autoLoadGoogleMaps: true,
    target: 'street-view-windows',
    language: Language.EN,
    i18n: {
      exit: 'Sair',
      exitView: 'Clique para sair do modo Google Street',
      dragToInit: 'Clique e arraste para visualizar Google Street',
      noImages: "Imagens não encontradas. Clique no mapa abaixo para visualizar outra área"
    }
  }
  streetView: StreetView = new StreetView(this.streetView_opt_options);
  streetViewIsOpen$ = new BehaviorSubject<boolean>(false);
  streetViewIsOpen = this.streetViewIsOpen$.asObservable()

  // Variaveis do Comparador de mapas (ol-ext - Swipe)
  ctrlSwipe = new Swipe();
  ctrlSwipeOrientation: 'vertical' | 'horizontal' = 'vertical';
  ctrlSwipeShowed = new BehaviorSubject<boolean>(false);
  selectedTileSourceSec: TileLayer<any>;

  // Variaveis do visualizador das coordenadas do mouse
  mousePositionWGS84: Coordinate;
  mousePositionUTM: Coordinate;

  // Variaveis da inicialização do mapa
  public map: Map;
  ngZone: NgZone;
  private readonly tileLayer: TileLayer<any>;
  // public layerList: VectorLayer<any>[] = [];
  private attribution = new Attribution({
    collapsible: false,
  });
  tileSources: TileLayer<any>[];
  selectedTileSource: TileLayer<any>;
  // mainInfoFeaturesPointFunctionSubscrition;
  mapRedering: boolean = true;
  mapResizing = new BehaviorSubject<boolean>(true);
  legend

  // MUDAR DEPOIS PARA UM SERVICE PROPRIO (Sharedata)
  resizeSidebar = new BehaviorSubject<number>(undefined);
  sidebarOpened = new BehaviorSubject<boolean>(true);
  setApplication = new BehaviorSubject<appConfig>({
    mapId: 'bc',
    systemIDGSU: undefined,
    systemName: undefined,
    telaGSUSubsystem: undefined,
    haveSidebar: undefined,
    haveTileLayer: undefined,
    initOpenSidebar: undefined,
    multipleISFEModal: undefined,
    streetView: false,
    toolbox: undefined,
    search: undefined,
    mainLayer: undefined,
    layersLegend: undefined,
    LayersOpened: undefined
  });
  toggleLegend = new BehaviorSubject<{ id: number, open: boolean } | undefined>(undefined);
  toggleClicavel = new BehaviorSubject<{ id: number, clicavel: boolean } | undefined>(undefined);
  toggleVisible = new BehaviorSubject<{ id: number, visible: boolean } | undefined>(undefined);
  isFilterd = new BehaviorSubject<{ id: number, isFiltered: boolean }>({ id: -9999, isFiltered: false });
  goToCoordCloser = new BehaviorSubject<boolean>(false);

  // Observable do carregamento inicial das camadas
  layersIsLoading$ = new BehaviorSubject<boolean>(true);

  // Listas envolvidas no component Layer-lists
  mainLayers: listItem[] = [];
  secLayers: listItem[] = [];
  treeData: { item: listItem, code: string }[] = [];
  categories: string[] = [];
  layerAdded = {}

  private renderer: Renderer2;
  layerList: ImageLayer<ImageWMS>[]

  layersFiltersControl: { [key: number]: { [key: string]: { value: { main: null, second: null }, mode: number } } } = {}

  // map3dEnabled: boolean = false;

  mapScale = new BehaviorSubject<number>(0);
  scaleCtrl = new Scale({});

  mainInfoFeaturesFunctionSubscrition;
  measureToolDrawStart;
  measureToolDrawEnd;

  igrejasLayer: VectorLayer<VectorSource> = new VectorLayer();

  igrejaEmFoco: number;


  constructor(private zone: NgZone, public layersService: LayersManagementService, private selecModal: SelectModalInfoService, private dialog: MatDialog, public generalInfoDialog: MatDialogRef<any>, private onClickComponent: MatDialogRef<OnClickComponent>, private menuOnClickDialog: MatDialogRef<MenuOnClickComponent>, public goToCoordsDialog: MatDialogRef<ModalGoToCoordsComponent>, rendererFactory: RendererFactory2, private auth: AuthService, private http: HttpClient) {

    this.renderer = rendererFactory.createRenderer(null, null);

    // Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIyODdmOTA2Yy1jZjU4LTQxMWItYmY3YS1hN2Q5YzNhZGQyYTEiLCJpZCI6MjQyMjUwLCJpYXQiOjE3MjY2MjAyNTh9.rBXujTk_MJ1DKzB5HucdCIYOM7Mh5M6dq7xP22w297I";
    // window['CESIUM_BASE_URL'] = '/'

    proj4.defs("EPSG:31983", "+proj=utm +zone=23 +south +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs");
    proj4.defs("EPSG:32723", "+proj=utm +zone=23 +south +datum=WGS84 +units=m +no_defs +type=crs");
    register(proj4);

    this.tileSources = this.layersService.tileSources
    this.selectedTileSource = this.tileSources[0];
    this.selectedTileSourceSec = this.tileSources[1];
    this.ngZone = zone;

    this.tileLayer = new TileLayer();


    this.zone.runOutsideAngular(() => this.map = new Map({
      // maxTilesLoading: 1,
      moveTolerance: 3,
      interactions: defaultInteractions().extend([
        new PinchZoom()
      ]),
      layers: [
        this.tileLayer
      ],
      view: new View({
        projection: 'EPSG:4326',
        center: [-46.9212, -23.448],
        zoom: 18,
        // extent: [-47.054, -23.549, -46.782, -23.344]
      }),
      controls: defaultControls({ attribution: false, zoom: false }).extend([
        this.attribution,

        new ScaleLine({
          units: 'metric',
        })
      ]),
    })
    );


    // Iserção das layers auxiliares
    // this.map.addLayer(this.layersService.measureToolvector);
    // this.map.addLayer(this.layersService.streetViewVector);
    // this.map.addLayer(this.layersService.layerWMSRotulos);


    this.map.addLayer(this.layersService.foraniasLayer);
    this.map.addLayer(this.layersService.municipiosLayer);
    this.map.addLayer(this.layersService.quadrasSelectedLayer);
    this.createChurchLayer();
    this.map.addLayer(this.igrejasLayer);



    // this.map.addLayer(this.layersService.vectorWFSTilied);

    // Object.keys(this.layersService.higthlihtInfo).forEach(e => {
    //   this.map.addLayer(this.layersService.higthlihtInfo[e]);
    // })

    // // Iserção e estilização inicial das layers principais 
    // this.getMainLayers();


    // Habilitar função principal do mapa (Obter informações ao clicar)
    this.setMainInfoFeaturesFunction();


    //  Habilitar EventListeners auxiliares do mapa
    this.map.on('change:size', (evt) => {
      var size = evt.target.get('size')
      if (size) {
        this.attribution.setCollapsible(evt.target.get('size')[0] < 600);
        this.mapResizing.next(true);
      }
    })

    this.map.on('pointermove', (evt) => {
      evt.coordinate
      this.mousePositionWGS84 = evt.coordinate;
      this.mousePositionUTM = transform(evt.coordinate, 'EPSG:4326', 'EPSG:31983');
    });

    this.map.on('loadstart', () => {
      this.mapRedering = true;
    });

    this.map.on('loadend', () => {
      this.mapRedering = false;
    })

    this.map.getView().on('change:resolution', () => {
      this.mapScale.next(this.getMapScale());
    });

    this.map.on('movestart', (event) => {
      this.igrejaEmFoco = undefined;
    });



    this.streetView.once('loadLib', () => {
      this.map.addControl(this.streetView);

      this.setApplication.pipe().subscribe(e => {
        var pegman = document.getElementById('ol-street-view--pegman-button-div') as HTMLElement
        if (e.streetView) {
          pegman.style.display = 'block'
        }
        else {
          pegman.style.display = 'none'
        }
      })
    });

    this.streetView.on(`streetViewInit`, () => {
      this.streetViewIsOpen$.next(true);

      this.streetView.getStreetViewPanorama().setOptions({
        addressControl: false,
        zoom: 0,
        imageDateControl: true,
        showRoadLabels: false
      });
      // Remover aviso de DESENVOLVIMENTO por falta da chave do Google Maps API
      setTimeout(() => {
        var DevelopDiv = document.getElementsByClassName('gm-style')[0];
        setTimeout(() => {
          var developModal = DevelopDiv.children[1].children[0].children[8].children[0] as HTMLElement;
          var Modal = document.getElementById('ol-street-view--panorama');
          var boxModal = Modal.children[2] as HTMLElement;
          boxModal.style.display = 'none';
          developModal.style.display = 'none';
        }, 1000)
      }, 1000)
    });

    this.streetView?.on(`streetViewExit`, () => {
      this.streetViewIsOpen$.next(false);
      this.markersStreetView.forEach((e) => {
        e.setMap(null);
      });
      this.markersStreetView = [];
    });

  }

  ngAfterViewInit(): void {
    // this.makeChurchList();
    // console.log('treeData', this.treeData)
  }

  adjustZIndex(array: listItem[]) {
    array.forEach((element) => {
      const indexToset = array.slice().reverse().indexOf(element);
      element.order = indexToset;
      element.layer.setZIndex(indexToset);
    })
  }

  addLayerToMapAndSidebar(obj: listItem, setVisible = true) {
    this.mainLayers.push(obj);
    this.map.removeLayer(obj.layer);
    obj.layer.setOpacity(1);
    this.map.addLayer(obj.layer);
    obj.layer.setVisible(setVisible);
    this.adjustZIndex(this.mainLayers);
    this.layerAdded[obj.id] = true;
  }

  removeLayerFromMapAndSidebar(obj: { id: number, layer: Layer<any> }) {
    const pos = this.mainLayers.map(e => e.id).indexOf(obj.id);
    this.mainLayers.splice(pos, 1);
    this.removeLayer(obj.layer);
    obj.layer.setVisible(true);
    this.layerAdded[obj.id] = false;
  }

  removeAllLayersFromMapAndSidebar() {
    this.mainLayers.slice().forEach(e => {
      this.removeLayerFromMapAndSidebar(e);
    })
  }

  sortLayersByCategory(a: ImageLayer<any> | TileLayer<any> | LayerGroup, b: ImageLayer<any> | TileLayer<any> | LayerGroup) {
    if (a.get('category') === 'REVISAR') return 1
    if (b.get('category') === 'REVISAR') return -1

    if (a.get('category') === b.get('category')) {
      return a.get('name').localeCompare(b.get('name'));
    }
    if (a.get('category') < b.get('category')) return -1
    if (a.get('category') > b.get('category')) return 1
    return 0
  }

  createChurchLayer() {
    this.http.get('./assets/vetores/igrejas.json').pipe(take(1)).subscribe(e => {

      let features: Feature[] = new GeoJSON({ dataProjection: "EPSG:4674", featureProjection: 'EPSG:4326' }).readFeatures(e);
      this.igrejasLayer.setSource(new VectorSource({
        features: features,
      }));
      const properties_ = {
        'name': 'Igrejas',
        'id': 2,
        'fonteGS_front': undefined,
        'fonteGS_back': undefined,
        'pk_name': 'ID',
        'category': '',
        'filtersUrlTile': undefined,
        'clicavel': true,
        'fk_name': undefined,
        'cluster_mode': undefined,
        'feat_apelido': 'Nome',
        'filtros': ['gid'],
        'estilo_geoserver': '',
        'tela_gsu': '',
        'telas_gsu': ''
      }
      this.igrejasLayer.setProperties(properties_);
      this.igrejasLayer.setStyle(this.layersService.stylesMng.styleIgrejas)

      this.makeChurchList();
    });
  }

  sortIgrejasProMunicipio(a: Feature, b: Feature) {
    if (a.get('Cidade') === b.get('Cidade')) {
      return a.get('Nome').localeCompare(b.get('Nome'));
    }
    if (a.get('Cidade') < b.get('Cidade')) return -1
    if (a.get('Cidade') > b.get('Cidade')) return 1
    return 0
  }

  makeChurchList() {

    let features = this.igrejasLayer.getSource().getFeatures().slice();
    features.sort(this.sortIgrejasProMunicipio);
    features.map((feature, index) => {
      let idFeature = feature.get(this.igrejasLayer.get('pk_name'));
      // let categoryName = this.igrejasLayer.get('name');

      var cat = feature.get('Cidade')
      if (!this.categories.includes(cat)) {
        this.categories.push(cat);
        this.treeData.push({
          item: { id: cat, order: index, name: cat, cat: cat, legendOn: false, layer: undefined } as listItem,
          code: '0.' + this.categories.length
        })
      }
      var codeCategory = this.treeData.filter(e => e.item.id === cat)[0].code
      var valueEndTurn = this.treeData.filter(e => e.code.startsWith(codeCategory)).length;
      this.treeData.push({
        item: { id: idFeature, order: index, name: feature.get(this.igrejasLayer.get('feat_apelido')), cat: cat, legendOn: false, layer: this.igrejasLayer, feature: feature } as listItem,
        code: codeCategory + '.' + valueEndTurn
      })

    });
  };

  async getMainLayers(layersId: number[] = []) {

    this.layersIsLoading$.next(true);
    this.removeAllLayersFromMapAndSidebar();
    this.mainLayers = [];
    this.secLayers = [];
    this.treeData = [];
    this.categories = [];
    this.layerAdded = {}

    this.layerList = await this.layersService.getLayersFromPG();
    var telasGSU = await lastValueFrom(this.auth.getTelasGSU());

    if (layersId.length > 0) {
      console.log(this.layerList.slice())
      this.layerList.sort((a, b) => { return layersId.indexOf(Number(a.get('id'))) - layersId.indexOf(Number(b.get('id'))) })
      console.log(this.layerList.slice())
    }
    else {
      this.layerList.sort(this.sortLayersByCategory);
    }

    this.layerList.slice().map(async (value, index) => {

      var value_turn;
      if (value instanceof LayerGroup) {
        value_turn = value.getLayers().getArray()[0];
      }
      else {
        value_turn = value;
      };

      this.layerAdded[value_turn.get('id')] = false;
      if (layersId.length > 0) {
        if (layersId.includes(Number(value_turn.get('id')))) {
          console.log('id_layer', value_turn.get('id'))
          console.log('index', index)
          this.addLayerToMapAndSidebar(
            { id: value_turn.get('id'), order: index, name: value_turn.get('name'), legendOn: false, cat: value.get("category"), layer: value } as listItem);
        }
      }
      else {
        this.secLayers.push({ id: value.get('id'), order: index, name: value.get("name"), legendOn: false, cat: value.get("category"), layer: value } as listItem);
        var cat = value.get("category");
        if (!this.categories.includes(cat)) {
          this.categories.push(cat);
          this.treeData.push({
            item: { id: cat, order: index, name: cat, cat: cat, legendOn: false, layer: undefined } as listItem,
            code: '0.' + this.categories.length
          })
        }
        var codeCategory = this.treeData.filter(e => e.item.id === cat)[0].code
        var valueEndTurn = this.treeData.filter(e => e.code.startsWith(codeCategory)).length;
        this.treeData.push({
          item: { id: value_turn.get('id'), order: index, name: value_turn.get('name'), cat: cat, legendOn: false, layer: value } as listItem,
          code: codeCategory + '.' + valueEndTurn
        })

        // Avaliar se a camada vai está carregada no mapa ao inicializar a aplicação
        var telaConfig = telasGSU.filter(tela => tela.DS_Tela == value_turn.get('telas_gsu'))[0]
        if (telaConfig && telaConfig.IC_Incluir == 'S') {
          this.addLayerToMapAndSidebar(
            { id: value_turn.get('id'), order: index, name: value_turn.get('name'), legendOn: false, cat: value.get("category"), layer: value } as listItem,
            telaConfig.IC_Imprimir == 'S' ? true : false)
        }
      }
    })
    this.layersIsLoading$.next(false);
    this.ordenacaoInicial()
  }

  async ordenacaoInicial() {

    var geomTypes: { item: listItem, geomType: string }[] = [];

    await Promise.all(this.mainLayers.map(async item => {
      var source = item.layer.get('fonteGS_back') ? item.layer.get('fonteGS_back') : item.layer.get('fonteGS_front');
      const geomResponse = await lastValueFrom(this.layersService.getGeomTypeFromSource(source))
      const geomType = geomResponse.featureTypes[0].properties.filter(e => e.name == 'geom')[0].localType
      geomTypes.push({ item: item, geomType: geomType })
    }))

    // console.log('geomTypes', geomTypes)
    var ordemGeometrias = ['Point', 'MultiPoint', 'LineString', 'MultiLineString', 'LinearRing', 'Polygon', 'MultiPolygon', 'GeometryCollection', 'Geometry']
    const sortedGeomTypes = geomTypes.slice().sort((a, b) => ordemGeometrias.indexOf(a.geomType) - ordemGeometrias.indexOf(b.geomType) || a.item.name.localeCompare(b.item.name))
    // console.log('sortedGeomTypes', sortedGeomTypes)

    this.mainLayers = sortedGeomTypes.map(e => e.item)
    this.adjustZIndex(this.mainLayers);

    // const geomResponse = await lastValueFrom(this.layersService.getGeomTypeFromSource(filteredLayers[0].getSource().getParams().LAYERS))
    // const geomType = geomResponse.featureTypes[0].properties.filter(e => e.name == 'geom')[0].localType

    // console.log('geomType', geomType)

  }



  changeStreetViewWindow() {
    // this.map.removeControl(this.streetView);
    this.streetView.setTarget('street-view-windows')
    // this.map.addControl(this.streetView)
  }

  ngOnInit() {

  }


  addFilterToLayer(layerId: number, filterObj: { [key: string]: { value: { main: null, second: null }, mode: number } }) {
    this.layersFiltersControl[layerId] = filterObj;
  }

  removeFilterFromLayer(layerId: number) {
    delete this.layersFiltersControl[layerId];
  }


  refreshMap() {
    this.map.getAllLayers().forEach((layer) => {

      var source = layer.getSource();
      if (source! instanceof TileWMS || source! instanceof ImageWMS) {
        source.updateParams({ 'TIMESTAMP': new Date().getTime() });
      }
    });
  };

  getMapScale(dpi = 96) {
    var unit = this.map.getView().getProjection().getUnits();
    var resolution = this.map.getView().getResolution();
    var inchesPerMetre = 39.37;

    return resolution * METERS_PER_UNIT[unit] * inchesPerMetre * dpi;
  }

  setMapScale(scale, dpi = 96) {
    var inchesPerMetre = 39.37;
    var unit = this.map.getView().getProjection().getUnits();
    var res = scale / (METERS_PER_UNIT[unit] * inchesPerMetre * dpi)
    this.map.getView().setResolution(res);
    // this.scaleCtrl.setScale();
  }


  // mainInfoFeaturesFunction() {

  //   var evtKey = this.map.on('click', (evt) => {
  //     const evtPixelGlobal = [evt.originalEvent.pageX, evt.originalEvent.pageY];

  //     var l = this.map.getLayers().getArray().filter(function (item) {
  //       if (
  //         item.get('clicavel') &&
  //         (((item instanceof TileLayer || item instanceof ImageLayer) && (item.getSource() instanceof TileWMS || item.getSource() instanceof ImageWMS) && item.isVisible()) ||
  //           (item instanceof LayerGroup && item.getVisible()))
  //       ) return true;
  //       else return false;
  //     })

  //     const viewResolution = /** @type {number} */ (this.map.getView().getResolution());

  //     var resultsList = {
  //       'layerList': l,
  //       'resolution': viewResolution,
  //       'coord': evt.coordinate
  //     }

  //     this.openOnClickComponent(resultsList, evtPixelGlobal);

  //     evt.preventDefault();
  //     evt.stopPropagation();
  //   });

  //   return evtKey;
  // };

  mainInfoFeaturesFunction() {

    var evtKey = this.map.on('click', (evt) => {
      let listFeature: Feature[] = [];
      // console.log('Para cada feição no clique:');
      this.map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
        // console.log('feature: ', feature);
        // console.log('layer: ', layer);
        if (typeof layer.get('id') === 'string') {
          if (['HLO', 'HLI'].some((e) => layer.get('id').includes(e))) return;
        }
        listFeature.push(feature as Feature);
      });
      // console.log(listFeature);
      const evtPixelGlobal = [evt.originalEvent.pageX, evt.originalEvent.pageY];
      this.openOnClickComponent(listFeature, evtPixelGlobal);
    });
    return evtKey;
  };

  setMainInfoFeaturesFunction() {
    this.leaveMainInfoFeaturesFunction();
    // this.mainInfoFeaturesPointFunctionSubscrition = this.map.on('pointermove', this.changeCursor);
    this.mainInfoFeaturesFunctionSubscrition = this.mainInfoFeaturesFunction();
  };

  leaveMainInfoFeaturesFunction() {
    unByKey(this.mainInfoFeaturesFunctionSubscrition);
    // unByKey(this.mainInfoFeaturesPointFunctionSubscrition);
  };


  // Função que define a ativação/inativação do SWIPE
  setSwipeCtrl(on = true, tileAux: TileLayer<any> = this.selectedTileSourceSec) {

    // Em caso de desativando
    if (!on) {
      // Remover SWIPE
      this.map.removeControl(this.ctrlSwipe);
      this.map.removeLayer(tileAux);
      this.ctrlSwipeShowed.next(false);
    }
    // Em caso de ativando
    else {
      this.map.getLayers().insertAt(1, tileAux);
      this.ctrlSwipe.addLayer(tileAux, false);
      this.ctrlSwipe.setProperties({ position: 0.5, orientation: this.ctrlSwipeOrientation });
      this.ctrlSwipeShowed.next(true);
      this.map.addControl(this.ctrlSwipe);
    }
  }


  changeSwipeOrientation(pos: 'vertical' | 'horizontal' = undefined) {
    if (pos) {
      this.ctrlSwipeOrientation = pos
    }
    else {
      this.ctrlSwipeOrientation = this.ctrlSwipeOrientation == 'horizontal' ? 'vertical' : 'horizontal'
    }
    this.ctrlSwipe.set('orientation', this.ctrlSwipeOrientation)
  }


  /**
   * Updates zoom and center of the view.
   * @param zoom Zoom.
   * @param center Center in long/lat.
   */
  updateView(zoom = 9, center: [number, number] = [-49.00, -23.9955]): void {
    this.map.getView().setZoom(zoom);
    this.map.getView().setCenter(fromLonLat(center, 'EPSG:4326'));
  }

  /**
   * Updates target and size of the map.
   * @param target HTML container.
   */
  updateSize(target): void {
    this.map.setTarget(target);
  }

  /**
   * Sets the source of the tile layer.
   * @param source Source.
   */
  setTileSource(source = this.selectedTileSource): void {
    this.selectedTileSource = source;
    this.tileLayer.setSource(source.getSource());
  }

  setTileSourceSec(source = this.selectedTileSourceSec): void {
    this.map.removeLayer(this.selectedTileSourceSec);
    this.map.getLayers().insertAt(1, source);
    this.ctrlSwipe.removeLayer(source);
    this.ctrlSwipe.addLayer(source, false);
    this.selectedTileSourceSec = source;
  }

  changeTileSource(source: 'satelite' | 'mapa'): void {
    if (source == 'mapa') {
      this.selectedTileSource = this.layersService.tileSources[0];
      this.tileLayer.setSource(this.layersService.tileSources[0].getSource());
    }
    else {
      this.selectedTileSource = this.layersService.tileSources[1];
      this.tileLayer.setSource(this.layersService.tileSources[1].getSource());
    }

  }

  setExtentLayer(layer: Layer<any>, options: {} = { padding: Array(4).fill(150) }) {
    var extent;

    // Heatmap, VectorImageLayer, VectorTileLayer, VectorLayer
    if (layer instanceof BaseVectorLayer) {
      console.log('BaseVectorLayer');
      if (layer.getSource() instanceof VectorTile)
        var geom = new Collection<RenderFeature>(layer.getSource().getFeaturesInExtent([-47.054, -23.549, -46.782, -23.344])).getArray().map(e => toGeometry(e));
      var geomCollec = new GeometryCollection(geom);
      extent = geomCollec.getExtent();
      // extent = layer.getExtent();
    }

    // TileLayer, WebGLTileLayer
    else if (layer instanceof BaseTileLayer) {
      console.log('BaseTileLayer');
      console.log(layer);
      // extent = layer;
    }
    // ImageLayer
    else if (layer instanceof BaseImageLayer) {
      console.log('BaseImageLayer');
      console.log(layer);
    }
    if (extent) this.map.getView().fit(extent, options);
  }

  getlayers() {
    const vectorLayers = this.map.getAllLayers().filter((e) => {
      if (e instanceof VectorLayer) {
        return e
      }
    });
    return vectorLayers
  }

  removeLayer(layer: BaseLayer) {
    this.map.removeLayer(layer);
  }

  // Abrir diálogo de escolha caso o click contenha mais de uma camada e/ou feição
  openOnClickComponent(e: {}, position: number[]): void {
    const positioning = { left: (position[0] + 10).toString() + 'px', top: (position[1] + 10).toString() + 'px' };
    const dialogConfig = new MatDialogConfig();
    // dialogConfig.maxHeight = '0px';
    // dialogConfig.maxWidth = '0px';
    dialogConfig.disableClose = false;
    dialogConfig.hasBackdrop = false;
    dialogConfig.position = positioning;
    dialogConfig.data = {
      mappedMenu: e,
      left: position[0],
      top: position[1]
    };

    if (this.onClickComponent instanceof MatDialogRef) this.onClickComponent.close();
    this.onClickComponent = this.dialog.open(OnClickComponent, dialogConfig);
  };

  closeOnClickComponent() {
    this.onClickComponent.close();
  }

  openMenuOnClickComponent(dialogConfig: MatDialogConfig<any>) {
    if (this.menuOnClickDialog instanceof MatDialogRef) this.menuOnClickDialog.close();
    this.menuOnClickDialog = this.dialog.open(MenuOnClickComponent, dialogConfig);
  }

  closeMenuOnClickComponent() {
    this.menuOnClickDialog.close();
  }


  chooseGeomToHighlight(feature: Feature, highlightObject: { polygon: VectorLayer<any>, line: VectorLayer<any>, point: VectorLayer<any> }) {

    if (feature.getGeometry() instanceof Polygon || feature.getGeometry() instanceof MultiPolygon) return highlightObject['polygon'];
    else if (feature.getGeometry() instanceof LineString || feature.getGeometry() instanceof MultiLineString) return highlightObject['line']
    else return highlightObject['point']
  };

  highligthFeature(feature: Feature, highlightObject: string) {
    // console.log('feature antes de highlight', feature)
    this.clearHighligthAllFeature(highlightObject);
    var layer = this.chooseGeomToHighlight(feature, this.layersService[highlightObject]);

    this.map.getLayers().insertAt(0, layer)
    // this.map.addLayer(layer);
    layer.getSource().addFeature(feature);

    // console.log(this.map.getAllLayers())
  }

  clearHighligthFeature(feature: Feature, highlightObject: string) {

    var layer = this.chooseGeomToHighlight(feature, this.layersService[highlightObject]);
    layer.getSource().clear();
    this.map.removeLayer(layer);
  }

  clearHighligthAllFeature(highlightObject: string) {
    Object.keys(this.layersService[highlightObject]).forEach((e) => {

      if (this.map.getAllLayers().includes(this.layersService[highlightObject][e])) {
        this.layersService[highlightObject][e].getSource().clear();
        this.map.removeLayer(this.layersService[highlightObject][e]);
      };
    });
  };


  dialogPositionGeneralInfo: { top: number, left: number } = { top: 70, left: 800 }
  dialogPositionGoToCoords: { top: number, left: number } = { top: 200, left: 400 }

  updatePositionModal(data: { top: number, left: number }, values: { top: number, left: number }) {
    data.top += values.top;
    data.left += values.left;
    if (window.innerWidth - data.left < 450) {
      data.left = window.innerWidth - 450
    }
    if (window.innerHeight - data.top < 100) {
      data.top = window.innerHeight - 100
    }
    if (data.top < 0) {
      data.top = 20
    }
    if (data.left < 0) {
      data.left = 20
    }
  }

  openedLayersModalsControl: {
    info: { [key: string]: { idFeature: string, geomFeature: Feature, idModal: string }[] },
    search: { [key: string]: { idModal: string } },
    filter: { [key: string]: { idModal: string } },
    edit: { [key: string]: { idFeature: string, geomFeature: Feature, idModal: string }[] }
  } = { info: {}, search: {}, filter: {}, edit: {} }

  setOpenLayersModals(mode: 'info' | 'search' | 'filter' | 'edit', layerId: string, modal: string, featureId?: string, featureGeom?: Feature) {
    if (mode == 'info' || mode == 'edit') {
      if (Object.keys(this.openedLayersModalsControl[mode]).includes(layerId.toString())) {
        this.openedLayersModalsControl[mode][layerId].push({ idFeature: featureId, geomFeature: featureGeom, idModal: modal })
      }
      else {
        this.openedLayersModalsControl[mode][layerId] = [{ idFeature: featureId, geomFeature: featureGeom, idModal: modal }];
      }
    }
    else {
      this.openedLayersModalsControl[mode][layerId] = { idModal: modal };
    }
    // console.log(this.openedLayersModalsControl);
  }

  setCloseLayersModals(mode: 'info' | 'search' | 'filter' | 'edit', layerId: string, featureId?: string) {
    if (mode == 'info' || mode == 'edit') {
      if (Object.keys(this.openedLayersModalsControl[mode]).includes(layerId.toString())) {
        // var index = Object.keys(this.openedLayersModalsControl.info['layerId']).findIndex(obj => obj['feature'] == layerId);
        this.openedLayersModalsControl[mode][layerId] = this.openedLayersModalsControl[mode][layerId].filter(e => e.idFeature != featureId);
        if (this.openedLayersModalsControl[mode][layerId].length == 0) {
          delete this.openedLayersModalsControl[mode][layerId];
        }
      }
      else {
        // console.log('Atenção aqui!')
      }
    }
    else {
      delete this.openedLayersModalsControl[mode][layerId];

    }
    // console.log(this.openedLayersModalsControl);
  }

  openGeneralFeatureInfo(item: mappingResultObject, zoomToFeature: boolean = false, typeOfDialog = 'info', panelClass: string[] = []) {

    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = false;
    dialogConfig.hasBackdrop = false;

    if (panelClass) panelClass.push('box-resizeble-container');
    else panelClass = ['box-resizeble-container'];
    panelClass.push('isfeModal');

    dialogConfig.panelClass = panelClass
    dialogConfig.data = { 'data': item, 'zoomToFeature': zoomToFeature, 'typeOfDialog': typeOfDialog } as dataToDialogInfoSearch;
    dialogConfig.enterAnimationDuration = 0;

    if (this.generalInfoDialog instanceof MatDialogRef && !this.setApplication.value.multipleISFEModal) {
      this.setCloseLayersModals(typeOfDialog as 'info' | 'search' | 'filter' | 'edit', item.layerId, item.pk_value?.toString())
      this.generalInfoDialog.close();
    }

    const modal = this.selecModal.getComponent(Number(item.layerId));
    var modalId = this.modalAlreadyOpended(typeOfDialog as 'info' | 'search' | 'filter' | 'edit', item.layerId, item.pk_value?.toString());
    if (!modalId) {
      // console.log('modal ainda não aberto')
      setTimeout(() => {
        dialogConfig.position = { top: this.dialogPositionGeneralInfo.top + 'px', left: this.dialogPositionGeneralInfo.left + 'px' };
        this.generalInfoDialog = this.dialog.open(modal, dialogConfig);
        this.setOpenLayersModals(typeOfDialog as 'info' | 'search' | 'filter' | 'edit', item.layerId, this.generalInfoDialog.id, item.pk_value?.toString(), item.geomFeature);

        this.generalInfoDialog.afterOpened().pipe(take(1)).subscribe(_ => {
          var modalElem = this.getOpenedModalId(this.generalInfoDialog.id)
          if (modalElem) {
            this.modalToTop(modalElem)
          }
          else {
          }
        })

      }, 100);
    }
    else {
      // console.log('modal já aberto')
      var modalElem = this.getOpenedModalId(modalId as string)
      setTimeout(_ => {
        if (modalElem) {
          this.triggerShake_beta(modalElem)
          this.modalToTop(modalElem)
        }
      }, 100)
      // if (modalElem) {
      //   console.log('c', modalElem)
      //   this.modalToTop(modalElem)
      // }
    }
  };

  triggerShake_beta(elem: Element) {
    this.renderer.addClass(elem, 'shake')
    setTimeout(() => {
      this.renderer.removeClass(elem, 'shake');
    }, 300);
  }

  anyISFEOpenedModal(): boolean {
    const elements = document.getElementsByClassName(
      'cdk-global-overlay-wrapper'
    );

    for (let i = 0; i < elements.length; ++i) {
      const el = elements[i];
      const children = el.children.item(0);
      // console.log('children', children)
      if (Array.from(children.classList).includes('isfeModal')) {
        return true;
      }
      else {
        return false;
      }
    }
  }

  modalAlreadyOpended(mode: string, layerId: string, feature: string): string | false {
    // console.log('openedLayersModalsControl', this.openedLayersModalsControl);
    try {
      var modeOfObject: { idFeature: string, geomFeature: Feature, idModal: string }[] | { idModal: string } = this.openedLayersModalsControl[mode][layerId]
    } catch (error) {
      return false;
    }

    // var modeOfObject: {idFeature: string, geomFeature: Feature, idModal: string}[] | string = this.openedLayersModalsControl[mode][layerId]
    if (!modeOfObject) {
      return false
    }
    else {
      if (!Array.isArray(modeOfObject)) {
        return modeOfObject.idModal
      }
      else if (Array.isArray(modeOfObject)) {
        var elem = modeOfObject.filter(e => e.idFeature == feature)[0]
        if (elem) {
          return elem.idModal
        }
        else {
          return false;
        }
      }
      else {
        console.log('Atenção aqui!')
      }
    }
  }

  getOpenedModalId(modalId: string): Element | false {
    const elements = document.getElementsByClassName(
      'cdk-global-overlay-wrapper'
    );
    for (let i = 0; i < elements.length; ++i) {
      const el = elements[i];
      el.children
      const children = el.children.item(0).children;
      var array = Array.from(children);
      var elem: Element = array.filter(e => e.id == modalId)[0];
      if (elem) break;
    }
    if (elem) {
      return elem;
    }
    else {
      return false;
    }
  }

  highligthFeatureFromModal(modalId: string) {
    var featureGeom: Feature
    for (let i of Object.keys(this.openedLayersModalsControl.info)) {
      var item = this.openedLayersModalsControl.info[i].filter(e => e.idModal == modalId);
      if (item.length > 0) {
        var featureGeom: Feature = item[0].geomFeature;
        this.highligthFeature(featureGeom, 'higthlihtInfo')
        break
      }
    }
    for (let i of Object.keys(this.openedLayersModalsControl.edit)) {
      var item = this.openedLayersModalsControl.edit[i].filter(e => e.idModal == modalId);
      if (item.length > 0) {
        var featureGeom: Feature = item[0].geomFeature;
        this.highligthFeature(featureGeom, 'higthlihtInfo')
        break
      }
    }
  }

  doShakeModal(wich: Element) {
    const elements = Array.from(document.getElementsByClassName('cdk-global-overlay-wrapper'));
    var filter = elements.filter(e => Array.from(e.children).some(z => Array.from(z.classList).includes('isfeModal')));

    for (let i = 0; i < filter.length; ++i) {
      const el = filter[i];
      var headerOthers = el.getElementsByClassName('modal-header')[0]
      this.renderer.removeClass(headerOthers, 'modal-header-focus');

      if (el.contains(wich)) {
        var headerWich = wich.getElementsByClassName('modal-header')[0]
        this.renderer.addClass(headerWich, 'modal-header-focus')

        this.highligthFeatureFromModal(el.children[0].children[1].id);

        const parent = el.parentNode;
        const last = parent.lastChild;
        if (last != el) {
          last.parentNode.insertBefore(el, last.nextSibling);
        }
      }
    }

  }

  modalToTop(wich: Element) {
    const elements = Array.from(document.getElementsByClassName('cdk-global-overlay-wrapper'));
    // var filter = elements.slice();
    var filter = elements.filter(e => Array.from(e.children).some(z => Array.from(z.classList).includes('isfeModal')));
    this.clearHighligthAllFeature('higthlihtInfo');

    for (let i = 0; i < filter.length; ++i) {
      const el = filter[i];
      var headerOthers = el.getElementsByClassName('modal-header')[0]
      this.renderer.removeClass(headerOthers, 'modal-header-focus');

      if (el.contains(wich)) {
        var headerWich = wich.getElementsByClassName('modal-header')[0]
        this.renderer.addClass(headerWich, 'modal-header-focus')

        this.highligthFeatureFromModal(el.children[0].children[1].id);

        const parent = el.parentNode;
        const last = parent.lastChild;
        if (last != el) {
          last.parentNode.insertBefore(el, last.nextSibling);
        }
      }
    }
  }

  open360image() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = false;
    dialogConfig.panelClass = 'custom-mat-dialog-panel-resume'
    dialogConfig.hasBackdrop = true;

    // dialogConfig.enterAnimationDuration = 0;

    // if (this.generalInfoDialog instanceof MatDialogRef) this.generalInfoDialog.close();

    // dialogConfig.position = { top: this.dialogPositionGeneralInfo.top + 'px', left: this.dialogPositionGeneralInfo.left + 'px' };
    this.dialog.open(TestPanoramaComponent, dialogConfig);

  }

  openResumeLayer(id: number) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = false;
    dialogConfig.hasBackdrop = true;
    dialogConfig.panelClass = 'custom-mat-dialog-panel-resume'
    dialogConfig.data = id;
    // dialogConfig.enterAnimationDuration = 0;

    // if (this.generalInfoDialog instanceof MatDialogRef) this.generalInfoDialog.close();

    // dialogConfig.position = { top: this.dialogPositionGeneralInfo.top + 'px', left: this.dialogPositionGeneralInfo.left + 'px' };
    this.generalInfoDialog = this.dialog.open(ModalResumeLayerComponent, dialogConfig);
  };

  setGoToCoords(on: boolean = true) {

    if (on) {
      const dialogConfig = new MatDialogConfig();
      dialogConfig.disableClose = false;
      dialogConfig.hasBackdrop = false;
      dialogConfig.panelClass = 'custom-mat-dialog-panel-go-to-coords'
      setTimeout(() => {
        dialogConfig.position = { top: this.dialogPositionGoToCoords.top + 'px', left: this.dialogPositionGoToCoords.left + 'px' };
        this.goToCoordsDialog = this.dialog.open(ModalGoToCoordsComponent, dialogConfig);
        // this.goToCoordsDialog.afterClosed().pipe(take(1)).subscribe(e => {this.goToCoordCloser.next(true)})
      }, 100);

    }
    else {
      if (this.goToCoordsDialog instanceof MatDialogRef) this.goToCoordsDialog.close();
      // Apagar feições da camada!
    }

  }


  setMeasureTool(on: boolean = true, multipleMeasure: boolean, type: string = 'Polygon') {
    this.map.getViewport().style.cursor = '';
    this.layersService.changeTipMeasureTool();
    this.map.removeInteraction(this.layersService.getModify());
    this.map.removeInteraction(this.layersService.measureTooldraw_l);
    this.map.removeInteraction(this.layersService.measureTooldraw_a);
    unByKey(this.measureToolDrawStart);
    unByKey(this.measureToolDrawEnd);
    this.setMainInfoFeaturesFunction();

    if (!multipleMeasure || !on) {
      this.clearMeasureToolVector();
    }

    if (on) {
      this.leaveMainInfoFeaturesFunction();

      this.map.getViewport().style.cursor = 'crosshair';
      this.map.addInteraction(this.layersService.getModify());
      if (type === 'LineString') {
        this.measureToolInteraction(this.layersService.measureTooldraw_l, multipleMeasure);
      }
      else {
        this.measureToolInteraction(this.layersService.measureTooldraw_a, multipleMeasure);
      }
    }

  }

  measureToolInteraction(draw: Draw, multipleMeasure: boolean) {
    this.measureToolDrawStart = draw.on('drawstart', () => {
      if (!multipleMeasure) {
        this.clearMeasureToolVector();
      }
      this.layersService.setModifyActive(false);
      this.layersService.changeTipMeasureTool('Clique para continuar medindo (duplo clique para finalizar)');
    });

    this.measureToolDrawEnd = draw.on('drawend', () => {
      this.layersService.setGeometryModifyStyle(true);
      this.layersService.setModifyActive(true);
      this.map.once('pointermove', () => {
        this.layersService.setGeometryModifyStyle(false);
      });
      this.layersService.changeTipMeasureTool('Clique para refazer a medição');
    });

    this.layersService.setModifyActive(true);
    this.map.addInteraction(draw);
  };

  clearMeasureToolVector() {
    this.layersService.measureToolvector.getSource().clear();
  }

  markersStreetView: google.maps.Marker[] = [];

  addStreetViewPoint(coords: Coordinate) {
    var markerPos = new google.maps.LatLng(coords[1], coords[0]);
    if (this.streetViewIsOpen$.value) {
      this.streetView.hideStreetView();
      this.streetViewIsOpen$.next(false);
    }


    // this.map.addControl(this.streetView);
    // pano.setPov({
    //   heading: 52,
    //   pitch: -12,
    // });
    this.streetViewIsOpen$.next(true);

    this.markersStreetView.push(
      new google.maps.Marker({
        position: markerPos,
        map: this.streetView.getStreetViewPanorama(),
        // icon: 'http://chart.apis.google.com/chart?chst=d_map_pin_icon&chld=star|FF0000',
        // title: 'Star',
        clickable: true
      })
    );
  }

  // Timeline modal
  timelineIsOpen$ = new BehaviorSubject<{ layerId: number, on: boolean }>({ layerId: 0, on: false });
  timelineIsOpen = this.timelineIsOpen$.asObservable();
  resetTimelineLayer(layer: TileLayer<any> | ImageLayer<any>) {
    layer.getSource().updateParams({ 'cql_filter': '' })
  }

  // IMAGENS DE DRONE 
  droneTiles: TileLayer<TileWMS>[] = []
  droneTileAdded: boolean[] = [];

  // Manipulação da legenda
  openLegend$ = new BehaviorSubject<undefined>(undefined);
  openLegend = this.openLegend$.asObservable();






  // |||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||||
  // Diocese based

  findLayerOfFeature(targetFeature: Feature): VectorLayer<any> {
    let foundLayer: VectorLayer<any> = null;
    this.map.getLayers().forEach(function (layer) {
      if (layer instanceof VectorLayer) {
        const source = layer.getSource();
        if (source && source.getFeatures().includes(targetFeature)) {
          foundLayer = layer;
          return false; // Break the loop
        }
      }
    });
    return foundLayer;
  }

}

