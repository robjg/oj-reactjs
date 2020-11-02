import React, { ReactNode } from 'react';

import { RemoteConnection, RemoteProxy, RemoteSession, RemoteSessionFactory } from '../../../src/remote/remote';
import { StateData, IconicHandler, Iconic, IconEvent, ImageData, ObjectHandler, ObjectProxy, Structural, StructuralEvent, StructuralHandler } from '../../../src/remote/ojremotes';


function Empty() {
    return <p>Not defined</p>
}


interface AsyncCompProvider {

    subscribe(callback: (jsx: ReactNode) => void): void;
}

class AsyncCompProvider {

    last: ReactNode = <Empty />;

    callbacks: ((jsx: ReactNode) => void)[] = [];

    subscribe(callback: (jsx: ReactNode) => void): void {

        callback(this.last);
        this.callbacks.push(callback);
    }

    provide(jsx: ReactNode) {
        this.last = jsx;
        this.callbacks.forEach(cb => cb(jsx));
    }
}



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

class AsyncImage extends AsyncCompProvider {

    onIconic(iconic: Iconic) {

        iconic.addIconListener({

            iconEvent: (event: IconEvent) => {
                iconic.iconForId(event.iconId)
                    .then(imageData => {
                        const img: ReactNode =
                            <img src={"data:" + imageData.mediaType + ";base64," + imageData.bytes}
                                alt={imageData.description}
                                title={imageData.description} />;
                        this.provide(img);
                    });
            }
        });
    }
}

type IconicState = {

    img: ReactNode;

}

type IconicProps = {

    imgProvider: AsyncCompProvider;

}

class IconicOut extends React.Component<IconicProps, IconicState> {

    constructor(props: IconicProps) {
        super(props);

        this.state = { img: <></> };
    }

    componentDidMount() {
        this.props.imgProvider.subscribe(
            (img: ReactNode) => { this.setState({ img: img }) });
    }

    render() {
        return this.state.img;
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

export type InfoProps = {
    proxy: RemoteProxy;
}

export type InfoState = {

    object: ObjectProxy | null;
    structural: Structural | null;
}

export class RemoteInfo extends React.Component<InfoProps, InfoState> {

    private readonly imgProvider = new AsyncImage();

    constructor(props: InfoProps) {
        super(props);

        const proxy = this.props.proxy;

        let object = null;
        if (proxy.isA(ObjectProxy)) {
            object = proxy.as(ObjectProxy);
        }

        if (proxy.isA(Iconic)) {
            this.imgProvider.onIconic(proxy.as(Iconic));
        }

        let structural = null
        if (proxy.isA(Structural)) {
            structural =  proxy.as(Structural);
        }

        this.state = {
            object: object,
            structural: structural,
        };

    }

    componentWillUnmount() {

        this.props.proxy.destroy();
    }

    render() {
        return (
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
                            <IconicOut imgProvider={this.imgProvider} />
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
        );

    }

}

type RemotesState = {

    remoteId: string;
    children: ReactNode[];

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
            children: [ ]
        };

        this.handleChangeRemoteId = this.handleChangeRemoteId.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleDestroy = this.handleDestroy.bind(this);

        this.session = RemoteSessionFactory.from(this.props.remote)
            .register(new ObjectHandler())
            .register(new IconicHandler())
            .register(new StructuralHandler())
            .createRemoteSession();
    }

    handleChangeRemoteId(event: React.FormEvent<HTMLInputElement>) {
        this.setState({ remoteId: event.currentTarget.value });
    }

    handleDestroy(event: React.FormEvent<HTMLFormElement>) {
        this.setState({ children: [] });
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

                const children: ReactNode[]  = this.state.children;
                children.push(<RemoteInfo key={children.length + 1} proxy={proxy}/>);

                this.setState( {
                    children: children
                });
            });
    }

    render() {
        return (
            <>
                <form onSubmit={this.handleSubmit} onReset={this.handleDestroy}>
                    <ul>
                        <li>
                            <label>Remote Id
            <input type="text" value={this.state.remoteId} onChange={this.handleChangeRemoteId} />
                            </label>
                        </li>
                    </ul>

                    <input type="submit" value="OK" />
                    <input type="reset" value="Reset" />

                </form>
                <div>
                { this.state.children }
                </div>
            </>);
    }

}
