import { AfterViewInit, Component, OnDestroy, ViewChild } from '@angular/core';
import { FormArray } from '@angular/forms';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ToastContainerDirective, ToastrService } from 'ngx-toastr';
import Feature from 'ol/Feature';
import LayerGroup from 'ol/layer/Group';
import ImageLayer from 'ol/layer/Image';
import TileLayer from 'ol/layer/Tile';
import { lastValueFrom, Subscription } from 'rxjs';
import { ModalSearchResultsComponent } from 'src/app/components/modal-search-results/modal-search-results.component';
import { ApisConectionService } from 'src/app/services/apis-conection.service';
import { GeoService } from 'src/app/services/geo.service';
import { InfoSearchFilterService } from 'src/app/services/info-search-filter.service';
import { mappingResultObject, responseGeoserver } from 'src/app/services/layers-management.service';

import { objCompiled, optionSearch } from 'src/modules/search-config';
import { SearchConfig } from 'src/modules/search-config';

// export interface optionSearch {
//   id: string;
//   layerName: string,
//   source: string,
//   colNamesToReturn: string[],
//   placeholder: string,
//   getCQLFilter: Function
// }

// export interface objCompiled {
//   cqlFilter: string, 
//   colName: string,
//   wordTranslated: string;
// }


@Component({
  selector: 'app-search-toolbar',
  templateUrl: './search-toolbar.component.html',
  styleUrls: ['./search-toolbar.component.css']
})
export class SearchToolbarComponent implements AfterViewInit, OnDestroy {

  @ViewChild(ToastContainerDirective)
  toastContainer: ToastContainerDirective;

  searchWord: string;
  isLoading: boolean = false;
  tableData: responseGeoserver['features'];
  tableHeader: string[];
  colNames: object;
  layerTarget: ImageLayer<any> | TileLayer<any>;

  // optionsToSearch: optionSearch[] = [
  //   {
  //     id: '8',
  //     layerName: 'Imóveis',
  //     source: 'pmspwebgeo:imoveis',
  //     colNamesToReturn: ['gid_imovel,cod_imovel,ic_imovel'],
  //     placeholder: 'Cód. reduzido ou inscrição cadastral',
  //     getCQLFilter: (): objCompiled => { return this.getCQLFilterImoveis() }
  //   },
  //   {
  //     id: '19',
  //     layerName: 'Vias',
  //     source: 'pmspwebgeo:vias_geom_geoserver',
  //     colNamesToReturn: ['gid,tipo,nome'],
  //     placeholder: 'Nome do logradouro (sem número)',
  //     getCQLFilter: (): objCompiled => { return this.getCQLFilterVias() }
  //   }
  // ]
  // optionSelected = this.optionsToSearch[0];

  optionsToSearch: optionSearch[];
  //  = new SearchConfig().optionsToSearch

  optionSelected: optionSearch
  //  = this.optionsToSearch[0];
  idSelected: number
  // = this.optionSelected.id;
  setApplicationSub: Subscription;
  insertSecondaryLayers: boolean;

  constructor(private apiConection: ApisConectionService, private geoservice: GeoService, private toastr: ToastrService, private dialog: MatDialog) {
    this.setApplicationSub = this.geoservice.setApplication.subscribe(e => {
      this.insertSecondaryLayers = e.mainLayer ? false : true;
      this.optionsToSearch = new SearchConfig().optionsToSearch.filter(o => e.search.includes(o.id))
      this.optionsToSearch.sort((a, b) => { return e.search.indexOf(a.id) - e.search.indexOf(b.id); })
      this.optionSelected = this.optionsToSearch[0];
      if (this.optionSelected) this.idSelected = this.optionSelected.id
    })
  }
  ngOnDestroy(): void {
    this.setApplicationSub.unsubscribe();
  }

  onChange() {
    // console.log(this.idSelected);
    this.optionSelected = this.optionsToSearch.filter(e => e.id == this.idSelected)[0]
    // console.log(this.optionSelected);
  }

  ngAfterViewInit(): void {
    // this.toastr.overlayContainer = this.toastContainer;
  }

  compileInfoFeature(featureInfo: responseGeoserver['features'][0]) {
    var obj = {
      layerId: this.layerTarget.get('id'),
      layerName: this.layerTarget.get('name'),
      fonteGS_front: this.optionSelected.source,
      fonteGS_back: this.layerTarget.get('fonteGS_back'),
      pk_name: this.layerTarget.get('pk_name'),
      pk_value: featureInfo.properties[this.layerTarget.get('pk_name')],
      geomFeature: new Feature({ geometry: new this.geoservice.geomTypes[featureInfo.geometry['type']](featureInfo.geometry['coordinates']) }),
      nameFeature: undefined
    }
    return obj
  }

  async compileApelidos(featureExemple: mappingResultObject) {
    var result = await lastValueFrom(this.apiConection.getColumnsApelidoFromPG_beta(featureExemple.layerId));
    this.colNames = Object.keys(result).reduce((obj, key) => { obj[key] = result[key].apelido; return obj; }, {});
    // this.colNames = await lastValueFrom(this.apiConection.getColumnsApelidoFromPG(featureExemple.layerId));
  }

  async compileApelidos_beta(featureExemple: mappingResultObject) {
    var result = await lastValueFrom(this.apiConection.getColumnsApelidoFromPG_beta(featureExemple.layerId));
    return Object.keys(result).reduce((obj, key) => { obj[key] = result[key].apelido; return obj; }, {});
  }

  async openTableResult(obj, data: responseGeoserver) {
    await this.compileApelidos(obj);
    this.tableData = data.features;
    this.tableData.map(e => e['obj'] = this.compileInfoFeature(e));
    this.tableHeader = Object.keys(this.tableData[0].properties).filter(e => Object.keys(this.colNames).includes(e))
  }

  getLayer(whichTable: number): TileLayer<any> {
    var idLayer = (whichTable === 1 || whichTable === 2) ? 8 : 19;  // ATENÇÃO AQUI!!!! ID da tebela layer_catalog do banco
    var layer = this.geoservice.map.getLayers().getArray().filter(e => e.get('id') === idLayer)[0] as TileLayer<any>;

    // Caso a camada de busca não esteja no mapa, a insere
    if (!layer) {
      var item = this.geoservice.treeData.filter(e => e.item.id === idLayer)[0].item;
      this.geoservice.addLayerToMapAndSidebar(item);
      var layer = this.geoservice.map.getLayers().getArray().filter(e => e.get('id') === idLayer)[0] as TileLayer<any>;
      this.toastr.info(`A camada '${layer.get('name')}' foi inserida no mapa`, undefined, { progressBar: true, timeOut: 2500, positionClass: 'inline' });
    }

    if (layer instanceof LayerGroup) layer = layer.getLayers().getArray()[0] as TileLayer<any>;
    return layer
  }

  showResult(data: responseGeoserver, whichTable: number, word?: string, wordList?: string[]) {
    //  Nenhum resultado encontrado
    if (data.features.length === 0) {
      this.toastr.error('Nenhum resultado encontrado', undefined, { progressBar: true, timeOut: 5000, positionClass: 'inline' });
    }
    // Algum resultado encontrado
    else {
      this.layerTarget = this.getLayer(whichTable);
      var obj = this.compileInfoFeature(data.features[0]);

      // Caso o resultado da busca retone apenas 1 valor 
      if (data.features.length === 1) {

        this.geoservice.openGeneralFeatureInfo(obj, true);
      }
      else if (data.features.length > 1) {

        // Avaliar se o retorno apresenta resultado com valor exatamente igual ao pesquisado
        if (whichTable === 1) {
          var exact = data.features.filter(e => e.properties['cod_imovel'] === word)
          if (exact.length === 1) {
            var obj = this.compileInfoFeature(exact[0]);
            this.geoservice.openGeneralFeatureInfo(obj, true);
          }
          else this.openTableResult(obj, data);
        }
        else if (whichTable === 2) {
          var exact = data.features.filter(e => e.properties['ic_imovel'] === word)
          if (exact.length === 1) {
            var obj = this.compileInfoFeature(exact[0]);
            this.geoservice.openGeneralFeatureInfo(obj, true);
          }
          else this.openTableResult(obj, data);
        }
        else {
          var exact = data.features.filter(e => e.properties['nome'].replaceAll('.', '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() === word);
          exact = exact.filter(e => e.properties['tipo'].replaceAll('.', '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() === wordList[0].replaceAll('.', '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase());
          if (exact.length === 1) {
            var obj = this.compileInfoFeature(exact[0]);
            this.geoservice.openGeneralFeatureInfo(obj, true);
          }
          else this.openTableResult(obj, data);
        }
      }

    }
    this.isLoading = false;
  }

  getLayer_beta(): ImageLayer<any> {
    var idLayer = this.optionSelected.id
    var layer: ImageLayer<any> = this.geoservice.map.getLayers().getArray().filter(e => e.get('id') === Number(idLayer))[0] as ImageLayer<any>

    // Caso a camada de busca não esteja no mapa, a insere
    if (!layer) {
      var item = this.geoservice.treeData.filter(e => e.item.id === Number(idLayer))[0].item;
      layer = this.geoservice.layerList.filter(e => e instanceof ImageLayer).filter(e => e.get('id').toString() === idLayer.toString())[0] as ImageLayer<any>;
      if (this.insertSecondaryLayers) {
        this.geoservice.addLayerToMapAndSidebar(item)
        this.toastr.info(`A camada '${layer.get('name')}' foi inserida no mapa`, undefined, { progressBar: true, timeOut: 2500, positionClass: 'inline' });
      }
    }

    if (layer instanceof LayerGroup) {
      layer = layer.getLayers().getArray()[0] as ImageLayer<any>;
    }
    return layer
  }


  async openSearchResultDialog(result: responseGeoserver, data: mappingResultObject) {

    var formatKeysOriginal = await this.compileApelidos_beta(data)
    var items = result.features.map(e => e.properties)
    var formatKeysOriginal = Object.keys(formatKeysOriginal).filter(e => Object.keys(items[0]).includes(e)).reduce((obj, key) => { obj[key] = formatKeysOriginal[key]; return obj; }, {});
    const sortedKeys = Object.keys(formatKeysOriginal).sort((keyA, keyB) => {
      return this.optionSelected.colNamesToReturn.indexOf(keyA) - this.optionSelected.colNamesToReturn.indexOf(keyB);
    });
    const formatKeys = {};
    sortedKeys.forEach(key => {formatKeys[key] = formatKeysOriginal[key]});

    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = false;
    dialogConfig.hasBackdrop = true;
    dialogConfig.maxWidth = '100vw';
    dialogConfig.data = { layerData: data, data: items, formatedKeys: formatKeys }

    console.log('Abrindo ModalSearchResultsComponent:')
    console.log('data: ', items)
    this.dialog.open(ModalSearchResultsComponent, dialogConfig);

  }

  showResult_beta(data: responseGeoserver, objCompiled: objCompiled) {
    //  Nenhum resultado encontrado
    if (data.features.length === 0) {
      console.log('Nenhum resultado encontrado')
      this.toastr.error('Nenhum resultado encontrado', undefined, { progressBar: true, timeOut: 5000, positionClass: 'toast-bottom-center' });
    }
    // Algum resultado encontrado
    else {
      // console.log('Algum resultado encontrado')
      this.layerTarget = this.getLayer_beta();
      var obj = this.compileInfoFeature(data.features[0]);

      // Caso o resultado da busca retorne apenas 1 valor 
      if (data.features.length === 1) {
        // console.log('Caso o resultado da busca retorne apenas 1 valor ')
        this.geoservice.openGeneralFeatureInfo(obj, true);
      }
      else if (data.features.length > 1) {
        // console.log('Caso o resultado da busca retorne mais de 1 valor ')
        var exact = data.features.filter(e => e.properties[objCompiled.colName].replaceAll('.', '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() === objCompiled.wordTranslated)

        let isnum = /^\d+$/.test(objCompiled.wordTranslated);
        if (exact.length === 1 && isnum) {
          var obj = this.compileInfoFeature(exact[0]);
          this.geoservice.openGeneralFeatureInfo(obj, true);
        }
        else {
          // console.log('Abrir dialogo de resultados')
          this.openSearchResultDialog(data, obj as mappingResultObject);
          // this.openTableResult(obj, data);
        }

      }

    }
    this.isLoading = false;
  }

  // tratarBuscaLogradouro(str: string) {
  //   var strNew = str.split(' ');

  //   var values = ['rua', 'av', 'avenida', 'alameda', 'al', 'via', 'est', 'estrada', 'viela', 'ponte', 'pça', 'praça', 'lgo', 'largo', 'calçada', 'calc']
  //   if (strNew.length > 1 && values.includes(strNew[0].replaceAll('.', '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase())) {
  //     return [strNew[0], strNew.slice(1,).join(' ')];
  //   }
  //   else return [str]
  // }

  // getCQLFilterImoveis(): objCompiled {
  //   var colName: string
  //   let isnum = /^\d+$/.test(this.searchWord);

  //   if (this.searchWord.length <= 6) {
  //     colName = 'cod_imovel';
  //   }
  //   else {
  //     colName = 'ic_imovel';
  //   }

  //   if (!isnum) {
  //     var cql = '1=2' // Forçar o retorno sem feições provocado pelo CQL Filter
  //   }
  //   else {
  //     var cql = colName + " LIKE '" + + this.searchWord + encodeURIComponent("%'")
  //   }
  //   return { cqlFilter: cql, colName: colName, wordTranslated: this.searchWord };
  // }

  // getCQLFilterVias(): objCompiled {
  //   var word = this.searchWord.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  //   var wordsList = this.tratarBuscaLogradouro(word);
  //   word = wordsList.length === 1 ? wordsList[0] : wordsList[1];

  //   var col = 'nome'

  //   var cql = 'strStripAccents(strToLowerCase(' + col + ')) LIKE ' + encodeURIComponent("'%") + word + encodeURIComponent("%'");

  //   return { cqlFilter: cql, colName: col, wordTranslated: word }
  // }

  getMappedResultObj(): mappingResultObject {
    return {
      layerId: this.layerTarget.get('id'),
      layerName: this.layerTarget.get('name'),
      fonteGS_front: this.layerTarget.get('fonteGS_front'),
      fonteGS_back: this.layerTarget.get('fonteGS_back'),
      pk_name: this.layerTarget.get('pk_name'),
      pk_value: null,
      geomFeature: null,
      nameFeature: null
    }
  }

  async doSearch_beta() {
    this.resetSearch();
    this.searchWord = this.searchWord.trim().replaceAll('.', '').replaceAll('  ', ' ');
    if (!this.searchWord || this.searchWord === '') return;

    this.isLoading = true;
    var word = this.searchWord.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

    var objCompiled = this.optionSelected.getCQLFilter(word)
    var cqlFilter: string = objCompiled.cqlFilter
    var layerName = this.optionSelected.source
    var colNames = this.optionSelected.colNamesToReturn
    var result = await lastValueFrom(this.apiConection.doSearchFromCQL(layerName, cqlFilter, colNames));

    this.showResult_beta(result, objCompiled);
  }

  // async doSearch() {
  //   this.resetSearch();
  //   this.searchWord = this.searchWord.trim().replaceAll('.', '').replaceAll('  ', ' ');
  //   if (!this.searchWord || this.searchWord === '') return;

  //   this.isLoading = true;
  //   var word = this.searchWord.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  //   let isnum = /^\d+$/.test(this.searchWord);
  //   var whichTable: number;

  //   if (isnum) {
  //     if (this.searchWord.length <= 6) {
  //       whichTable = 1;
  //     }
  //     else {
  //       whichTable = 2;
  //     }
  //     var result = await lastValueFrom(this.apiConection.doSearchFromWord(whichTable, word));
  //     this.showResult(result, whichTable, word);
  //   }
  //   else {
  //     whichTable = 3
  //     var wordsList = this.tratarBuscaLogradouro(word);
  //     var word = wordsList.length === 1 ? wordsList[0] : wordsList[1];
  //     var result = await lastValueFrom(this.apiConection.doSearchFromWord(whichTable, word));
  //     this.showResult(result, whichTable, word, wordsList);
  //   }
  // }

  onKeyup(event: KeyboardEvent) {
    const key = event.keyCode || event.charCode;
    if (key === 13) {               // enter (cr)
      this.doSearch_beta();
    } else if (
      key === 8 || key === 46 ||    // backspace or delete
      (key === 8 && 17) ||          // backspace + ctrl
      (key === 8 && 16) ||          // backspace + shift
      (key === 46 && 17)            // delete + ctrl
    ) {
      if (this.searchWord?.length === 0) {
        this.resetSearch();
        this.clearSearch();
      }
    }
  }

  resetSearch() {
    // this.dialog.closeAll();
    this.toastr.clear();
    this.tableData = undefined;
  }

  clearSearch() {
    this.resetSearch();
    this.searchWord = undefined;
  }


  getMatTooltip(term: string, limit: number): string {
    if (term) return term.length > limit ? term : undefined;
    else return undefined;
  }

  onTableClick(obj: mappingResultObject) {
    this.geoservice.openGeneralFeatureInfo(obj, true);
    this.resetSearch();
  }

}
