import { Injectable, isDevMode } from '@angular/core';
import { lastValueFrom, map, merge, mergeMap, Observable, of } from 'rxjs';
import { mappingResultObject, responseGeoserver, responseGeoserverPlus } from './layers-management.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import TileLayer from 'ol/layer/Tile';
import { XYZ } from 'ol/source';
import OsmSource from 'ol/source/OSM';
import LayerGroup from 'ol/layer/Group';
import * as moment from 'moment-timezone';
import { FormGroup } from '@angular/forms';
import ImageLayer from 'ol/layer/Image';
import { AuthService } from './auth.service';
import { Modify } from 'ol/interaction';
import { copyFileSync } from 'fs';
import { supportsScrollBehavior } from '@angular/cdk/platform';

export interface mainAPIFileItem {
  ID_Arquivo: number,
  ID_Sistema: number,
  ID_ArquivoTipo: number,
  BIN_Arquivo?: string,
  NM_Arquivo: string,
  SG_ArquivoExtensao: string,
  TOT_ArquivoTamanhoMB: number
}

export interface mainAPIObject {
  Success: boolean,
  Data: { RowsFound: number, Rows: any[] },
  Messages?: string
}

export interface mainAPIObjectPut {
  Success: boolean,
  Data: { RowsAffected: number, Ids: number[] } | {},
  Messages?: string,
  ErrorId?: string
}

export interface telaGSU {
  ID_Tela: number,
  DS_Tela: string,
  DS_ServerInterno: string,
  DS_ServerExterno: string,
  DS_Url: string,
  NUM_ParamReport: number,
  DS_Button: string,
  DS_Menu: string,
  ID_Perfil: number,
  DS_Perfil: string,
  ID_Funcao: number,
  IC_Listar: "S" | "N",
  IC_Incluir: "S" | "N",
  IC_Alterar: "S" | "N",
  IC_Excluir: "S" | "N",
  IC_Gerar: "S" | "N",
  IC_Consultar: "S" | "N",
  IC_Imprimir: "S" | "N",
  IC_Tramitar: "S" | "N",
  IC_TramitarNivel: string,
  ID_Sistema: number,
  SG_Sistema: string,
  ID_Usuario: number,
  COD_Prontuario: number,
  NM_Usuario: string,
  DS_Email: string,
  NUM_Rg: string,
  DS_ComplRg: string,
  DS_Login: string,
  ID_NPD: number,
  NM_NPD: string,
  ID_Unidade: number,
  DS_Unidade: string,
  ID_Secretaria: number,
  DS_Secretaria: string,
  ID_UsuXUnidXPerfil: number
}

export interface telasGSUFinal {
  ID_Tela: number,
  DS_Tela: string,
  IC_Listar: "S" | "N",
  IC_Incluir: "S" | "N",
  IC_Alterar: "S" | "N",
  IC_Excluir: "S" | "N",
  IC_Gerar: "S" | "N",
  IC_Consultar: "S" | "N",
  IC_Imprimir: "S" | "N",
}

export interface telasGSUResponse extends mainAPIObject {
  Data: { RowsFound: number, Rows: telaGSU[] },
}

export interface responseGSDescribeFeatureType {
  elementFormDefault: string,
  targetNamespace: string,
  targetPrefix: string,
  featureTypes: {
    typeName: string,
    properties: {
      name: string,
      maxOccurs: number,
      minOccurs: number,
      nillable: boolean,
      type: string,
      localType: string
    }[]
  }[]
}

export interface wfsResponse {
  crs: string,
  features: { geometry: string, id: string, properties: {}, type: string }[],
  numberMatched: number,
  numberReturned: number,
  timeStamp: string,
  totalFeatures: number,
  type: string
}


export interface dataToDialogInfoSearch {
  data: mappingResultObject,
  zoomToFeature: boolean,
  typeOfDialog: 'info' | 'search' | 'edit' | 'filter'
}

export interface objGeneralToSpecific {
  layerSource: string,
  dataOrForm: { [key: string]: string } | FormGroup<any>,
  telasGsu?: { [key: string]: number },
  formatedKeys: {},
  typeMode: dataToDialogInfoSearch['typeOfDialog'],
  dataFull: dataToDialogInfoSearch
}

export interface attributesFromPg {
  [key: string]: {
    apelido: string;
    mapavalor: boolean;
    valor: string | number;
    telaGSU: number | undefined;
  }
}

export interface objBodyUpdate {
  gid: number,
  identifierName: string,
  identifierValue: string,
  fields: { name: string, value: string | null }[]
}

@Injectable({
  providedIn: 'root'
})
export class ApisConectionService {

  mainApiURL: string = isDevMode() ? '/SisGeo-API/' : this.auth.intranetURL + 'SisGeo-API/';
  geoserverURL: string = this.mainApiURL + 'geoserver/'

  constructor(private http: HttpClient, private auth: AuthService) { }

  getLayerCatalog_beta(): Observable<any[]> {

    return this.auth.getTelasGSU().pipe(
      map(data => { return data }),
      mergeMap<telaGSU[], Observable<any>>(telasGSU => {

        return this.http.get<mainAPIObject>(this.mainApiURL + 'layers-catalog').pipe(
          map(data => {
            if (data.Success) {
              // return data.Data.Rows.filter(e => telasGSU.some(tela => tela.ID_Tela == e['tela_gsu']));
              // console.log('data.Data.Rows', data.Data.Rows.map(e => e['telas_gsu']))
              // console.log(telasGSU)

              return data.Data.Rows.filter(e => e['telas_gsu']).filter(e => telasGSU.some(tela => e['telas_gsu'].includes(tela.DS_Tela) && tela.IC_Listar == 'S'));
            }
            else {
              return [];
            }
          })
        )
      })
    )
  }

  getLayerCatalog(): Observable<any[]> {
    return this.http.get<mainAPIObject>(this.mainApiURL + 'layers-catalog').pipe(
      map(data => {
        if (data.Success) {
          return data.Data.Rows;
        }
        else {
          return [];
        }
      })
    )
  }

  getLayerInfo(id: number): Observable<{}> {
    return this.http.get<mainAPIObject>(this.mainApiURL + 'layers-catalog/' + id.toString()).pipe(
      map(data => {
        if (data.Success) {
          return data.Data.Rows[0];
        }
        else {
          return [];
        }
      })
    )


  }

  // getAttributesFromPg(data: { layerId: string, pk_name: string, pk_value: number }): Observable<{}> {
  //   // var layerAjust = data.fonteGS_front.split(':')[1]

  //   return this.http.get<mainAPIObject>(this.mainApiURL + 'layers-catalog/all-attributes-from-layer/' + data.layerId + '/' + data.pk_name + '=' + data.pk_value).pipe(
  //     map(data => {
  //       if (data.Success) {
  //         return data.Data.Rows[0];
  //       }
  //       else {
  //         return [];
  //       }
  //     })
  //   )
  // }

  getAttributesFromPg(data: { layerId: string, pk_name?: string, pk_value?: number }, attributes?: string[]): Observable<{ attributes: any[], apelidos: {} }> {
    // var layerAjust = data.fonteGS_front.split(':')[1]

    var atrObservable: Observable<any[]>;
    if (!attributes) {
      atrObservable = this.http.get<mainAPIObject>(this.mainApiURL + 'columns-catalog/' + data.layerId).pipe(
        map(d => {
          if (d.Success) {
            return d.Data.Rows
          }
        }))
    }
    else {
      atrObservable = of(attributes)
    }

    return atrObservable.pipe(
      map(data => { return data }),
      mergeMap<any[], Observable<any>>(columnsCatalog => {

        // Melhorar isso aqui depois. Caso o parâmetro "attributes" seja informado, não há necessidade da request acima. 
        var apelidos = {};
        columnsCatalog.map(i => {
          if (i['col_apelido']) apelidos[i['col_name']] = i['col_apelido']
          else apelidos[i['col_name']] = i['col_name']
        })

        var attributesToQuery: string
        if (attributes) attributesToQuery = attributes.join(',');
        else attributesToQuery = columnsCatalog.map(tab => tab['col_name']).join(',');

        var featureToQuery: string
        if (data.pk_name && data.pk_value) featureToQuery = '/' + data.pk_name + '=' + data.pk_value;
        else featureToQuery = ''

        return this.http.get<mainAPIObject>(this.mainApiURL + 'layers-catalog/attributes-from-layer/' + data.layerId + '/' + attributesToQuery + featureToQuery).pipe(
          map(data => {
            if (data.Success) {
              if (attributes) return { attributes: data.Data.Rows };
              else return { attributes: data.Data.Rows, apelidos: apelidos };
            }
            else {
              return [];
            }
          })
        )
      }
      )
    )

  }

  // getAttributesFromPg_beta(data: { layerId: string, pk_name?: string, pk_value?: number }, attributes?: string[]): Observable<{ [key: string]: { apelido: string, mapavalor: boolean, valor: string | number } }> {
  //   // var layerAjust = data.fonteGS_front.split(':')[1]

  //   var atrObservable: Observable<any[]>;
  //   if (!attributes) {
  //     atrObservable = this.http.get<mainAPIObject>(this.mainApiURL + 'columns-catalog/' + data.layerId).pipe(
  //       map(d => {
  //         if (d.Success) {
  //           return d.Data.Rows
  //         }
  //       }))
  //   }
  //   else {
  //     atrObservable = of(attributes)
  //   }

  //   return atrObservable.pipe(
  //     map(data => { return data }),
  //     mergeMap<any[], Observable<any>>(columnsCatalog => {

  //       // Melhorar isso aqui depois. Caso o parâmetro "attributes" seja informado, não há necessidade da request acima. 
  //       var resultadoFinal: { [key: string]: { apelido?: string, mapavalor?: boolean, valor?: string | number } } = {};
  //       columnsCatalog.map(i => {
  //         if (i['col_apelido']) resultadoFinal[i['col_name']] = { "apelido": i['col_apelido'], "mapavalor": i['mapavalor'] }
  //         else resultadoFinal[i['col_name']] = { "apelido": i['col_name'], "mapavalor": i['mapavalor'] }
  //       })



  //       var attributesToQuery: string
  //       if (attributes) attributesToQuery = attributes.join(',');
  //       else attributesToQuery = columnsCatalog.map(tab => tab['col_name']).join(',');

  //       var featureToQuery: string
  //       if (data.pk_name && data.pk_value) featureToQuery = '/' + data.pk_name + '=' + data.pk_value;
  //       else featureToQuery = ''

  //       return this.http.get<mainAPIObject>(this.mainApiURL + 'layers-catalog/attributes-from-layer/' + data.layerId + '/' + attributesToQuery + featureToQuery).pipe(
  //         map(data => {
  //           if (data.Success) {

  //             Object.keys(data.Data.Rows[0]).map(col_name => {
  //               resultadoFinal[col_name] = { ...resultadoFinal[col_name], ...{ "valor": data.Data.Rows[0][col_name] } }
  //             })
  //             return resultadoFinal
  //           }
  //           else {
  //             return undefined;
  //           }
  //         })
  //       )
  //     }
  //     )
  //   )

  // }

  getAttributesFromPg_beta(data: { layerId: string, pk_name?: string, pk_value?: number }, attributes?: string[]): Observable<attributesFromPg> {
    // var layerAjust = data.fonteGS_front.split(':')[1]

    var atrObservable: Observable<any[]>;
    if (!attributes) {
      atrObservable = this.http.get<mainAPIObject>(this.mainApiURL + 'columns-catalog/' + data.layerId).pipe(
        map(d => {
          if (d.Success) {
            return d.Data.Rows
          }
        }),
        mergeMap<any[], Observable<any>>(fields => {
          return this.auth.getTelasGSU().pipe(
            map(telas => {
              return fields.filter(field => {
                var selectedTela = telas.filter(tela => tela.DS_Tela == field['tela_gsu'])[0];
                // var selectedTela = telas.filter(tela => field['telas_gsu'].includes(tela.ID_Tela));

                if (isDevMode()) { return true }
                else {
                  if (selectedTela && selectedTela.IC_Listar == "S") {
                    // if (selectedTela && selectedTela.some(i => i.IC_Listar == "S")) {

                    return true
                  }
                  else { return false }
                }
              })

            })
          )
        })
      )
    }
    else {
      atrObservable = of(attributes)
    }

    return atrObservable.pipe(
      map(data => { return data }),
      mergeMap<any[], Observable<any>>(columnsCatalog => {

        // Melhorar isso aqui depois. Caso o parâmetro "attributes" seja informado, não há necessidade da request acima. 
        var resultadoFinal: { [key: string]: { apelido?: string, mapavalor?: boolean, valor?: string | number, telaGSU?: number | undefined } } = {};
        columnsCatalog.map(i => {

          if (i['col_apelido']) {

            resultadoFinal[i['col_name']] = {
              "apelido": i['col_apelido'],
              "mapavalor": i['mapavalor'],
              "telaGSU": Number(i['tela_gsu'])
            }
          }
          else {

            resultadoFinal[i['col_name']] = {
              "apelido": i['col_name'],
              "mapavalor": i['mapavalor'],
              "telaGSU": Number(i['tela_gsu'])
            }
          }
        })



        var attributesToQuery: string
        if (attributes) attributesToQuery = attributes.join(',');
        else attributesToQuery = columnsCatalog.map(tab => tab['col_name']).join(',');

        var featureToQuery: string
        if (data.pk_name && data.pk_value) featureToQuery = '/' + data.pk_name + '=' + data.pk_value;
        else featureToQuery = ''

        return this.http.get<mainAPIObject>(this.mainApiURL + 'layers-catalog/attributes-from-layer/' + data.layerId + '/' + attributesToQuery + featureToQuery).pipe(
          map(data => {
            if (data.Success) {

              Object.keys(data.Data.Rows[0]).map(col_name => {
                resultadoFinal[col_name] = { ...resultadoFinal[col_name], ...{ "valor": data.Data.Rows[0][col_name] } }
              })
              return resultadoFinal
            }
            else {
              return undefined;
            }
          })
        )
      }
      )
    )

  }

  getAttributesFromPg_beta2(data: { layerId: string, pk_name?: string, pk_value?: number }, attributes?: string[]): Observable<attributesFromPg> {
    // var layerAjust = data.fonteGS_front.split(':')[1]

    var atrObservable: Observable<any[]>;
    if (!attributes) {
      atrObservable = this.http.get<mainAPIObject>(this.mainApiURL + 'columns-catalog/' + data.layerId).pipe(
        map(d => {
          if (d.Success) {
            return d.Data.Rows
          }
        })
      )
    }
    else {
      atrObservable = of(attributes)
    }

    return atrObservable.pipe(
      map(data => { return data }),
      mergeMap<any[], Observable<any>>(columnsCatalog => {

        // Melhorar isso aqui depois. Caso o parâmetro "attributes" seja informado, não há necessidade da request acima. 
        var resultadoFinal: { [key: string]: { apelido?: string, mapavalor?: boolean, valor?: string | number, telaGSU?: number | undefined } } = {};
        columnsCatalog.map(i => {

          if (i['col_apelido']) {

            resultadoFinal[i['col_name']] = {
              "apelido": i['col_apelido'],
              "mapavalor": i['mapavalor'],
              "telaGSU": Number(i['tela_gsu'])
            }
          }
          else {

            resultadoFinal[i['col_name']] = {
              "apelido": i['col_name'],
              "mapavalor": i['mapavalor'],
              "telaGSU": Number(i['tela_gsu'])
            }
          }
        })



        var attributesToQuery: string
        if (attributes) attributesToQuery = attributes.join(',');
        else attributesToQuery = columnsCatalog.map(tab => tab['col_name']).join(',');

        var featureToQuery: string
        if (data.pk_name && data.pk_value) featureToQuery = '/' + data.pk_name + '=' + data.pk_value;
        else featureToQuery = ''

        return this.http.get<mainAPIObject>(this.mainApiURL + 'layers-catalog/attributes-from-layer/' + data.layerId + '/' + attributesToQuery + featureToQuery).pipe(
          map(data => {
            if (data.Success) {

              Object.keys(data.Data.Rows[0]).map(col_name => {
                resultadoFinal[col_name] = { ...resultadoFinal[col_name], ...{ "valor": data.Data.Rows[0][col_name] } }
              })
              return resultadoFinal
            }
            else {
              return undefined;
            }
          })
        )
      }
      )
    )

  }


  // Função que agrega a getColumnsApelidoFromPG() e getFieldMapFromPG(); Substituirá as duas.
  getColumnsApelidoFromPG_beta(layerId: string): Observable<{ [key: string]: { apelido: string, mapavalor: boolean } }> {
    return this.http.get<mainAPIObject>(this.mainApiURL + 'columns-catalog/' + layerId).pipe(
      map(data => {
        if (data.Success) {
          return data.Data.Rows;
        }
      }),
      // caso o campo "col_apelido" não esteja preenchido, repete a informação do 
      map(data_ => {
        var result = {};
        data_.map(i => {
          if (i['col_apelido']) result[i['col_name']] = { "apelido": i['col_apelido'], "mapavalor": i['mapavalor'] }
          else result[i['col_name']] = { "apelido": i['col_name'], "mapavalor": i['mapavalor'] }
        })
        return result;
      })
    )

  }

  getColumnsApelidoFromPG(layerId: string): Observable<object> {
    return this.http.get<mainAPIObject>(this.mainApiURL + 'columns-catalog/' + layerId).pipe(
      map(data => {
        if (data.Success) {
          return data.Data.Rows;
        }
      }),
      // caso o campo "col_apelido" não esteja preenchido, repete a informação do 
      map(data_ => {
        var result = {};
        data_.map(i => {
          if (i['col_apelido']) result[i['col_name']] = i['col_apelido']
          else result[i['col_name']] = i['col_name']
        })
        return result;
      })
    )
  }

  // Melhorar depois, é melhor que esta informação seja imbutida no retorno da função que agrega esta e a getColumnsApelidoFromPG.
  getFieldMapFromPG(layerId: string): Observable<object> {
    return this.http.get<mainAPIObject>(this.mainApiURL + 'columns-catalog/' + layerId).pipe(
      map(data => {
        if (data.Success) {
          return data.Data.Rows;
        }
      }),
      // caso o campo "col_apelido" não esteja preenchido, repete a informação do 
      map(data_ => {
        var result = {};
        data_.map(i => {
          if (i['col_apelido']) result[i['col_name']] = i['mapavalor']
          else result[i['col_name']] = i['mapavalor']
        })
        return result;
      })
    )
  }

  // getGeomFromGS(data: { layerSource: string, pk_name: string, pk_value: number }) {
  //   return this.http.get<{ features: {}[], numberMatched: number, numberReturned: number, timeStamp: string, totalFeatures: number, type: string }>(this.geoserverURL + 'wfs?service=WFS&version=1.0.0&request=GetFeature&typename=' + data.layerSource + '&outputFormat=application/json&srsname=EPSG:4326&cql_filter=' + encodeURI(" " + data.pk_name + " =" + data.pk_value)).pipe(
  //     map(data_ => {
  //       return data_.features[0]['geometry']
  //     })
  //   )
  // }

  // getColumnsPG(layerId: string): Observable<object> {
  //   return this.http.get<mainAPIObject>(this.mainApiURL + 'columns-catalog/' + layerId).pipe(
  //     map(data => {
  //       if (data.Success) {
  //         return data.Data.Rows;
  //       }
  //     }))
  // }

  async getFeatureNameFromGS2(data: { layerId: string, pk_name: string, pk_value: number }, namesMapped?: { values: string, sep: string }): Promise<Observable<{ values: string[]; sep: string; }>> {

    var url = this.mainApiURL + 'layers-catalog/attributes-from-layer/' + data.layerId + '/';
    var obj_

    if (namesMapped) {
      obj_ = namesMapped
    }
    else {
      var layerCatalog$ = this.http.get<mainAPIObject>(this.mainApiURL + 'layers-catalog/' + data.layerId).pipe(
        map(data_ => {
          if (data_.Success) {
            return data_.Data.Rows[0]
          }
          else return null;
        }),
        map(data_ => {
          var column_list: string;
          var first_split = data_["feat_apelido"]?.split(":");
          if (first_split.length === 1) column_list = first_split[0];
          else column_list = first_split[0].split("\\").join(',');
          return { values: column_list, sep: first_split[1] };
        }));

      obj_ = await lastValueFrom(layerCatalog$);
    }

    url = url + obj_.values + '/' + data.pk_name + '=' + data.pk_value

    return this.http.get<mainAPIObject>(url).pipe(
      map(data__ => {
        if (data__.Success) {
          var attributesValues = Object.values(data__.Data.Rows[0]).filter(e => e);
          return { values: attributesValues as string[], sep: obj_.sep as string };
        }
      })
    )
  }


  getFeatureNameFromGS(data: { layerId: string, pk_name: string, pk_value: number }, columns?: {}, namesMapped?: { values: string, sep: string }): Observable<{ values: string[], sep: string }> {
    return this.http.get<mainAPIObject>(this.mainApiURL + 'layers-catalog/' + data.layerId).pipe(
      map(data_ => {
        if (data_.Success) {
          return data_.Data.Rows[0]
        }
        else return null;
      }),
      map(data_ => {
        var column_list: string;
        var first_split = data_["feat_apelido"]?.split(":");
        if (first_split.length === 1) column_list = first_split[0];
        else column_list = first_split[0].split("\\").join(',');
        return { values: column_list, sep: first_split[1] };
      }),
      mergeMap(obj => {
        return this.http.get<mainAPIObject>(this.mainApiURL + 'layers-catalog/attributes-from-layer/' + data.layerId + '/' + obj.values + '/' + data.pk_name + '=' + data.pk_value).pipe(
          map(data__ => {
            if (data__.Success) {
              var attributesValues = Object.values(data__.Data.Rows[0]).filter(e => e);
              return { values: attributesValues as string[], sep: obj.sep as string };
            }
          })
        )
      })
    )
  }

  getAttributesTypeGS(layerSource: string): Observable<responseGSDescribeFeatureType> {
    return this.http.get<responseGSDescribeFeatureType>(this.geoserverURL +
      'wfs?service=wfs&version=2.0.0&request=DescribeFeatureType&typeNames=' + layerSource + '&outputFormat=application/json').pipe(
        map(data_ => {
          data_.featureTypes[0].properties.forEach(e => {
            if (e.localType == 'date-time') {
              e.localType = 'date'
            }
          })
          return data_
        })
      )
  }


  // ******************************************************************************
  // Pegar stilo do GeoServer
  // ******************************************************************************
  getStyleFromGS(layerString: string): Observable<string> {
    var workSpaceName = layerString.split(':')[0];
    var layerName = layerString.split(':')[1];

    return this.http.get('http://192.168.10.157:8080/geoserver/rest/workspaces/' + workSpaceName + '/styles/' + layerName + '.sld', { responseType: 'text' }).pipe(
      map(data => {
        return data.toString()
      })
    );
  }


  // ******************************************************************************
  // 
  // ******************************************************************************
  getFeatureInfoFromGS(url: string) {
    return this.http.get<responseGeoserver>(url).pipe(
      map(data => {
        return data
      })
    )
  }

  // Desenvolvida para aceitar a ocorrencia de grupos no geoserver. Quando é Layer Group (no geoserver) desconsidera as feições retornadas de todas as layers exceto as da primeira. Além disso, retorna o nome da layer que deve ser usada a partir de então.
  // getFeatureInfoFromGS_beta(url: string): Observable<{ data: responseGeoserver, new_layer_name: string }> {
  //   return this.http.get<responseGeoserver>(url).pipe(
  //     map(data => {
  //       console.log('data', data);
  //       var primeira_layer = data.features[0]['id'].split('.')[0]
  //       data.features = data.features.filter(e => e['id'].split('.')[0] == primeira_layer);
  //       console.log('data', data)
  //       return { data: data, new_layer_name: primeira_layer }
  //     })

  //   )
  // }

  getMultipleFeaturesGeomFromGS(layerName: string, colName: string, values: string[]): Observable<responseGeoserver> {
    var cqlFilter = colName + " IN (" + values.join(',') + ")";
    var url = this.geoserverURL + "wfs?service=wfs&version=2.0.0&request=GetFeature&srsName=EPSG:4326&outputFormat=application/json&propertyName=geom," + colName + "&typeNames=" + layerName + "&cql_filter=" + cqlFilter;
    return this.getFeatureInfoFromGS(url);
  }

  requestOnClick(vector: TileLayer<any> | LayerGroup | ImageLayer<any>, coord: number[], resolution: number) {
    var source;
    if (vector instanceof TileLayer || vector instanceof ImageLayer) {
      source = vector.getSource()
    }
    else {
      source = (vector.getLayers().getArray() as TileLayer<any>[])[0].getSource()
    }
    var attributes = vector.get('fk_name') ? vector.get('fk_name') : vector.get('pk_name')
    attributes = attributes + ',geom'
    var url: string = source.getFeatureInfoUrl(coord, resolution, 'EPSG:4326', { 'INFO_FORMAT': 'application/json', 'FEATURE_COUNT': '1000', 'propertyName': attributes });
    const regex1 = /QUERY_LAYERS=(.*?)&/g;
    const regex2 = /LAYERS=(.*?)&/g;
    const matches1 = url.match(regex1);
    const matches2 = url.match(regex2);
    if (matches1.length > 0 && matches2.length > 0 && !vector.get('fk_name')) {
      var sourceLayer = vector.get('fonteGS_back') ? vector.get('fonteGS_back') : vector.get('fonteGS_front')
      url = url.replace(matches1[0], `QUERY_LAYERS=${sourceLayer}&`).replace(matches2[0], `LAYERS=${sourceLayer}&`)
    }
    // console.log(url);

    return <Observable<responseGeoserverPlus>>this.getFeatureInfoFromGS(url).pipe(
      map(data => {
        if (data.features.length > 0) {

          data['layerId'] = vector.get('id');
          data['layerName'] = vector.get('name');
          data['fonteGS_front'] = vector.get('fonteGS_front');
          data['fonteGS_back'] = vector.get('fonteGS_back');
          data['pk_name'] = vector.get('pk_name');
          data['fk_name'] = vector.get('fk_name');
          data['cluster_mode'] = vector.get('cluster_mode'),
            data['feat_apelido'] = vector.get('feat_apelido');

          // var primeira_layer = data.features[0]['id'].split('.')[0]
          // var workspace = source.getParams().LAYERS.split(':')[0]
          // data['fonteGS_front'] = `${workspace}:${primeira_layer}`;

          return data;
        }
        else return;
      })
    );
  }



  getTileSources(): Observable<TileLayer<any>[]> {
    // let tileLayers: TileLayer<any>[] = [];

    return this.http.get<{ Success: boolean, Data: { Rows: [], RowsFound: number } }>(this.mainApiURL + 'web-tile-raster-sources').pipe(
      map(data => {
        const final_data = [];
        data.Data.Rows.map(e => {
          var tile = new TileLayer({ source: new XYZ({ url: e['url'], attributions: e['attributions'] }), properties: { name: e['nome'], imgThumb: e['imgthumb'], categoria: e['categoria'] } });
          final_data.push(tile);
        });
        return final_data;
      }),
      map(e => {
        e.push(new TileLayer({ source: new OsmSource(), properties: { name: 'OSM', imgThumb: './assets/images/tileThumbs/osm.png', categoria: 'OSM' } }));
        e.push(new TileLayer({ source: null, properties: { name: 'Branco', imgThumb: './assets/images/tileThumbs/blank.png', categoria: 'Branco' } }));
        return e;
      })
    );
  }

  addOsmAndBlankTile(tileLayers: TileLayer<any>[]) {
    tileLayers.push(new TileLayer({ source: new OsmSource(), properties: { name: 'OSM', imgThumb: './assets/images/tileThumbs/osm.png', categoria: 'OSM' } }));
    tileLayers.push(new TileLayer({ source: null, properties: { name: 'Branco', imgThumb: './assets/images/tileThumbs/blank.png', categoria: 'Branco' } }));

    return tileLayers;
  }



  // ******************************************************
  // ****************** Buscas ****************************


  // doSearch(witch: number, wordSearch: string): Observable<responseGeoserver> {

  //   var layerName: string;
  //   var colName: string;
  //   var pkName: string;
  //   var cqlFilter: string;
  //   var prefix: string = "'";
  //   var valueToSearch = wordSearch + encodeURIComponent("%'");
  //   // var = 

  //   if (witch === 1) {
  //     layerName = 'pmspwebgeo:imoveis';
  //     colName = 'cod_imovel';
  //     pkName = 'gid_imovel'
  //     cqlFilter = colName + " LIKE " + prefix + valueToSearch;

  //   }
  //   else if (witch === 2) {
  //     layerName = 'pmspwebgeo:imoveis';
  //     colName = 'ic_imovel';
  //     pkName = 'gid_imovel'
  //     cqlFilter = colName + " LIKE " + prefix + valueToSearch;
  //   }
  //   else {
  //     layerName = 'pmspwebgeo:vias';
  //     colName = 'nome';
  //     pkName = 'gid,tipo' // Aqui foi necessário inserir o tipo pois o resultado com mais de um item prever a existencia do tipo para exibir ao usuário
  //     prefix = encodeURIComponent("'%");
  //     cqlFilter = 'strStripAccents(strToLowerCase(' + colName + ")) LIKE " + prefix + valueToSearch;
  //   }

  //   var url = this.geoserverURL + "wfs?service=wfs&version=2.0.0&request=GetFeature&srsName=EPSG:4326&outputFormat=application/json&propertyName=" + `${pkName},${colName},geom` + "&typeNames=" + layerName + "&cql_filter=" + cqlFilter;

  //   return this.getFeatureInfoFromGS(url);
  // }

  // doSearchFromWord(which: number, wordSearch: string): Observable<responseGeoserver> {

  //   var layerName: string;
  //   var colName: string;
  //   var pkName: string;
  //   var cqlFilter: string;
  //   var prefix: string = "'";
  //   var valueToSearch = wordSearch + encodeURIComponent("%'");

  //   if (which === 1) {
  //     layerName = 'pmspwebgeo:imoveis';
  //     colName = 'cod_imovel';
  //     pkName = 'gid_imovel'
  //     cqlFilter = colName + " LIKE " + prefix + valueToSearch;

  //   }
  //   else if (which === 2) {
  //     layerName = 'pmspwebgeo:imoveis';
  //     colName = 'ic_imovel';
  //     pkName = 'gid_imovel'
  //     cqlFilter = colName + " LIKE " + prefix + valueToSearch;
  //   }
  //   else {
  //     layerName = 'pmspwebgeo:vias';
  //     colName = 'nome';
  //     pkName = 'gid,tipo' // Aqui foi necessário inserir o tipo pois o resultado com mais de um item prever a existencia do tipo para exibir ao usuário
  //     prefix = encodeURIComponent("'%");
  //     cqlFilter = 'strStripAccents(strToLowerCase(' + colName + ")) LIKE " + prefix + valueToSearch;
  //   }

  //   var url = this.geoserverURL + "wfs?service=wfs&version=2.0.0&request=GetFeature&srsName=EPSG:4326&outputFormat=application/json&propertyName=" + `${pkName},${colName},geom` + "&typeNames=" + layerName + "&cql_filter=" + cqlFilter;

  //   return this.getFeatureInfoFromGS(url);
  // }

  doSearchFromCQL(layerName: string, cqlFilter: string, colNames: string[]): Observable<responseGeoserver> {

    var url = this.geoserverURL + "wfs?service=wfs&version=2.0.0&request=GetFeature&srsName=EPSG:4326&outputFormat=application/json&propertyName=" + `${colNames.join(',')},geom` + "&typeNames=" + layerName + "&cql_filter=" + cqlFilter;

    return this.getFeatureInfoFromGS(url);
  }

  doSearchFromCQLFilter(layerName: string, cqlFilter: string): Observable<responseGeoserver> {

    var url = this.geoserverURL + "wfs?service=wfs&version=2.0.0&request=GetFeature&srsName=EPSG:4326&outputFormat=application/json&typeNames=" + layerName + "&cql_filter=" + cqlFilter;

    return this.getFeatureInfoFromGS(url);
  }

  getLegendURLFromGS(layerString: string): string {
    return this.geoserverURL + 'wms?service=WMS&version=1.1.0&request=GetLegendGraphic&layer=' + layerString + '&format=image/png&LEGEND_OPTIONS=fontAntiAliasing:true;forceLabels:on;wrap_limit:280;wrap:true'
  }


  createImageFromBlob(image: Blob) {
    var imageToShow: string | ArrayBuffer
    let reader = new FileReader();
    reader.addEventListener("load", () => {
      return (reader.result)
    }, false);

    if (image) {
      reader.readAsDataURL(image);
    }
  }

  getLegendFileFromGS(imageUrl: string): Observable<string> {

    const httpOptions = {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${this.auth.tokenGSU}`,
        'Accept': 'image/png',
      }),
      responseType: 'blob' as 'json' // This tells angular to parse it as a blob, default is json
    };

    return this.http.get<Blob>(imageUrl, httpOptions).pipe(
      map(image => {
        const urlCreator = window.URL || (window as any).webkitURL;
        const imageUrl = urlCreator.createObjectURL(image);
        return imageUrl
      }));
  }


  // ******************************************************
  // ****************** Zoneamento ************************

  getZonasIntersectsPolygon(querySingle: string, layerName: string) {

    var cql_filter = 'INTERSECTS(geom,' + querySingle + ')'
    var url = this.geoserverURL + "wfs?service=wfs&version=2.0.0&request=GetFeature&srsName=EPSG:4326&outputFormat=application/json&typeNames=" + layerName + "&cql_filter=" + cql_filter;

    // console.log(url);
    return this.getFeatureInfoFromGS(url);

  }


  // ******************************************************************************
  // 
  // ******************************************************************************



  searchAttributesAutoComplete(layerName: string, attribute: string, value: string): Observable<string[]> {
    if (value === '') {
      return of([]);
    }

    var url = this.geoserverURL + "wfs?service=wfs&version=2.0.0&request=GetFeature&srsName=EPSG:4326&outputFormat=application/json&typeNames=" + layerName + "&propertyName=" + attribute + "&cql_filter=" + `isLike(strStripAccents(strToLowerCase("${attribute}")), '^.*${value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()}.*$')=true`;

    return this.http
      .get<wfsResponse>(url)
      .pipe(
        map(response => {
          var result = []
          response.features.forEach(e => {
            result.push(e.properties[attribute])
          })
          var sorterResults = (a: string, b: string) => {
            var aa = a.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().indexOf(value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase());
            var bb = b.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().indexOf(value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase());
            if (aa < bb) {
              return -1;
            }
            if (aa > bb) {
              return 1;
            }
            return 0;
          }
          return [...new Set(result)].sort(sorterResults)
        }));
  }



  dateAttributeToTimeline(layerName: string, attribute: string): Observable<{ items: moment.Moment[], max: moment.Moment, min: moment.Moment, empytitems: number }> {

    var url = this.geoserverURL + "wfs?service=wfs&version=2.0.0&request=GetFeature&srsName=EPSG:4326&outputFormat=application/json&typeNames=" + layerName + "&propertyName=" + attribute

    return this.http
      .get<wfsResponse>(url)
      .pipe(
        map(response => {
          var result = []
          var empytItems = response.features.filter(e => !e.properties[attribute]).length;
          result = response.features.filter(e => e.properties[attribute]);
          result = result.map(e => moment(e.properties[attribute]).add(3, 'h'))
          return { items: result, empytItems: empytItems }
        }),
        map(result => {
          var min = moment.min(result.items);
          var max = moment.max(result.items);

          return { items: result.items, max: max, min: min, empytitems: result.empytItems }

        }));
  }

  featuresCountGS(layerName: string, cql_filter: string): Observable<number> {
    var url = this.geoserverURL + "wfs?service=wfs&version=2.0.0&request=GetFeature&srsName=EPSG:4326&outputFormat=application/json&typeNames=" + layerName + "&cql_filter=" + cql_filter

    return this.http
      .get<wfsResponse>(url)
      .pipe(
        map(response => {
          return response.features.length
        }));
  }


  getAttributeDomain(layerSource: string, attribute: string): Observable<{ type: string, features: {}[] }> {
    var body =
      `<?xml version="1.0" encoding="UTF-8"?><wps:Execute version="1.0.0" service="WPS" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.opengis.net/wps/1.0.0" xmlns:wfs="http://www.opengis.net/wfs" xmlns:wps="http://www.opengis.net/wps/1.0.0" xmlns:ows="http://www.opengis.net/ows/1.1" xmlns:gml="http://www.opengis.net/gml" xmlns:ogc="http://www.opengis.net/ogc" xmlns:wcs="http://www.opengis.net/wcs/1.1.1" xmlns:xlink="http://www.w3.org/1999/xlink" xsi:schemaLocation="http://www.opengis.net/wps/1.0.0 http://schemas.opengis.net/wps/1.0.0/wpsAll.xsd">
        <ows:Identifier>vec:Unique</ows:Identifier>
        <wps:DataInputs>
          <wps:Input>
            <ows:Identifier>features</ows:Identifier>
            <wps:Reference mimeType="text/xml" xlink:href="http://geoserver/wfs" method="POST">
              <wps:Body>
                <wfs:GetFeature service="WFS" version="1.0.0" outputFormat="GML2" xmlns:pmspwebgeo="https://intranet.santanadeparnaiba.sp.gov.br/SisGeo/">
                  <wfs:Query typeName="${layerSource}"/>
                </wfs:GetFeature>
              </wps:Body>
            </wps:Reference>
          </wps:Input>
          <wps:Input>
            <ows:Identifier>attribute</ows:Identifier>
            <wps:Data>
              <wps:LiteralData>${attribute}</wps:LiteralData>
            </wps:Data>
          </wps:Input>
        </wps:DataInputs>
        <wps:ResponseForm>
          <wps:RawDataOutput mimeType="application/json">
            <ows:Identifier>result</ows:Identifier>
          </wps:RawDataOutput>
        </wps:ResponseForm>
      </wps:Execute>`

    return this.http.post<{ type: string, features: {}[] }>('http://192.168.10.157:8080/geoserver/ows?', body)
  }

  // EDIÇÃO 

  mayEditLayer(idLayer: number): Observable<boolean> {

    return this.getLayerInfo(idLayer).pipe(
      map(data => { return data }),
      mergeMap(layerInfo => {
        return this.auth.getTelasGSU().pipe(
          map(telas => {
            // if (telas.filter(f => f.ID_Tela == layerInfo['tela_gsu'])[0].IC_Alterar == 'S') {
            if (telas.filter(f => layerInfo['telas_gsu'].includes(f.DS_Tela)).some(i => i.IC_Alterar == 'S')) {

              return true
            }
            else {
              return false
            }
          })
        )
      })
    );
  }

  checkTelaEParametroGSU(nomeTela: string, telaGSU: keyof telaGSU): Observable<boolean> {

    return this.auth.getTelasGSU().pipe(
      map(telas => {
        var tela = telas.filter(tela => tela.DS_Tela == nomeTela)[0];
        if (tela[telaGSU] == 'S') {
          return true
        }
        else {
          return false
        }
      })
    )

  }

  updateAttibutesPG(bodyObj: objBodyUpdate): Observable<boolean> {
    var url = this.mainApiURL + 'layers-catalog/layer';

    return this.http.put<mainAPIObjectPut>(url, bodyObj).pipe(
      map(data => {
        return data.Success;
      })
    )

  }

  sendFile(file: string | ArrayBuffer, nameFile: string): Observable<number[]> {
    var url = this.mainApiURL + 'files/';
    var obj = { "BIN_Arquivo": file, "NM_Arquivo": nameFile }

    return this.http.post<mainAPIObjectPut>(url, obj).pipe(
      map(data => {
        if (data.Success) {
          return (data.Data as { RowsAffected: number, Ids: number[] }).Ids
        }
        else {
          return []
        }
      })
    )
  }

  getFile(id: number, conteudo: boolean = false): Observable<mainAPIFileItem> {
    var url = this.mainApiURL + `files/${id}?conteudo=${conteudo}`;
    return this.http.get<mainAPIObject>(url).pipe(
      map(data => {
        if (data.Success) {
          return data.Data.Rows[0] as mainAPIFileItem
        }
        else {
          return null
        }
      })
    )
  }

  mayOpenSystem(systemID: number) {

    return this.auth.getTelasGSU().pipe(
      map(telas => {
        // if (telas.filter(f => f.ID_Tela == layerInfo['tela_gsu'])[0].IC_Alterar == 'S') {
        if (telas.some(i => i.ID_Sistema == systemID)) {
          return true
        }
        else {
          return false
        }
      })
    )

  }



}
