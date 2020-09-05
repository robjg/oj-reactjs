
export function definedOrError<T>(  maybe: T | undefined | null, message : string = "Undefined") : T {

    if (maybe) {
        return maybe
    }
    else {
        throw new Error(message);
    }
}