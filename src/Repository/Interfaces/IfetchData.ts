import { IrequestOptions } from "./irequestOptions";
export interface IfetchData {

    makeRequest<T>(requestOptions:IrequestOptions): Promise<T>
}