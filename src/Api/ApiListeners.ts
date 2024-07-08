export interface ApiListeners<T> {


    ifSuccess: (data: T) => void; ifError: (error: Error) => void
}