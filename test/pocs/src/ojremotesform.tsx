import React from 'react';

import { RemoteConnection, RemoteSession, RemoteSessionFactory } from '../../../src/remote/remote';
import { StateData, IconicHandler, Iconic, IconEvent, ImageData, ObjectHandler, ObjectProxy  } from '../../../src/remote/ojremotes';


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

        return <>Name: {this.state.toString}</>;
    }
}


type IconicState = {

    imageData: ImageData | null;

}

type IconicProps = {

    iconic: Iconic;
    
}

class IconicOut extends React.Component<IconicProps, IconicState> {

    constructor(props: IconicProps) {
        super(props);

        this.state = {imageData: null};
    }

    componentDidMount() {
        this.props.iconic.addIconListener({
        
            iconEvent: (event: IconEvent) => {
                this.props.iconic.iconForId(event.iconId)
                .then(imageData => {
                    console.log(imageData);
                    this.setState( { imageData: imageData });
                });       
            }
        });

    }

    render() {
        if (this.state.imageData == null ) {
            return <p>Loading...</p>
        }
        return <img src={"data:" + this.state.imageData.mediaType + ";base64," 
            + this.state.imageData.bytes}
            alt={this.state.imageData.description}
            title={this.state.imageData.description}/>;
    }
}


function Empty() {
    return <p>Not defined</p>
}


type RemotesState = {

    remoteId: string;
    iconic: Iconic | null;
    object: ObjectProxy | null;
}

type RemotesProps = {

    remote: RemoteConnection;
}



export class RemotesForm extends React.Component<RemotesProps, RemotesState> {

    constructor(props: RemotesProps) {
        super(props);
        this.state = {
            remoteId: '',
            iconic: null,
            object: null,
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

        const session: RemoteSession = RemoteSessionFactory.from(this.props.remote)
        .register(new ObjectHandler())
        .register(new IconicHandler())
        .createRemoteSession();

        session.getOrCreate(remoteId)
        .then(proxy => {

            if (proxy.isA(Iconic)) {
                this.setState({iconic: proxy.as(Iconic)});
            }
        
            if (proxy.isA( ObjectProxy )) {
                this.setState( { object: proxy.as( ObjectProxy ) } )
            }
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
                            <ObjectOut object={this.state.object}/>
                         : <Empty/>
                    }</td>
                    </tr>
                    <tr>
                        <th>Iconic</th>
                        <td>{
                        (this.state.iconic) ?
                            <IconicOut iconic={this.state.iconic}/>
                         : <Empty/>
                    }</td>
                    </tr>
                    </tbody>
                </table>
            </>);
    }

}
