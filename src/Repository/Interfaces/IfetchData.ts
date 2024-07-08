import { IrequestOptions } from "./IrequestOptions";
export interface IfetchData {

    makeRequest<T>(requestOptions:IrequestOptions,callbacks?: { ifSuccess: (data: T) => void; ifError: (error: Error) => void }): Promise<T>
}