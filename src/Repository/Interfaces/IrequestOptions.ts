import { Head } from "rxjs"

export interface IrequestOptions{
    readonly method: string 
    readonly url: string
    readonly headers?: Headers
    readonly body?: string
    readonly token?: string
}