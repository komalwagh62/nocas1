import { Injectable } from "@angular/core";
import { ICreateNocasResponseEntity, IcreateNocasRequestParams } from "./Interfaces/ICreateNocasRequestParams";
import { NocasUseCases } from "./UseCases/NocasUseCases";


@Injectable({
    providedIn: 'root',
  })
export class NocasPresenter{
constructor(private useCases: NocasUseCases){}

createNocas(request:IcreateNocasRequestParams):Promise<ICreateNocasResponseEntity>{
return new Promise((resolve,reject)=>{
    this.useCases.createNocas.execute({ifSuccess:(data:ICreateNocasResponseEntity)=>{resolve(data)},ifError:(error:Error)=>{reject(error)}},request)
})
}



}


// ()=>{}  arrow function