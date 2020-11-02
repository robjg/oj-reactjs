import React, { ReactNode } from 'react';
import { ImageData, ojRemoteSession } from '../remote/ojremotes';
import { RemoteConnection, RemoteSession } from '../remote/remote';
import { ChildrenChangedEvent, NodeFactory, NodeIconListener, NodeModelController, NodeStructureListener, ProxyNodeModelController, SessionNodeFactory } from './model';


const emptyImageStyle = {
    height: '20px',
    width: '20px'
}

const emptyImage = <div style={emptyImageStyle} />


export type ProxyTreeProps = {

    proxy: NodeModelController;

}

type ProxyTreeState = {

    children: NodeModelController[];

    icon: ReactNode;

    toggle: ReactNode;
}


export class ProxyTree extends React.Component<ProxyTreeProps, ProxyTreeState> {

    private readonly nodename: string;

    constructor(props: ProxyTreeProps) {
        super(props);

        const proxy = this.props.proxy;

        this.nodename = proxy.nodeName;

        this.state = {
            children: [],
            icon: emptyImage,
            toggle: <></>
        };
    }

    componentDidMount() {
        this.props.proxy.addIconListener(this.iconListener);
        this.props.proxy.addStructureListener(this.structureListener);
    }

    childrenExpanded = () => {

    }

    private iconListener: NodeIconListener = {

        iconChanged: (imageData: ImageData) => {

            const img: ReactNode =
            <img src={"data:" + imageData.mediaType + ";base64," + imageData.bytes}
                alt={imageData.description}
                title={imageData.description} />;

            this.setState({ icon: img });
        }
    }

    private structureListener: NodeStructureListener = {

        childrenChanged: (event: ChildrenChangedEvent): void => {
            this.setState({ children: event.children });
        },

        nodeExpanded: (): void => {

            const minusImage = <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAASxJREFUeNpi/P//PwMlgImBQkCxASwwRlLLKwYmJqZgRkbGbiBXEYva+0Dvlv7792/tvBoxTAO+fv0MororE6UU9VU5MHRfvP1DsX3+M5DhaxkYsBjw5s0bEKWoq6zA8OvXL7AYKIC/f//O8OPHDwYZIVaQGqjLlDENePfuLZj+/fs3GH/58pXh/fv3YDYIcHBwwtVgDYMvX76B6b9//zIYhezEULhtiglcDVYD/v+HMH/+/MNweqUnhsIPHz7B1WA1gJ2dH+oCZqCf/2IoZGPjhqvBmg4enyxj4OYWuX/2+l+gYk4MfPH2P7A8SB1WF3x+fUbs4+NtEzrmRxUxMH6Vx7Dq/9+HQPmJQHVSQN4zmDAjLC8AExA3kOIDMQkkvs9APZ8xDBi6mQkgwADDMYZH9Ls66AAAAABJRU5ErkJggg=="
            className="toggle" alt="collapse" title="collapse" onClick={this.props.proxy.collapse} />;
    
            this.setState( { toggle : minusImage });
        },

        nodeCollapsed: (): void => {

            const plusImage = <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAURJREFUeNpi/P//PwMlgImBQkCxASwwRlLLKwYmJqZgRkbGbiBXEYva+0Dvlv7792/tvBoxTAO+fv0MororE6UU9VU5MHRfvP1DsX3+M5DhaxkYxDC98ObNGxBW1FVmY/j16xcYu6SdYvjw4QPDixcvGGSEvoLlQeqweuHdu7dg+vfv32D85ctXsNijR4/B4hwcnHA1WA348uUbmP779y+DUchOuIKQsltgetsUE7garAb8/w9h/vz5h+H0Sk8w2yRsN8OZVa5g9ocPn+BqsBrAzs4PdQEzw48ff+Fi375B2Gxs3HA1WNPB45NlDNzcIvfPXv8LVMwJxmdWOcDZF2//A8uD1GF1wefXZ8Q+Pt42oWN+VBED41d5DKv+/30IlJ8IVCcF5D2DCTPC8gIwAXEDKT4Qk0Di+wzU8xnDgKGbmQACDAAtTZadqmiADQAAAABJRU5ErkJggg=="
            className="toggle" alt="expaned" title="expand" onClick={this.props.proxy.expand} />;

            this.setState( { toggle : plusImage });
        }
    }

    private changeToggle = (img: ReactNode) => {
        this.setState({
            toggle: img
        });
    }

    render() {
        return (
            <li>{this.state.toggle}{this.nodename}{this.state.icon}
                {this.props.proxy.isStructural ?
                   this.state.children.forEach( e => <ProxyTree key={e.nodeId} proxy={e} />) : 
                        <></> }
            </li>
        );

    }
}

type OjRootProps = {

    remote: RemoteConnection;
}

type OjRootState = {

    root: ReactNode;
}

export class OjRoot extends React.Component<OjRootProps, OjRootState> {

    private readonly nodeFactory: NodeFactory; 

    constructor(props: OjRootProps) {
        super(props);

        const session: RemoteSession = ojRemoteSession(props.remote);

        this.nodeFactory = new SessionNodeFactory(session);

        this.state = {
            root: <></>
        }
    }

    componentDidMount() {

        this.nodeFactory.createNode(1)
        .then(node => {
            this.setState( { root: <ProxyTree proxy={node} /> });
        } )        
    }

    render() {
        return this.state.root;
    }
}
