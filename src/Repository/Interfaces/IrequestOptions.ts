import { Head } from "rxjs"

export interface IrequestOptions{
    readonly method: string 
    readonly url: string
    readonly headers?: Record<string, string>; 
    readonly body?: {[key:string]:any} 
    readonly token?: string
}