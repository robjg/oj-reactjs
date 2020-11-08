import React, { ReactNode } from 'react';
import { ImageData, ojRemoteSession } from '../remote/ojremotes';
import { RemoteConnection, RemoteSession } from '../remote/remote';
import { ChildrenChangedEvent, NodeFactory, NodeIconListener, NodeModelController, NodeStructureListener, ProxyNodeModelController, SessionNodeFactory } from './model';


const emptyImageStyle = {
    display: 'inline-block',
    width: '20px',
    height: '16px'
}

const emptyImage = <span style={emptyImageStyle} >&nbsp;</span>;


export type ProxyTreeProps = {

    model: NodeModelController;

}

type ProxyTreeState = {

    children: NodeModelController[];

    icon: ReactNode;

    expanded: boolean;
}


export class ProxyTree extends React.Component<ProxyTreeProps, ProxyTreeState> {

    private static readonly MINUS_IMG_SRC = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAASxJREFUeNpi/P//PwMlgImBQkCxASwwRlLLKwYmJqZgRkbGbiBXEYva+0Dvlv7792/tvBoxTAO+fv0MororE6UU9VU5MHRfvP1DsX3+M5DhaxkYsBjw5s0bEKWoq6zA8OvXL7AYKIC/f//O8OPHDwYZIVaQGqjLlDENePfuLZj+/fs3GH/58pXh/fv3YDYIcHBwwtVgDYMvX76B6b9//zIYhezEULhtiglcDVYD/v+HMH/+/MNweqUnhsIPHz7B1WA1gJ2dH+oCZqCf/2IoZGPjhqvBmg4enyxj4OYWuX/2+l+gYk4MfPH2P7A8SB1WF3x+fUbs4+NtEzrmRxUxMH6Vx7Dq/9+HQPmJQHVSQN4zmDAjLC8AExA3kOIDMQkkvs9APZ8xDBi6mQkgwADDMYZH9Ls66AAAAABJRU5ErkJggg=="

    private static readonly PLUS_IMG_SRC = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAURJREFUeNpi/P//PwMlgImBQkCxASwwRlLLKwYmJqZgRkbGbiBXEYva+0Dvlv7792/tvBoxTAO+fv0MororE6UU9VU5MHRfvP1DsX3+M5DhaxkYxDC98ObNGxBW1FVmY/j16xcYu6SdYvjw4QPDixcvGGSEvoLlQeqweuHdu7dg+vfv32D85ctXsNijR4/B4hwcnHA1WA348uUbmP779y+DUchOuIKQsltgetsUE7garAb8/w9h/vz5h+H0Sk8w2yRsN8OZVa5g9ocPn+BqsBrAzs4PdQEzw48ff+Fi375B2Gxs3HA1WNPB45NlDNzcIvfPXv8LVMwJxmdWOcDZF2//A8uD1GF1wefXZ8Q+Pt42oWN+VBED41d5DKv+/30IlJ8IVCcF5D2DCTPC8gIwAXEDKT4Qk0Di+wzU8xnDgKGbmQACDAAtTZadqmiADQAAAABJRU5ErkJggg=="

    private readonly nodename: string;

    constructor(props: ProxyTreeProps) {
        super(props);

        const proxy = this.props.model;

        this.nodename = proxy.nodeName;

        this.state = {
            children: [],
            icon: emptyImage,
            expanded: false
        };
    }

    componentDidMount() {
        this.props.model.addIconListener(this.iconListener);
        this.props.model.addStructureListener(this.structureListener);
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

            this.setState({ expanded: true });
        },

        nodeCollapsed: (): void => {

            this.setState({ expanded: false });
        }
    }

    renderToggleImage(): ReactNode {
        if (this.props.model.isStructural) {

            if (this.state.expanded) {
                if (this.state.children.length == 0) {
                    return <></>;
                }
                else {
                    return <img src={ProxyTree.MINUS_IMG_SRC} className="toggle" alt="collapse" title="collapse" onClick={this.props.model.collapse} />;
                }
            }
            else {
                return <img src={ProxyTree.PLUS_IMG_SRC} className="toggle" alt="expaned" title="expand" onClick={this.props.model.expand} />
            }
        }
        else {
            return <></>;
        }
    }

    render() {

        return (
            <li>{this.renderToggleImage()}
                {this.state.icon}
                <span className="nodeLabel"><a>{this.nodename}</a></span>
                {this.state.expanded ?
                    <ul>{this.state.children.map(e => <ProxyTree key={e.nodeId} model={e} />)}</ul> :
                    <></>}
            </li>
        );

    }
}

type OjRootProps = {

    remote: RemoteConnection;
}

type OjRootState = {

    root: NodeModelController | null;
}

export class OjRoot extends React.Component<OjRootProps, OjRootState> {

    private readonly nodeFactory: NodeFactory;

    constructor(props: OjRootProps) {
        super(props);

        const session: RemoteSession = ojRemoteSession(props.remote);

        this.nodeFactory = new SessionNodeFactory(session);

        this.state = {
            root: null
        }
    }

    componentDidMount() {

        this.nodeFactory.createNode(1)
            .then(node => {
                this.setState({ root: node });
            })
    }

    render() {
        if (this.state.root) {
            return <ul>
                    <ProxyTree model={this.state.root} />
                </ul>;
        }
        else {
            return <></>
        }
    }
}
