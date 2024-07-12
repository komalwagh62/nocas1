
import { NocasRepository } from "../NocasRepository";
import { BaseUseCase } from "../../../BaseUseCase";
import { ICreateNocasResponseEntity, IcreateNocasRequestParams } from "../Interfaces/ICreateNocasRequestParams";
import { Injectable } from "@angular/core";


@Injectable({
    providedIn: 'root',
  })
export class CreateNocasUseCase extends BaseUseCase<IcreateNocasRequestParams,ICreateNocasResponseEntity>{

constructor(private NocasRepo:NocasRepository){
    super();
}

async fetchResult(Req: IcreateNocasRequestParams): Promise<ICreateNocasResponseEntity> {
   return await this.NocasRepo.createNocas(Req)
}
}