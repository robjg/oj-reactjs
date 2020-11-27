import React, { ReactNode } from 'react';
import { Action } from '../menu/actions';
import { JobMenu } from '../menu/menu';
import { ImageData, ojRemoteSession } from '../remote/ojremotes';
import { ChildrenChangedEvent, NodeFactory, NodeIconListener, NodeModelController, NodeSelectionListener, NodeStructureListener, ProxyNodeModelController, SessionNodeFactory } from './model';


const emptyImageStyle = {
    display: 'inline-block',
    width: '20px',
    height: '16px'
}

const emptyImage = <span style={emptyImageStyle} >&nbsp;</span>;


export type ProxyTreeProps = {

    model: NodeModelController;
}

enum Toggle {
    NONE,
    COLLAPSED,
    EXPANDED
}

type ProxyTreeState = {

    children: NodeModelController[];

    icon: ReactNode;

    toggle: Toggle;

    selected: boolean;

    actions: Action[] | null;
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
            toggle: Toggle.NONE,
            selected: false,
            actions: null
        };

        this.toggleSelect = this.toggleSelect.bind(this);
        this.actionsOff = this.actionsOff.bind(this);
        this.findActions = this.findActions.bind(this);
    }

    componentDidMount() {
        this.props.model.addIconListener(this.iconListener);
        this.props.model.addStructureListener(this.structureListener);
        this.props.model.addSelectionListener(this.selectionListener);
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
            // not expanded if children go.
            const expanded: Toggle = event.children.length == 0 ? Toggle.NONE : this.state.toggle;
            this.setState({
                children: event.children,
                toggle: expanded
            });
        },

        nodeExpanded: (): void => {

            this.setState({ toggle: Toggle.EXPANDED });
        },

        nodeCollapsed: (): void => {

            this.setState({ toggle: Toggle.COLLAPSED });
        }
    }

    private selectionListener: NodeSelectionListener = {

        nodeSelected: (): void => {

            this.setState({
                selected: true
            });
        },

        nodeUnselected: (): void => {

            this.setState({
                selected: false,
                actions: null
            });
        }
    }

    private toggleSelect(): void {
        if (this.state.selected) {
            this.props.model.unselect();
        }
        else {
            this.props.model.select();
        }
    }

    renderToggleImage(): ReactNode {
        switch (this.state.toggle) {
            case Toggle.NONE:
                return <></>;
            case Toggle.COLLAPSED:
                return <img src={ProxyTree.PLUS_IMG_SRC} className="toggle" alt="expaned" title="expand" onClick={this.props.model.expand} />
            case Toggle.EXPANDED:
                return <img src={ProxyTree.MINUS_IMG_SRC} className="toggle" alt="collapse" title="collapse" onClick={this.props.model.collapse} />;
        }
    }

    private actionsOff() {
        this.setState({
            actions: null
        });
    }

    private findActions() {
        this.props.model.provideActions()
            .then(actions => this.setState({
                actions: actions
            }));
    }

    renderConextMenu(): ReactNode {

        if (this.state.actions) {
            return <JobMenu actions={this.state.actions} onMenuSelected={this.actionsOff}/>
        }
        else {
            if (this.state.selected) {
                return <button onClick={this.findActions}>...</button>
            }
            else {
                return <></>
            }
        }
    } 

    render() {

        const selected = this.state.selected ? "selected" : "";
        const labelClasses= `nodeLabel ${selected}`;
        return (
            <li>{this.renderToggleImage()}
                {this.state.icon}
                <span className={labelClasses}><a onClick={this.toggleSelect}>{this.nodename}</a></span>
                {this.renderConextMenu()}
                {this.state.toggle == Toggle.EXPANDED ?
                    <ul>{this.state.children.map(e => <ProxyTree key={e.uniqueId} model={e} />)}</ul> :
                    <></>}
            </li>
        );

    }
}

type TreeRootProps = {

    nodeFactory: NodeFactory;
}

type TreeRootState = {

    root: NodeModelController | null;
}

export class TreeRoot extends React.Component<TreeRootProps, TreeRootState> {

    constructor(props: TreeRootProps) {
        super(props);

        this.state = {
            root: null
        }
    }

    componentDidMount() {

        this.props.nodeFactory.createNode(1)
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
