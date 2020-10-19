import { JavaClass, javaClasses } from "./java";

export class OperationType<T> {

    constructor(readonly name: string,
        readonly type: string,
        readonly signature: string[]) {

    }

    static ofName<T>(name: string) {
        return { andDataType: (dataType: JavaClass<T>) => {
            return { withSignature: ( ...signature: JavaClass<any>[]) => {
                return new OperationType<T>(name, dataType.name, signature.map( e => e.name))
            } }
        }}
    }
}

export class InvokeRequest<T> {

    argTypes?: string[];

    constructor(readonly remoteId: number,
        readonly operationType: OperationType<T>,
        readonly args: any[]) {

    }
}

export class InvokeResponse<T> {

    constructor(readonly type: string,
        readonly value?: any) {

        }

    getJavaType(): JavaClass<T> | undefined {
        return javaClasses.forName(this.type);
    }    
}

function isInvokeResponse<T>(maybe: InvokeResponse<T> | any): maybe is InvokeResponse<T>{
    return (maybe as InvokeResponse<T>).type != undefined
}

export interface Invoker {

    invoke<T>(invokeRequest: InvokeRequest<T>) : Promise<InvokeResponse<T>>;
}

export class RemoteInvoker implements Invoker {

    constructor(readonly url: string) {

    }    

    async invoke<T>(invokeRequest: InvokeRequest<T>) : Promise<InvokeResponse<T>> {
        
        const jsonBody = JSON.stringify(invokeRequest);

        const response: Response = await fetch(this.url, {
                    method: 'POST', // *GET, POST, PUT, DELETE, etc.
                    mode: 'cors', // no-cors, *cors, same-origin
                    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
                    credentials: 'include', // include, *same-origin, omit
                    headers: {
                        'Content-Type': 'application/json'
                        // 'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    redirect: 'follow', // manual, *follow, error
                    referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
                    body:  jsonBody// body data type must match "Content-Type" header
                });

        if (response.status != 200) {
            throw new Error(`Response ${response.status}:${response.statusText} from ${this.url} for ${jsonBody}`)
        }

        if (!response.body) {
            throw new Error(`No body from ${this.url} for ${jsonBody}`);
        }

        const json = await response.json(); // parses JSON response into native JavaScript objects

        if (isInvokeResponse(json)) {
            return json;
        }
        else {
            throw new Error(`Not an InvokeResponse but ${JSON.stringify(json)} when invoke on ${this.url} for ${jsonBody}`);
        }
    }

}


