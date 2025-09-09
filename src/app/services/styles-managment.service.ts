import { Injectable, OnInit } from "@angular/core";
import CircleStyle from "ol/style/Circle";
import Circle from "ol/style/Circle";
import Fill from "ol/style/Fill";
import Stroke from "ol/style/Stroke";
import { Style, Text } from "ol/style";
import { getArea, getLength } from 'ol/sphere.js';
import { LineString, MultiPoint, Point } from "ol/geom";
import VectorSource from "ol/source/Vector";
import { Modify } from "ol/interaction"
import Map from 'ol/Map';;
import { add } from "ol/coordinate";


@Injectable()
export class stylesMngService implements OnInit {

  layerStyles: {} = {};
  stylesFunctions: {} = {};

  tipPoint;
  measureToolSegmentStyles;
  measureToolmodify;


  createTextGoToCoords = function (feature) {
    return new Style({
      image: new Circle({
        radius: 10,
        fill: new Fill({ color: 'rgba(209, 30, 48, 0.5)' }),
        stroke: new Stroke({
          color: 'red', width: 2
        })
      }),
      text: new Text({
        text: feature.get('id').toString(),
        font: '12px Calibri,sans-serif',
        fill: new Fill({
          color: 'rgba(255, 255, 255, 1)',
        }),
        textBaseline: 'middle',
        // offsetY: -12,
      })
    });
  }


  constructor() {

    this.layerStyles['supFevDeferido'] = new Style({
      image: new Circle({
        radius: 7,
        fill: new Fill({ color: '#0d6efd' }),
        stroke: new Stroke({
          color: 'black', width: 1
        })
      }),
    });

    this.layerStyles['supFevIndeferido'] = new Style({
      image: new Circle({
        radius: 7,
        fill: new Fill({ color: '#8a8a8a' }),
        stroke: new Stroke({
          color: 'black', width: 1
        })
      }),
    });

    this.layerStyles['supFevEmTramite'] = new Style({
      image: new Circle({
        radius: 7,
        fill: new Fill({ color: '#fd890d' }),
        stroke: new Stroke({
          color: 'black', width: 1
        })
      }),
    });

    this.stylesFunctions['aut_dlpb'] = function (feature, resolution) {
      const status = feature.get('status').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

      if (status == 'deferido') {
        return this.layerStyles['supFevDeferido']
      }
      else if (status == 'indeferido') {
        return this.layerStyles['supFevIndeferido']
      }
      else {
        return this.layerStyles['supFevEmTramite']
      }
    }.bind(this);



    // ##################################################
    // Stilos da ferramenta de medição - Área e distância

    this.layerStyles['measureToolStyle'] = new Style({
      fill: new Fill({
        color: 'rgba(255, 255, 255, 0.2)',
      }),
      stroke: new Stroke({
        color: 'rgba(0, 0, 0, 0.5)',
        lineDash: [10, 10],
        width: 2,
      }),
      image: new CircleStyle({
        radius: 5,
        stroke: new Stroke({
          color: 'rgba(0, 0, 0, 0.7)',
        }),
        fill: new Fill({
          color: 'rgba(255, 255, 255, 0.2)',
        }),
      }),
    });

    this.layerStyles['measureToolLabelStyle'] = new Style({
      text: new Text({
        font: '14px Calibri,sans-serif',
        fill: new Fill({
          color: 'rgba(255, 255, 255, 1)',
        }),
        backgroundFill: new Fill({
          color: 'rgba(0, 0, 0, 0.7)',
        }),
        padding: [3, 3, 3, 3],
        textBaseline: 'bottom',
        // offsetY: -15,
      }),
      // image: new RegularShape({
      //   radius: 8,
      //   points: 3,
      //   angle: Math.PI,
      //   displacement: [0, 10],
      //   fill: new Fill({
      //     color: 'rgba(0, 0, 0, 0.7)',
      //   }),
      // }),
    });

    this.layerStyles['measureToolTipStyle'] = new Style({
      text: new Text({
        font: '12px Calibri,sans-serif',
        fill: new Fill({
          color: 'rgba(255, 255, 255, 1)',
        }),
        backgroundFill: new Fill({
          color: 'rgba(0, 0, 0, 0.4)',
        }),
        padding: [2, 2, 2, 2],
        textAlign: 'left',
        offsetX: 15,
      }),
    });

    this.layerStyles['measureToolModifyStyle'] = new Style({
      image: new CircleStyle({
        radius: 5,
        stroke: new Stroke({
          color: 'rgba(0, 0, 0, 0.7)',
        }),
        fill: new Fill({
          color: 'rgba(0, 0, 0, 0.4)',
        }),
      }),
      text: new Text({
        text: 'Clique e segure para editar (alt + clique para apagar um vértice)',
        font: '12px Calibri,sans-serif',
        fill: new Fill({
          color: 'rgba(255, 255, 255, 1)',
        }),
        backgroundFill: new Fill({
          color: 'rgba(0, 0, 0, 0.7)',
        }),
        padding: [2, 2, 2, 2],
        textAlign: 'left',
        offsetX: 15,
      }),
    });

    this.layerStyles['measureToolSegmentStyle'] = new Style({
      text: new Text({
        font: '12px Calibri,sans-serif',
        fill: new Fill({
          color: 'rgba(255, 255, 255, 1)',
        }),
        backgroundFill: new Fill({
          color: 'rgba(0, 0, 0, 0.4)',
        }),
        padding: [2, 2, 2, 2],
        textBaseline: 'middle',
        // offsetY: -12,
      }),
      // image: new RegularShape({
      //   radius: 6,
      //   points: 3,
      //   angle: Math.PI,
      //   displacement: [0, 8],
      //   fill: new Fill({
      //     color: 'rgba(0, 0, 0, 0.4)',
      //   }),
      // }),
    });


    this.layerStyles['measureToolVerticesStyle'] = new Style({
      image: new CircleStyle({
        radius: 3,
        fill: new Fill({
          color: 'rgb(147, 38, 1)',
        }),
      })
    });

    this.measureToolSegmentStyles = [this.layerStyles['measureToolSegmentStyle']];

    this.stylesFunctions['measureToolStyleFunction'] = (feature, segments, drawType, tip) => {

      const styles = [];
      const geometry = feature.getGeometry();
      const type = geometry.getType();
      let point, label, line;


      if (!drawType || drawType === type || type === 'Point') {

        styles.push(this.layerStyles['measureToolStyle']);

        if (type === 'Polygon') {
          point = geometry.getInteriorPoint();
          label = this.formatArea(geometry);
          line = new LineString(geometry.getCoordinates()[0]);
        }

        else if (type === 'LineString') {
          point = new Point(geometry.getLastCoordinate());
          label = this.formatLength(geometry);
          line = geometry;
        }
      }

      if (segments && line) {
        let count = 0;
        line.forEachSegment((a, b) => {
          const segment = new LineString([a, b]);
          const label = this.formatLength(segment);
          if (this.measureToolSegmentStyles.length - 1 < count) {
            this.measureToolSegmentStyles.push(this.layerStyles['measureToolSegmentStyle'].clone());
          }
          const segmentPoint = new Point(segment.getCoordinateAt(0.5));
          this.measureToolSegmentStyles[count].setGeometry(segmentPoint);
          this.measureToolSegmentStyles[count].getText().setText(label);
          styles.push(this.measureToolSegmentStyles[count]);
          count++;
        });
      }


      if (label) {
        this.layerStyles['measureToolLabelStyle'].setGeometry(point);
        this.layerStyles['measureToolLabelStyle'].getText().setText(label);
        styles.push(this.layerStyles['measureToolLabelStyle']);
      }

      if (
        tip &&
        type === 'Point' &&
        !this.measureToolmodify.getOverlay().getSource().getFeatures().length
      ) {
        // this.tipPoint = geometry;
        this.layerStyles['measureToolTipStyle'].getText().setText(tip);
        styles.push(this.layerStyles['measureToolTipStyle']);
      }

      // criar vertices
      const vertices = geometry.getCoordinates()
      var points = new MultiPoint(vertices)
      this.layerStyles['measureToolVerticesStyle'].setGeometry(points);
      styles.push(this.layerStyles['measureToolVerticesStyle']);

      return styles;
    };

    this.measureToolmodify = new Modify({
      source: this.measureToolSource,
      style: this.layerStyles['measureToolModifyStyle']
    });


  }
  ngOnInit(): void {

  }


  // ##################################################
  // Funções da ferramenta de medição - Área e distância
  tip: string = 'Clique para inciar a medição'
  measureToolSource = new VectorSource();


  formatLength(line) {
    const length = getLength(line, { projection: 'EPSG:4326' });
    let output;
    if (length > 1000) {
      output = Math.round((length / 1000) * 100) / 100 + ' km';
    } else {
      output = Math.round(length * 100) / 100 + ' m';
    }
    return output;
  };

  formatArea(polygon) {
    const area = getArea(polygon, { projection: 'EPSG:4326' });
    let output;
    if (area > 100000) {
      output = Math.round((area / 10000) * 100) / 100 + ' ha';
    } else {
      output = Math.round(area * 100) / 100 + ' m\xB2';
    }
    return output;
  };

  setGeometryModifyStyle(useTipPoint) {
    if (useTipPoint) {
      this.layerStyles['measureToolModifyStyle'].setGeometry(this.tipPoint);
    }
    else {
      this.layerStyles['measureToolModifyStyle'].setGeometry();
    }
  };



  // ******************************************************************************
  // Pegar stilo do GeoServer
  // ******************************************************************************
  // getStyleFromGS(layerString: string): Observable<string> {
  //   var workSpaceName = layerString.split(':')[0];
  //   var layerName = layerString.split(':')[1];

  //   return this.http.get('http://192.168.10.157:8080/geoserver/rest/workspaces/' + workSpaceName + '/styles/' + layerName + '.sld', { responseType: 'text' }).pipe(
  //     map(data => {
  //       return data.toString()
  //     })
  //   );
  // }

  // getLegendFromGS(layerString: string): Observable<object> {
  //   return this.http.get('http://192.168.10.157:8080/geoserver/wms?service=WMS&version=1.1.0&request=GetLegendGraphic&layer=' + layerString + '&format=image/png').pipe(
  //     map(data => {
  //       return data
  //     })
  //   );
  // }

  zoomToResolution4326(zoom: number): number {
    return 360 / (256 * Math.pow(2, zoom));
  }

  foraniaColors: Record<string, string> = {
    'Centro': '#5e9bdb',
    'Leste': '#91d36b',
    'Norte': '#f4a261',
    'Oeste': '#e76f51',
    'Sul': '#9b5de5'
  };

  getForaniaColor(forania: string) {
    return this.foraniaColors[forania] || '#888888';
  }


  // Igrejas
  styleIgrejas = (feature: any, resolution: number) => {
    const forania = feature.get('Forania');
    const nome = feature.get('Nome');

    const showLabel = resolution <= this.zoomToResolution4326(12);

    return new Style({
      image: new CircleStyle({
        radius: 6,
        stroke: new Stroke({
          color: '#000',
          width: 2
        }),
        fill: new Fill({
          color: this.getForaniaColor(forania)
        })
      }),
      text: showLabel
        ? new Text({
          text: nome || '',
          font: 'bold 14px sans-serif',
          fill: new Fill({ color: '#000' }),
          stroke: new Stroke({ color: '#fff', width: 2 }),
          offsetY: -15
        })
        : undefined

    });
  }

  // Municípios
  styleMunicipios = (feature: any, resolution: number) => {

    const nome = feature.get('NOME');
    const showLabel = resolution >= this.zoomToResolution4326(12);

    return new Style({
      stroke: new Stroke({
        color: '#000',
        width: 1
      }),
      fill: new Fill({
        color: 'rgba(0,0,0,0)' // sem preenchimento
      }),
      text: showLabel
        ? new Text({
          text: nome || '',
          font: '12px sans-serif',
          fill: new Fill({ color: '#3f3f3fff' }),
          stroke: new Stroke({ color: '#fff', width: 0 }),
          offsetY: -10
        })
        : undefined
    });
  }

  // Foranias
  styleForanias = (feature: any, resolution: number) => {
    const forania = feature.get('FORANIA');

    const showFill = resolution >= this.zoomToResolution4326(12);

    const fillColor = showFill
      ? this.hexToRgba(this.getForaniaColor(forania), 0.7)
      : 'rgba(0,0,0,0)';

    return new Style({
      fill: new Fill({ color: fillColor }),
      stroke: new Stroke({
        color: '#333333ff',
        width: 1,
        lineDash: [5, 10] // traço de 6px, espaço de 4px
      }),
      text: showFill
        ? new Text({
          text: forania || '',
          font: 'bold 16px sans-serif',
          fill: new Fill({ color: this.getForaniaColor(forania) }),
          stroke: new Stroke({ color: '#fff', width: 2 }),
          offsetY: 0
        })
        : undefined
    });
  }

  // Conversor Hex -> RGBA
  hexToRgba(hex: string, alpha: number) {
    const bigint = parseInt(hex.replace('#', ''), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }




}



