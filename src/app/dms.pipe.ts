import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dms'
})
export class DmsPipe implements PipeTransform {

  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }

}
