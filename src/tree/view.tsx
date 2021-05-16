import React, { DragEventHandler, ReactNode } from 'react';
import { ActionSet } from '../menu/actions';
import { JobMenu } from '../menu/menu';
import { ImageData, ojRemoteSession } from '../remote/ojremotes';
import { ChildrenChangedEvent, NodeFactory, NodeIconListener, NodeModelController, NodeSelectionListener, NodeStructureListener, ProxyNodeModelController, SessionNodeFactory } from './model';
import { NodeState, InitialNodeState, SelectedState } from './nodestate';


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

    nodeState: NodeState;
}

export class ProxyTree extends React.Component<ProxyTreeProps, ProxyTreeState> {

    private static readonly MINUS_IMG_SRC = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAASxJREFUeNpi/P//PwMlgImBQkCxASwwRlLLKwYmJqZgRkbGbiBXEYva+0Dvlv7792/tvBoxTAO+fv0MororE6UU9VU5MHRfvP1DsX3+M5DhaxkYsBjw5s0bEKWoq6zA8OvXL7AYKIC/f//O8OPHDwYZIVaQGqjLlDENePfuLZj+/fs3GH/58pXh/fv3YDYIcHBwwtVgDYMvX76B6b9//zIYhezEULhtiglcDVYD/v+HMH/+/MNweqUnhsIPHz7B1WA1gJ2dH+oCZqCf/2IoZGPjhqvBmg4enyxj4OYWuX/2+l+gYk4MfPH2P7A8SB1WF3x+fUbs4+NtEzrmRxUxMH6Vx7Dq/9+HQPmJQHVSQN4zmDAjLC8AExA3kOIDMQkkvs9APZ8xDBi6mQkgwADDMYZH9Ls66AAAAABJRU5ErkJggg=="

    private static readonly PLUS_IMG_SRC = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAURJREFUeNpi/P//PwMlgImBQkCxASwwRlLLKwYmJqZgRkbGbiBXEYva+0Dvlv7792/tvBoxTAO+fv0MororE6UU9VU5MHRfvP1DsX3+M5DhaxkYxDC98ObNGxBW1FVmY/j16xcYu6SdYvjw4QPDixcvGGSEvoLlQeqweuHdu7dg+vfv32D85ctXsNijR4/B4hwcnHA1WA348uUbmP779y+DUchOuIKQsltgetsUE7garAb8/w9h/vz5h+H0Sk8w2yRsN8OZVa5g9ocPn+BqsBrAzs4PdQEzw48ff+Fi375B2Gxs3HA1WNPB45NlDNzcIvfPXv8LVMwJxmdWOcDZF2//A8uD1GF1wefXZ8Q+Pt42oWN+VBED41d5DKv+/30IlJ8IVCcF5D2DCTPC8gIwAXEDKT4Qk0Di+wzU8xnDgKGbmQACDAAtTZadqmiADQAAAABJRU5ErkJggg=="

    private readonly nodename: string;

    private actions: ActionSet;

    constructor(props: ProxyTreeProps) {
        super(props);

        const proxy = this.props.model;

        this.nodename = proxy.nodeName;

        this.actions = this.props.model.provideActions();

        this.state = {
            children: [],
            icon: emptyImage,
            toggle: Toggle.NONE,
            nodeState: new InitialNodeState({
                stateCallback: this.setNodeState,
                selectCallback: this.props.model.select,
                unselectCallback: this.props.model.unselect
            })
        };

        this.onMouseDown = this.onMouseDown.bind(this);
        this.menuOff = this.menuOff.bind(this);
        this.showMenu = this.showMenu.bind(this);
    }

    private setNodeState: (nodeState: NodeState) => void = (nodeState: NodeState) => {
        this.setState({
            nodeState: nodeState
        });
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

            this.state.nodeState.select();
        },

        nodeUnselected: (): void => {

            this.state.nodeState.unselect();
        }
    }

    private onMouseDown(): void {

        this.prepareDrag();
    }

    private prepareDrag(): void {

        if (this.actions.isDraggable) {
            this.state.nodeState.enquireDrag(this.actions.dragData);
        }
    }

    private onDrag(): DragEventHandler<Element> | undefined {
        return event => {
            console.log("onDrag: " + this.props.model.nodeId + " ");
        }
    }

    private onDragStart(): DragEventHandler<Element> | undefined {
        if (this.state.nodeState.isDraggable) {
            return event => {
                console.log("onDragStart: " + this.props.model.nodeId + " " + event);
                event.dataTransfer.setData("text/plain", this.state.nodeState.dragData);
            }
        }
        else {
            return undefined;
        }
    }

    private dropMaybe(): DragEventHandler<Element> | undefined {
        if (this.actions.isDropTarget) {
            return (event) => {
                const isData = event.dataTransfer.types.includes("text/plain");
                if (isData) {
                    event.preventDefault();
                }
            }
        }
        else {
            return undefined;
        }
    }

    private onDrop(): DragEventHandler<Element> | undefined {
        if (this.actions.isDropTarget) {
            return event => {
                const data = event.dataTransfer.getData("text/plain");
                if (data) {
                    this.actions.drop(data);
                    event.preventDefault();
                }
            }
        }
        else {
            return undefined;
        }
    }

    onDragEnd(): DragEventHandler<Element> | undefined {
        if (this.actions.isDraggable) {
            return event => {
                console.log("onDragEnd: " + this.props.model.nodeId + " " + event.dataTransfer.dropEffect);
                this.state.nodeState.unselect();
            }
        }
        else {
            return undefined;
        }
    }

    onDragExit(): DragEventHandler<Element> | undefined {
        console.log("onDragExit");
        return undefined;
    }

    onDragLeave(): DragEventHandler<Element> | undefined {
        console.log("onDragLeave");
        return undefined;
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

    private menuOff(): void {
        this.state.nodeState.menuOff();
    }

    private showMenu() {
        this.state.nodeState.menuOn();
    }

    private renderConextMenu(): ReactNode {

        switch (this.state.nodeState.selectedState) {
            case SelectedState.MENU:
                return <JobMenu actions={this.actions.actions} onMenuSelected={this.menuOff} />
            case SelectedState.SELECTED:
            case SelectedState.DRAGGABLE:
                return <button className="threeDots" onClick={this.showMenu}>...</button>
            default:
                return <></>
        }
    }

    private labelClasses(): string {
        switch (this.state.nodeState.selectedState) {
            case SelectedState.SELECTED:
            case SelectedState.MENU:
                return "nodeLabel selected";
            case SelectedState.DRAG_PENDING:
                return "nodeLabel drag-pending";
            case SelectedState.DRAGGABLE:
                return "nodeLabel draggable";
            default:
                return "nodeLabel";
        }
    }

    render() {

        return (
            <li>{this.renderToggleImage()}
                {this.state.icon}
                <span className={this.labelClasses()}
                    draggable={this.state.nodeState.isDraggable}
                    onDrag={this.onDrag()}
                    onDragStart={this.onDragStart()}
                    onDragEnter={this.dropMaybe()}
                    onDragOver={this.dropMaybe()}
                    onDrop={this.onDrop()}
                    onDragEnd={this.onDragEnd()}
                >
                    <a onMouseDown={this.onMouseDown}
                        onMouseUp={this.state.nodeState.toggleSelect}>{this.nodename}</a>
                </span>
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
