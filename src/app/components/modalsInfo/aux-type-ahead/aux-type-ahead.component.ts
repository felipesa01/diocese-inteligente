import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { Observable, OperatorFunction, catchError, debounceTime, distinctUntilChanged, lastValueFrom, map, of, switchMap, take, tap } from 'rxjs';
import { ApisConectionService } from 'src/app/services/apis-conection.service';


@Component({
  selector: 'app-aux-type-ahead',
  templateUrl: './aux-type-ahead.component.html',
  styleUrls: ['./aux-type-ahead.component.css']
})
export class AuxTypeAheadComponent implements OnChanges, AfterViewInit {

  @Input() attribute: string;
  @Input() layerSource: string;
  @Input() type: string;
  @Input() isRange: boolean = false;
  @Input() ismap: boolean = false;
  @Input() value: { main: string | boolean, second: string } = { main: undefined, second: undefined };
  @Output() sendValue = new EventEmitter<{ main: string | boolean, second: string }>();
  secondValue: string;
  dateIsRange = false;
  searching = false;
  searchFailed = false;

  options;

  // typeMapper = {
  //   'int': 'text',
  //   'string': 'text',
  //   'boolean': 'checkbox',
  //   'date': 'date'
  // }

  constructor(private apiConection: ApisConectionService) {

  }

  ngAfterViewInit() {
    // console.log(this.ismap);
    if (this.ismap) this.getValuesToSelect();
  }

  ngOnChanges(changes: SimpleChanges): void {

    if (changes['isRange'] && changes['isRange']?.previousValue != changes['isRange']?.currentValue) {
      this.dateIsRange = changes['isRange'].currentValue;
    }

    if (changes['value'] && changes['value']?.previousValue != changes['value']?.currentValue) {
      this.value = changes['value'].currentValue;
    }
  }

  search: OperatorFunction<string, readonly string[]> = (text$: Observable<string>) => {
    // var layerSource = this.data.fonteGS_back ? this.data.fonteGS_back : this.data.fonteGS_front;
    var result = text$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => (this.searching = true)),
      switchMap((term) => {
        if (this.type != 'date') {
          var values = this.apiConection.searchAttributesAutoComplete(this.layerSource, this.attribute, term).pipe(
            tap(() => (this.searchFailed = false)),
            catchError(() => {
              this.searchFailed = true;
              return of([]);
            }),
          )
          return values
        }
        else {
          return of([])
        }
      }
      ),
      tap(() => (this.searching = false)),
    )
    return result
  }

  // Para solucionar o problema da seta do teclado nao provocar o scroll
  // https://github.com/ng-bootstrap/ng-bootstrap/issues/1119
  scroll($event: any) {
    const elem = $event.currentTarget.nextElementSibling.getElementsByClassName('active')[0];
    elem.scrollIntoView({ behavior: 'auto', block: 'nearest' });
  }

  // get selectValue() {
  //   if (this.type == 'date') return this.value
  //   else return this.secondValue;
  // }

  onChange() {
    this.sendValue.emit({ main: this.value.main, second: this.value.second });
  }


  async getValuesToSelect() {
    this.searching = true
    this.apiConection.getAttributeDomain(this.layerSource, this.attribute).pipe(
      debounceTime(3000),
      tap(() => (this.searching = true)),
      map(e => {
        this.options = e.features.map(item => item['properties']['value'])
      }),
      tap(() => (this.searching = false))
    ).subscribe()
    this.searching = false;
  }

}
