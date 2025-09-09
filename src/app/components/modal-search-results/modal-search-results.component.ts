import { Component, Inject, OnDestroy, ViewChild } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Feature } from 'ol';
import { mappingResultObject, responseGeoserver } from 'src/app/services/layers-management.service';
import TileLayer from 'ol/layer/Tile';
import { GeoService } from 'src/app/services/geo.service';
import { lastValueFrom } from 'rxjs';
import { ApisConectionService } from 'src/app/services/apis-conection.service';
import { features } from 'process';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-modal-search-results',
  templateUrl: './modal-search-results.component.html',
  styleUrls: ['./modal-search-results.component.css']
})
export class ModalSearchResultsComponent implements OnDestroy {


  displayedColumns;
  dataSource: MatTableDataSource<any>;
  fullscreen = false;
  pageSize;
  layer: TileLayer<any>;

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  // turnApplication: appConfig;
  // setApplicationSub: Subscription;

  constructor(private geoservice: GeoService, @Inject(MAT_DIALOG_DATA) private sourceData: { layerData: mappingResultObject, data: {}[], formatedKeys: {} }, public dialogRef: MatDialogRef<ModalSearchResultsComponent>, private apiConection: ApisConectionService) {

    // this.setApplicationSub = this.geoservice.setApplication.subscribe(e => {
    //   this.turnApplication = e;
    // });

    console.log('sourceData.data', this.sourceData.data)
    this.dataSource = new MatTableDataSource(this.sourceData.data);
    this.displayedColumns = Object.keys(this.sourceData.formatedKeys)
  }

  sortColumns(a: string, b: string) {
    if (a === 'gid' || a === 'gid') return -1
    if (b === 'gid' || b === 'gid') return 1

    if (a < b) return -1
    if (a > b) return 1
    return 0
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy(): void {
    // this.setApplicationSub.unsubscribe()
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim(); // Remove whitespace
    filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches
    this.dataSource.filter = filterValue;
  }

  applyFullscreen() {
    this.fullscreen = !this.fullscreen;
  }

  close() {
    this.dialogRef.close();
  }

  compileInfoFeature(featureInfo: responseGeoserver['features'][0]): mappingResultObject {
    var obj = {
      layerId: this.layer.get('id'),
      layerName: this.layer.get('name'),
      fonteGS_front: this.layer.get('fonteGS_front'),
      fonteGS_back: this.layer.get('fonteGS_back'),
      pk_name: this.layer.get('pk_name'),
      pk_value: featureInfo.properties[this.layer.get('pk_name')],
      geomFeature: new Feature({ geometry: new this.geoservice.geomTypes[featureInfo.geometry['type']](featureInfo.geometry['coordinates']) }),
      nameFeature: undefined
    }
    return obj
  }

  async apply(row) {
    this.sourceData.layerData['pk_value'] = row[this.sourceData.layerData.pk_name]

    var layerSource = this.sourceData.layerData.fonteGS_back ? this.sourceData.layerData.fonteGS_back : this.sourceData.layerData.fonteGS_front;
    var cql_filter = `"${this.sourceData.layerData.pk_name}"=${this.sourceData.layerData.pk_value}`
    var result = await lastValueFrom(this.apiConection.doSearchFromCQLFilter(layerSource, cql_filter));

    if (result.features.length == 1) {
      var feature = result.features[0]
      this.sourceData.layerData['geomFeature'] = new Feature({ geometry: new this.geoservice.geomTypes[feature.geometry['type']](feature.geometry['coordinates']) })
    }
    else {
      console.log('Atenção aqui!')
    }
    this.geoservice.openGeneralFeatureInfo(this.sourceData.layerData, true);
    this.close();
  }

}
