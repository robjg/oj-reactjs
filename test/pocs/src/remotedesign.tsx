import React from 'react';
import { RemoteInvoker } from '../../../src/remote/invoke';
import { RemoteSession, RemoteSessionFactory, ConfigurationOwner } from '../../../src/remote/remote';

type RemoteDesignState = {

    remoteId: string;
    result: string;
}

type RemoteDesignProps = {

    invoker: RemoteInvoker;
}

export class RemoteDesignForm extends React.Component<RemoteDesignProps, RemoteDesignState> {

    constructor(props: RemoteDesignProps) {
        super(props);
        this.state = {
            remoteId: '',
            result: ''
        };

        this.handleChangeRemoteId = this.handleChangeRemoteId.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChangeRemoteId(event: React.FormEvent<HTMLInputElement>) {
        this.setState({ remoteId: event.currentTarget.value });
    }


    handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
        event.preventDefault();

        const remoteId = parseInt(this.state.remoteId);

        if (remoteId == NaN) {
            alert(`Remote Id ${this.state.remoteId} is not a number`);
            return;
        }

        const remoteSession = new RemoteSessionFactory(this.props.invoker)
            .createRemoteSession();

        remoteSession.getOrCreate(1)
           .then(proxy1 => {
                remoteSession.getOrCreate(remoteId)
                   .then(proxy2 => {

                    if (proxy1.isA(ConfigurationOwner)) {
                        proxy1.as(ConfigurationOwner).formFor(proxy2)
                            .then(formText => this.setState({ result: formText}));
                    }
                    else {
                        this.setState({ result: `Not an ${typeof ConfigurationOwner}` });
                    }
                })
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
                    </ul>

                    <input type="submit" value="OK" />
                </form>
                <div>
                    {this.state.result}
                </div>
            </>);
    }

}
