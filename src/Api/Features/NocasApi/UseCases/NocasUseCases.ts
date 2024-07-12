import { Injectable } from "@angular/core";
import { BaseUseCase } from "../../../BaseUseCase";
import { ICreateNocasResponseEntity, IcreateNocasRequestParams } from "../Interfaces/ICreateNocasRequestParams";
import { CreateNocasUseCase } from "./CreateNocasUseCase";

@Injectable({
    providedIn: 'root',
  })
export class NocasUseCases {
createNocas:BaseUseCase<IcreateNocasRequestParams,ICreateNocasResponseEntity>
constructor(createNocasUseCase:CreateNocasUseCase){
this.createNocas = createNocasUseCase
}
    
}