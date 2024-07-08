import { Injectable } from "@angular/core";
import { IrequestOptions } from "../../../Repository/Interfaces/IrequestOptions";
import { FetchData } from "../../../Repository/fetch-data";
import { ICreateNocasResponseEntity, IcreateNocasRequestParams } from "./Interfaces/ICreateNocasRequestParams";
import { nocasUrls } from "./nocasUrls";


@Injectable({
    providedIn: 'root',
  })
export class NocasRepository {
    constructor(private fetchData:FetchData){}

async createNocas(request:IcreateNocasRequestParams):Promise<ICreateNocasResponseEntity>{
    let requestOptions = { method: 'POST', url: nocasUrls.createNocas, body: request }
    return await this.fetchData.makeRequest<ICreateNocasResponseEntity>(requestOptions)
}


}