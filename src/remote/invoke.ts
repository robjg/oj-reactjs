
export class OperationType {

    constructor(readonly name: string,
        readonly type: string,
        readonly signature: string[]) {

    }
}

export class InvokeRequest {

    constructor(readonly remoteId: number,
        readonly operationType: OperationType,
        readonly args: Object[]) {

    }
}

const operationTypes: Map<String, OperationType> = new Map();


export function invokeRequest() {


}


export class RemoteInvoker {



}


