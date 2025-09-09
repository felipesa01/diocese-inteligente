import { Component, Inject, OnInit, ViewChild, viewChild } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ApisConectionService, dataToDialogInfoSearch, objGeneralToSpecific } from 'src/app/services/apis-conection.service';
import { GeoService } from 'src/app/services/geo.service';
import { LayersManagementService } from 'src/app/services/layers-management.service';
import Map from 'ol/Map';
import { Collection, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import { Vector as VectorS } from 'ol/source';
import Vector from 'ol/layer/Vector';
import { defaults } from 'ol/control';
import { from, interval, lastValueFrom, take } from 'rxjs';
import { Stroke, Style } from 'ol/style';
import LayerGroup from 'ol/layer/Group';
import { FormGroup } from '@angular/forms';
import { InfoSearchFilterService, typeMapper } from 'src/app/services/info-search-filter.service';
import ImageLayer from 'ol/layer/Image';
import { AuthService } from 'src/app/services/auth.service';
import { NgbNav } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-modal-info-imoveis',
  templateUrl: './modal-info-imoveis.component.html',
  styleUrls: ['./modal-info-imoveis.component.css']
})
export class ModalInfoImoveisComponent implements OnInit {

  colorValues = {
    'Parcelamento': '#80b1d3',
    'Gleba': '#db9907',
    'Usucapião': '#b349aa',
    'Desapropriação': '#4e954e'
  }

  @ViewChild('navCustom') nav: NgbNav;
  tabCadastroAtiva: string = 'tab_ficha';
  mapperNameTab = {
    'tab_divida': { nome: 'Dívida', disabled: true },
    'tab_bic': { nome: 'BIC', disabled: true },
    'tab_ficha': { nome: 'Ficha cadastral', disabled: false },
  }


  idDaCamadaZonemento = 109 // Atenção aqui id definido manualmente do banco


  dataFromGeneral: objGeneralToSpecific;
  keysCadastro: string[];
  keys_publicos: string[];
  keysDivida: string[];
  typeMapper = typeMapper;

  searchIsLoading = false;

  vectorLayer = new Vector({ source: new VectorS({}), style: new Style({ stroke: new Stroke({ width: 2, color: 'blue' }) }) });

  map = new Map({
    layers: [],
    interactions: new Collection(),
    view: new View({
      projection: 'EPSG:4326',
      center: [-46.9212, -23.448],
      zoom: 11,
    }),
    controls: defaults({
      attribution: false,
      zoom: true,
    })
  })

  zoneamentoLayer: TileLayer<any> | LayerGroup | ImageLayer<any>;
  zoomedToFeature: boolean = false;

  constructor(private geoservice: GeoService, private layersService: LayersManagementService, private apiConnection: ApisConectionService, public isfeService: InfoSearchFilterService, @Inject(MAT_DIALOG_DATA) public dataObj: dataToDialogInfoSearch, private authService: AuthService) {

    // Caso a modalidade seja "info", dispara o carregamento do zoneamento.
    if (this.dataObj.typeOfDialog == 'info') this.start();
  }

  async start() {
    var result = await lastValueFrom(from(this.layersService.getLayersFromPG(this.idDaCamadaZonemento)));
    this.zoneamentoLayer = result[0];
    this.map.addLayer(this.zoneamentoLayer);
    this.vectorLayer.getSource().addFeature(this.dataObj.data.geomFeature);
    this.map.addLayer(this.vectorLayer);
  }

  ngOnInit() { }

  profileForm: FormGroup<any>;
  formatedKeys: {};
  typeMode: objGeneralToSpecific['typeMode'];
  layerSource: string;
  isZeroInfo: boolean;
  setDataFromGeneral(e: objGeneralToSpecific) {
    this.dataFromGeneral = e;
    this.typeMode = e.typeMode;
    this.formatedKeys = e.formatedKeys;
    this.layerSource = e.layerSource;
    // console.log(this.dataFromGeneral)

    // this.isZeroInfo = Object.values(this.dataFromGeneral.dataOrForm).some(item => item) ? false : true;

    if (this.typeMode == 'info') {
      const removeKeys = ['dominialid', 'origem', 'modalidade', 'reurb', 'usucapiao', 'geom_redun', 'fonte_geo'];
      const removeKeysDivida = ['execucao', 'divida', 'parcelamento'];

      this.keysCadastro = Object.keys(this.dataFromGeneral.dataOrForm).filter(e => !removeKeys.includes(e) && !removeKeysDivida.includes(e) && !e.startsWith('b_'));
      this.keys_publicos = Object.keys(this.dataFromGeneral.dataOrForm).filter(e => e.startsWith('b_'));
      this.keysDivida = Object.keys(this.dataFromGeneral.dataOrForm).filter(e => removeKeysDivida.includes(e));

      this.isZeroInfo = this.keysCadastro.map(key => this.dataFromGeneral.dataOrForm[key]).some(item => item) ? false : true;

      this.canViewDivida();
      this.canViewBIC();
    }
    else if ((this.typeMode == 'search' || this.typeMode == 'filter' || this.typeMode == 'edit') && e.dataOrForm instanceof FormGroup) {
      this.profileForm = e.dataOrForm
      this.keys_publicos = Object.keys(e.formatedKeys).filter(e => e.startsWith('b_'));
      // console.log(this.profileForm)
    }

  }

  // dividaDisabled = true;
  async canViewDivida() {
    var tela = this.dataFromGeneral.telasGsu['divida']
    if (tela) {
      var telasGSU = await lastValueFrom(this.authService.getTelasGSU())
      var valor = telasGSU.filter(t => t.ID_Tela == tela)[0]
      if (valor && valor.IC_Listar == 'S') {
        // this.dividaDisabled = false;
        this.mapperNameTab.tab_divida.disabled = false;
      }
    }
  }

  // BICDisabled = true;
  async canViewBIC() {
    var tela = 17520 // Atenção aqui, numero fixo do GSU!!
    if (tela) {
      var telasGSU = await lastValueFrom(this.authService.getTelasGSU())
      var valor = telasGSU.filter(t => t.ID_Tela == tela)[0]
      if (valor && valor.IC_Listar == 'S') {
        this.mapperNameTab.tab_bic.disabled = false;
      }
    }
  }

  get canViewZoneamento(): boolean {
    if (this.geoservice.layerList.filter(e => e.get('id') === this.idDaCamadaZonemento)[0]) {
      return true
    }
    else {return false}
     
  }

  openInfoAreaUnidadeAutoma() { }

  openUrlMarcoLegal() {

    window.open(this.dataFromGeneral.dataOrForm['b_ml_url'], "_blank");

    // const dialogConfig = new MatDialogConfig();
    // dialogConfig.disableClose = true;
    // dialogConfig.hasBackdrop = false;
    // dialogConfig.data = {
    //   title: this.dataFromGeneral.dataOrForm['b_m_legal'],
    //   html: this.sanitized.bypassSecurityTrustHtml(`<div style="resize: both; overflow: auto; height: 80vh; width: 40vw;"> <iframe src="${this.dataFromGeneral.dataOrForm['b_ml_url']}" name="myIframe" class="w-100 h-100 d-flex"></iframe></div>`)
    // };
    // this.dialog.open(ModalGenericHTMLComponent, dialogConfig);

  }

  extent(map: Map) {
    const intvl = interval(1000).pipe(take(5));
    intvl.subscribe(() => {
      if (!this.zoomedToFeature) {
        try {
          map.getView().fit(this.vectorLayer.getSource().getFeatures()[0].getGeometry().getExtent(), { size: this.map.getSize(), padding: Array(4).fill(50), duration: 800 });
          var source;
          if (this.zoneamentoLayer instanceof TileLayer || this.zoneamentoLayer instanceof ImageLayer) {
            source = this.zoneamentoLayer.getSource()
          }
          else {
            source = (this.zoneamentoLayer.getLayers().getArray() as ImageLayer<any>[])[0].getSource()
          }
          source.updateParams({ 'TIMESTAMP': new Date().getTime() });
          this.zoomedToFeature = true;
        } catch (e) {
          console.log(e)
        }
      }
    })

  }

  setTarget() {

  }

  select_tab(tab: string) {
    this.tabCadastroAtiva = tab;
    this.nav.select(tab);
  }

  zonasResults;
  async getZonas() {
    if (!this.zoomedToFeature) {
      this.extent(this.map);

      var layer = this.geoservice.layerList.filter(e => e.get('id') === this.idDaCamadaZonemento)[0];

      if (layer) {
        var query = "querySingle('" + this.dataObj.data.fonteGS_front + "', 'geom','" + this.dataObj.data.pk_name + " = " + this.dataObj.data.pk_value + "')"
        var results = await lastValueFrom(this.apiConnection.getZonasIntersectsPolygon(query, layer.get('fonteGS_front')));
        this.zonasResults = results.features;
        this.dataObj.data.layerId
        setTimeout(() => this.map.setTarget(`map_zoneamento_${this.dataObj.data.layerId}_${this.dataObj.data.pk_value}`), 1);
      }
    }
  }


  setValue(key: string, value: { main: string | boolean, second: string }) {
    // console.log(key, value);

    this.profileForm.get(`${key}.value`).setValue({ main: value['main'], second: value['second'] });

    // Mudar predicado em caso de inserção de valor pesquisável
    if ((value.main || value.second) && this.profileForm.get(`${key}.mode`).value == 0) {
      var type = this.profileForm.get(`${key}.type`).value
      this.profileForm.get(`${key}.mode`).setValue(typeMapper[type].default);
    }
    else if ((typeof value.main == 'string' && value.main == '') || !value) {
      this.profileForm.get(`${key}.mode`).setValue(0);
    }
  }

  clearFilter() {
    this.isfeService.clearFilter(Number(this.dataObj.data.layerId))

    Object.keys(this.profileForm.controls).forEach(key => {
      this.profileForm.get(`${key}.mode`).setValue(0);
      this.profileForm.get(`${key}.value`).setValue({ main: null, second: null });
    })
  }

  isSearchable() {
    return Object.keys(this.profileForm.controls).map(e => this.profileForm.controls[e].value.value).some(e => e != null && e != '' ? true : false)
  }

  async onSubmit() {

    var cqlResult = this.isfeService.createCqlFilter(this.profileForm, this.dataObj.typeOfDialog)

    if (this.dataObj.typeOfDialog == 'search') {
      this.searchIsLoading = true;
      var layerSource = this.dataObj.data.fonteGS_back ? this.dataObj.data.fonteGS_back : this.dataObj.data.fonteGS_front
      await this.isfeService.applySearch(layerSource, cqlResult.cqlStr, this.dataObj.data, this.formatedKeys)
      this.searchIsLoading = false;
    }
    else if (this.dataObj.typeOfDialog == 'filter') {
      // console.log(cqlResult);
      this.isfeService.applyFilter(Number(this.dataObj.data.layerId), cqlResult.cqlStr, cqlResult.filtersStorage)
    }
  }


}
