import React from 'react';

import { RemoteConnection, RemoteSession, RemoteSessionFactory } from '../../../src/remote/remote';
import { StateData, IconicHandler, Iconic, IconEvent, ImageData, ObjectHandler, ObjectProxy, Structural, StructuralEvent, StructuralHandler } from '../../../src/remote/ojremotes';

// Object

type ObjectProps = {

    object: ObjectProxy;
}

type ObjectState = {

    toString: string;
}

class ObjectOut extends React.Component<ObjectProps, ObjectState> {

    constructor(props: ObjectProps) {
        super(props);

        this.state = { toString: props.object.toString };
    }

    render() {

        return <>{this.state.toString}</>;
    }
}

// Iconic

type IconicState = {

    imageData: ImageData | null;

}

type IconicProps = {

    iconic: Iconic;

}

class IconicOut extends React.Component<IconicProps, IconicState> {

    constructor(props: IconicProps) {
        super(props);

        this.state = { imageData: null };
    }

    componentDidMount() {
        this.props.iconic.addIconListener({

            iconEvent: (event: IconEvent) => {
                this.props.iconic.iconForId(event.iconId)
                    .then(imageData => {
                        console.log(imageData);
                        this.setState({ imageData: imageData });
                    });
            }
        });
    }

    render() {
        if (this.state.imageData == null) {
            return <p>Loading...</p>
        }
        return <img src={"data:" + this.state.imageData.mediaType + ";base64,"
            + this.state.imageData.bytes}
            alt={this.state.imageData.description}
            title={this.state.imageData.description} />;
    }
}

// Structural

type StructuralState = {

    children: number[] | null;

}

type StructuralProps = {

    structural: Structural;

}

class StructuralOut extends React.Component<StructuralProps, StructuralState> {

    constructor(props: StructuralProps) {
        super(props);

        this.state = { children: null };
    }

    componentDidMount() {
        this.props.structural.addStructuralListener({

            childEvent: (event: StructuralEvent) => {
                this.setState({ children: event.children });
            }
        });
    }

    render() {
        if (this.state.children == null) {
            return <p>Loading...</p>
        }
        return <>{this.state.children.toString()}</>;
    }
}


function Empty() {
    return <p>Not defined</p>
}


type RemotesState = {

    remoteId: string;
    object: ObjectProxy | null;
    iconic: Iconic | null;
    structural: Structural | null;
}

type RemotesProps = {

    remote: RemoteConnection;
}

export class RemotesForm extends React.Component<RemotesProps, RemotesState> {

    readonly session: RemoteSession

    constructor(props: RemotesProps) {
        super(props);
        this.state = {
            remoteId: '',
            iconic: null,
            object: null,
            structural: null,
        };

        this.handleChangeRemoteId = this.handleChangeRemoteId.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);

        this.session = RemoteSessionFactory.from(this.props.remote)
            .register(new ObjectHandler())
            .register(new IconicHandler())
            .register(new StructuralHandler())
            .createRemoteSession();
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

        this.session.getOrCreate(remoteId)
            .then(proxy => {

                let object: ObjectProxy | null = null;
                let iconic: Iconic | null = null;
                let structural: Structural | null = null;

                if (proxy.isA(ObjectProxy)) {
                    object = proxy.as(ObjectProxy);
                }
                else {
                    object = null;
                }

                if (proxy.isA(Iconic)) {
                    iconic = proxy.as(Iconic);
                }
                else {
                    iconic = null;
                }

                if (proxy.isA(Structural)) {
                    structural = proxy.as(Structural);
                }
                else {
                    structural = null;
                }

                this.setState({ object: object,
                    iconic: iconic,
                    structural: structural });
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
                <table>
                    <tbody>
                        <tr>
                            <th>Object</th>
                            <td>{
                                (this.state.object) ?
                                    <ObjectOut object={this.state.object} />
                                    : <Empty />
                            }</td>
                        </tr>
                        <tr>
                            <th>Iconic</th>
                            <td>{
                                (this.state.iconic) ?
                                    <IconicOut iconic={this.state.iconic} />
                                    : <Empty />
                            }</td>
                        </tr>
                        <tr>
                            <th>Strucutural</th>
                            <td>{
                                (this.state.structural) ?
                                    <StructuralOut structural={this.state.structural} />
                                    : <Empty />
                            }</td>
                        </tr>
                    </tbody>
                </table>
            </>);
    }

}
