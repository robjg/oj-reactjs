import React from 'react';
import { RemoteInvoker, InvokeRequest, OperationType } from '../remote/invoke';

type InvokeState = {

    remoteId: string;
    method: string;
    returnType: string;
    argType1: string;
    argType2: string;
    argType3: string;
    actualType1: string;
    actualType2: string;
    actualType3: string;
    arg1: string;
    arg2: string;
    arg3: string;
    result: string;
}

type InvokeProps = {

    url: string;
}

export class InvokeForm extends React.Component<InvokeProps, InvokeState> {

    readonly invoker: RemoteInvoker

    constructor(props: InvokeProps) {
        super(props);
        this.invoker = new RemoteInvoker('http://localhost:8080/invoke')
        this.state = {
            remoteId: '',
            method: '',
            result: '',
            returnType: '',
            argType1: '',
            argType2: '',
            argType3: '',
            actualType1: '',
            actualType2: '',
            actualType3: '',
            arg1: '',
            arg2: '',
            arg3: ''
        };

        this.handleChangeRemoteId = this.handleChangeRemoteId.bind(this);
        this.handleChangeMethod = this.handleChangeMethod.bind(this);
        this.handleChangeReturnType = this.handleChangeReturnType.bind(this);
        this.handleChangeArgType1 = this.handleChangeArgType1.bind(this);
        this.handleChangeArgType2 = this.handleChangeArgType2.bind(this);
        this.handleChangeArgType3 = this.handleChangeArgType3.bind(this);
        this.handleChangeActualType1 = this.handleChangeActualType1.bind(this);
        this.handleChangeActualType2 = this.handleChangeActualType2.bind(this);
        this.handleChangeActualType3 = this.handleChangeActualType3.bind(this);
        this.handleChangeArg1 = this.handleChangeArg1.bind(this);
        this.handleChangeArg2 = this.handleChangeArg2.bind(this);
        this.handleChangeArg3 = this.handleChangeArg3.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChangeRemoteId(event: React.FormEvent<HTMLInputElement>) {
        this.setState({ remoteId: event.currentTarget.value });
    }

    handleChangeMethod(event: React.FormEvent<HTMLInputElement>) {
        this.setState({ method: event.currentTarget.value });
    }

    handleChangeReturnType(event: React.FormEvent<HTMLInputElement>) {
        this.setState({ returnType: event.currentTarget.value });
    }

    handleChangeArgType1(event: React.FormEvent<HTMLInputElement>) {
        this.setState({ argType1: event.currentTarget.value });
    }

    handleChangeArgType2(event: React.FormEvent<HTMLInputElement>) {
        this.setState({ argType2: event.currentTarget.value });
    }

    handleChangeArgType3(event: React.FormEvent<HTMLInputElement>) {
        this.setState({ argType3: event.currentTarget.value });
    }

    handleChangeActualType1(event: React.FormEvent<HTMLInputElement>) {
        this.setState({ actualType1: event.currentTarget.value });
    }

    handleChangeActualType2(event: React.FormEvent<HTMLInputElement>) {
        this.setState({ actualType2: event.currentTarget.value });
    }

    handleChangeActualType3(event: React.FormEvent<HTMLInputElement>) {
        this.setState({ actualType3: event.currentTarget.value });
    }

    handleChangeArg1(event: React.FormEvent<HTMLInputElement>) {
        this.setState({ arg1: event.currentTarget.value });
    }

    handleChangeArg2(event: React.FormEvent<HTMLInputElement>) {
        this.setState({ arg2: event.currentTarget.value });
    }

    handleChangeArg3(event: React.FormEvent<HTMLInputElement>) {
        this.setState({ arg3: event.currentTarget.value });
    }

    handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
        event.preventDefault();

        const remoteId = parseInt(this.state.remoteId);

        if (Number.isNaN(remoteId)) {
            alert(`Remote Id ${this.state.remoteId} is not a number`);
            return;
        }

        if (!this.state.method!) {
            alert("No Method");
            return;
        }

        if (!this.state.returnType!) {
            alert("No Return Type");
            return;
        }

        let signature: string[] = [];

        if (this.state.argType1) {
            signature.push(this.state.argType1);
            if (this.state.argType2) {
                signature.push(this.state.argType2);
                if (this.state.argType3) {
                    signature.push(this.state.argType3);
                }
            }
        }

        let args: any[] = [];
        if (this.state.arg1) {
            args.push(JSON.parse(this.state.arg1));
            if (this.state.arg2) {
                args.push(JSON.parse(this.state.arg2));
                if (this.state.arg3) {
                    args.push(JSON.parse(this.state.arg3));
                }
            }
        }

        let request = new InvokeRequest(remoteId,
            new OperationType(this.state.method, this.state.returnType, signature),
            args);

        if (this.state.actualType1) {
            let argTypes: string[] = [ this.state.actualType1 ]
            if (this.state.actualType2) {
                argTypes.push(this.state.actualType2);
                if (this.state.actualType3) {
                    argTypes.push(this.state.actualType3);
                }
            }
            request.argTypes = argTypes;
        }

        this.invoker.invoke(request)
            .then(invokeResponse => {

                const json = JSON.stringify(invokeResponse);

                this.setState({ result: json });
            });

    }

    render() {
        return (
            <>
                <form onSubmit={this.handleSubmit}>
                    <ul>
                        <li>
                            <label>Remote Id
            <input type="text" value={this.state.remoteId} onChange={this.handleChangeRemoteId} />
                            </label>
                        </li>
                        <li>
                            <label>Method Name
            <input type="text" value={this.state.method} onChange={this.handleChangeMethod} />
                            </label>

                        </li>
                        <li>
                            <label>Return Type
            <input type="text" value={this.state.returnType} onChange={this.handleChangeReturnType} />
                            </label>
                        </li>
                        <li>
                            <label>Arg Type 1
            <input type="text" value={this.state.argType1} onChange={this.handleChangeArgType1} />
                            </label>
                            <label>Arg 1
            <input type="text" value={this.state.arg1} onChange={this.handleChangeArg1} />
                            </label>
                            <label>Actual Type 1
            <input type="text" value={this.state.actualType1} onChange={this.handleChangeActualType1} />
                            </label>
                        </li>
                        <li>
                            <label>Arg Type 2
            <input type="text" value={this.state.argType2} onChange={this.handleChangeArgType2} />
                            </label>
                            <label>Arg 2
            <input type="text" value={this.state.arg2} onChange={this.handleChangeArg2} />
                            </label>
                            <label>Actual Type 2
            <input type="text" value={this.state.actualType2} onChange={this.handleChangeActualType2} />
                            </label>
                        </li>
                        <li>
                            <label>Arg Type 3
            <input type="text" value={this.state.argType3} onChange={this.handleChangeArgType3} />
                            </label>
                            <label>Arg 3
            <input type="text" value={this.state.arg3} onChange={this.handleChangeArg3} />
                            </label>
                            <label>Actual Type 3
            <input type="text" value={this.state.actualType3} onChange={this.handleChangeActualType3} />
                            </label>
                        </li>
                    </ul>

                    <input type="submit" value="OK" />
                </form>
                <div>
                    {this.state.result}
                </div>
            </>);
    }

}
