import React from 'react';
import { RemoteInvoker } from '../../../src/remote/invoke';
import { RemoteSessionFactory, ConfigurationOwner } from '../../../src/remote/remote';
import { DesignModel, ParserDesignModel } from '../../../src/design/design';
import { DesignForm } from '../../../src/design/designForm';

type RemoteDesignState = {

    remoteId: string;
    result: string;
    designModel?: DesignModel;
}

type RemoteDesignProps = {

    invoker: RemoteInvoker;
}

export class RemoteDesignForm extends React.Component<RemoteDesignProps, RemoteDesignState> {

    constructor(props: RemoteDesignProps) {
        super(props);
        this.state = {
            remoteId: '',
            result: '',
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

                            const configOwner: ConfigurationOwner = 
                                proxy1.as(ConfigurationOwner);

                            configOwner.formFor(proxy2)
                                .then(formText => {
                                    const designModel = new ParserDesignModel(
                                        {
                                            formConfiguration: JSON.parse(formText),
                                            saveAction: (config: any) => ({}),
                                            newForm: (element: string, isComponent: boolean) =>
                                                configOwner.blankForm(isComponent, element, "")
                                        });

                                    this.setState({
                                        designModel: designModel,
                                        result: formText
                                    });
                                });
                        }
                        else {
                            this.setState({ result: `Not an ${typeof ConfigurationOwner}` });
                        }
                    })
            });
    }


    render() {
        const noDisplay = {
            display: "none"
        }

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
                <div>
                    {
                        this.state.designModel ?
                            <DesignForm designModel={this.state.designModel}
                                hideForm={() => this.setState({ designModel: undefined })} />
                            : <div style={noDisplay} />
                    }
                </div>
            </>);
    }

}

