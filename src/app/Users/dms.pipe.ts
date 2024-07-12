import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dms'
})
export class DmsPipe implements PipeTransform {

  transform(value: number, ...args: unknown[]): string {
    if (value === null || value === undefined) return '';

    const d = Math.floor(Math.abs(value));
    const m = Math.floor((Math.abs(value) - d) * 60);
    const s = ((Math.abs(value) - d - m / 60) * 3600).toFixed(2);

    const direction = value < 0 ? (args[0] === 'lat' ? 'S' : 'W') : (args[0] === 'lat' ? 'N' : 'E');
    return `${d}° ${m}' ${s}" ${direction}`;
  }
}
