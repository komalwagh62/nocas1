import { Injectable } from '@angular/core';
import { NocasUseCases } from '../UseCases/NocasUseCases';
import { NocasPresenter } from '../NocasPresenter';

@Injectable({
  providedIn: 'root'
})

export class NocasServiceService {
  nocasPresenter: NocasPresenter;

  constructor(useCases: NocasUseCases) {
    this.nocasPresenter = new NocasPresenter(useCases)


   }


  

}
