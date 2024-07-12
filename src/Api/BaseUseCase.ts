import { error } from "jquery";
import { ApiListeners } from "./ApiListeners";

export abstract class BaseUseCase<R, T> {

    protected abstract fetchResult(Req: R): Promise<T>


    async execute(callbacks: ApiListeners<T>, Req: R) {
        await this.fetchResult(Req).then((result: T) => {
            callbacks.ifSuccess(result)
        })
            .catch((error) => {
                callbacks.ifError(error)
            })


    }
}