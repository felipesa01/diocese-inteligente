import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: 'input[sisgepFormatter]'
})
export class SisgepFormatterDirective {

  constructor(private _el: ElementRef) { }

  @HostListener('input', ['$event']) onInputChange(event) {
    const initalValue = this._el.nativeElement.value.trim().replaceAll('.', '').replaceAll(',', '').replace(/[^0-9-.]*/g, '');

    var finalValue = ''
    for (let i = 0; i <= 12; i += 3) {
      finalValue += initalValue.slice(i, i + 3);
      if (i <= 9 && i + 3 < initalValue.length) {
        finalValue = `${finalValue}.`
      }
    }
    this._el.nativeElement.value = finalValue;
    event.stopPropagation();
  }

}
