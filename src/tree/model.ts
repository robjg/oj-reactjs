import { Logger, LoggerFactory } from "../logging";
import { Clipboard } from "../clipboard";
import { Action, ActionContext, ActionFactories, ActionFactory, ActionSet } from "../menu/actions";
import { IconEvent, Iconic, IconListener, ImageData, ObjectProxy, Structural, StructuralEvent } from "../remote/ojremotes";
import { RemoteProxy, RemoteSession } from "../remote/remote";
import { arrayDiff, DiffOp, Op } from "./util";


export interface NodeController {

    select(): void;

    unselect(): void;

    expand(): void;

    collapse(): void;

    // this node is being dragged
    beingDragged(): void;

    // a drop occured near this node (on/before)
    dropHappened(): void;

    // this node has been dropped within our tree.
    dropComplete(): void;
}

export interface NodeModelController extends NodeModel, NodeController {

    provideActions(): ActionSet
}

export type ChildrenChangedEvent = {

    children: NodeModelController[];
}


/**
 * Define callbacks for when node is changed.
 */
export interface NodeStructureListener {

    childrenChanged(event: ChildrenChangedEvent): void;

    /**
     * Called when user expands node.
     *
     * @param event
     */
    nodeExpanded(): void;

    /**
     * Called when user collapses node
     *
     * @param event
     */
    nodeCollapsed(): void;

}

/**
 * Define callback for when a node selection is changed.
 */
export interface NodeSelectionListener {

    /**
     * Called when a node is selected.
     */
    nodeSelected(): void;

    /**
     * Called when a node is unselected.
     */
    nodeUnselected(): void;

    nodeBeingDragged(): void;
    
    dropHappened(): void;

    nodeDropped(): void;
}

export interface NodeIconListener {

    iconChanged(imageData: ImageData): void;
}


export interface NodeModel {

    readonly nodeName: string;

    readonly nodeId: number;

    readonly uniqueId: number;

    readonly isStructural: boolean;

    readonly isIconic: boolean;

    addSelectionListener(listener: NodeSelectionListener): void;

    addStructureListener(listener: NodeStructureListener): void;

    addIconListener(listener: NodeIconListener): void;

    destroy(): void;
}

export type NodeLifecycleEvent = {
    node: NodeModelController
}

/**
 * Something that wishes to receive notifications when nodes ({@link NodeModelController}) are added or
 * removed from a tree node.
 */
export interface NodeLifecycleListener {

    nodeAdded(event: NodeLifecycleEvent): void;

    nodeRemoved(event: NodeLifecycleEvent): void;
}

export interface NodeLifecycleSupport {

    addLifecycleListener(listener: NodeLifecycleListener): void;
}

export interface NodeFactory {

    createNode(nodeId: number): Promise<NodeModelController>;

}

export interface NodeActionFactory extends NodeFactory {

    provideActions(): ActionSet;

    nodeRemoved(node: NodeModelController): void;
}

/**
 * Things required to create {@link Action}s.
 */
export type ActionSettings = {

    readonly actionFactories: ActionFactory[];

    readonly clipboard: Clipboard;
}

/**
 * Helps the {@link SessionNodeFactory} create nodes that can provide actions by maintaning an
 * hierarchical {@link ActionContext}.
 */
class ProxyNodeHelperImpl implements NodeActionFactory {

    private actionContext: ActionContext;

    constructor(readonly proxy: RemoteProxy,
        readonly factory: SessionNodeFactory,
        readonly actionSettings: ActionSettings,
        readonly parent?: ProxyNodeHelperImpl) {

        this.actionContext = {

            proxy: proxy,

            parent: parent ? parent.actionContext : null,

            clipboard: actionSettings.clipboard
        }
    }

    createNode(childId: number): Promise<NodeModelController> {

        return this.factory.createNodeWithHelper(childId, this);
    }

    provideActions(): ActionSet {

        return new ActionFactories(this.actionSettings.actionFactories)
            .actionsFor(this.actionContext);
    }

    nodeRemoved(node: NodeModelController): void {
        this.factory.nodeRemoved(node);
    }
}

export class SessionNodeFactory implements NodeFactory, NodeLifecycleSupport {

    private readonly lifecycleListeners: NodeLifecycleListener[] = [];

    constructor(readonly session: RemoteSession,
        readonly actionSettings: ActionSettings) {
    }

    addLifecycleListener(listener: NodeLifecycleListener): void {
        this.lifecycleListeners.push(listener);
    }

    async createNode(nodeId: number): Promise<NodeModelController> {

        return this.createNodeWithHelper(nodeId);
    }

    async createNodeWithHelper(nodeId: number,
        parentHelper?: ProxyNodeHelperImpl): Promise<NodeModelController> {

        const proxy = await this.session.getOrCreate(nodeId);

        const helper = new ProxyNodeHelperImpl(proxy, this, this.actionSettings, parentHelper);

        const newNode = new ProxyNodeModelController(proxy, helper);

        this.lifecycleListeners.forEach(l => l.nodeAdded({ node: newNode }));

        return newNode;
    }

    nodeRemoved(node: NodeModelController): void {
        this.lifecycleListeners.forEach(l => l.nodeRemoved({ node: node }));
    }
}

/**
 * This is the main implementation class for Node Model and Controller.
 */
export class ProxyNodeModelController implements NodeModelController {

    private static nodeCount = 0;

    private readonly logger: Logger = LoggerFactory.getLogger(ProxyNodeModelController);

    readonly nodeName: string;

    readonly uniqueId = ++ProxyNodeModelController.nodeCount;

    private selectionListeners: NodeSelectionListener[] = [];

    private structureListeners: NodeStructureListener[] = [];

    private iconListeners: NodeIconListener[] = [];

    // childIds will only be null during initialisation
    private childIds: number[] | null = null;

    // child nodes will be null when node collapsed.
    private childNodes: NodeModelController[] | null = null;

    private structural: Structural | null;

    private iconic: Iconic | null;

    private icon: ImageData | null = null;

    private selected: boolean = false;

    constructor(readonly proxy: RemoteProxy,
        readonly nodeFactory: NodeActionFactory) {

        if (proxy.isA(ObjectProxy)) {
            this.nodeName = proxy.as(ObjectProxy).toString;
        }
        else {
            this.nodeName = "No Name";
        }

        if (proxy.isA(Structural)) {
            this.structural = proxy.as(Structural);
            this.structural.addStructuralListener(this.structuralListener);
        }
        else {
            this.structural = null;
        }

        if (proxy.isA(Iconic)) {
            this.iconic = proxy.as(Iconic);
            this.iconic.addIconListener(this.iconListenerFor(this.iconic));
        }
        else {
            this.iconic = null;
        }
    }

    get nodeId() {
        return this.proxy.remoteId;
    }

    get isStructural() {
        return this.structural != null;
    }

    get isIconic() {
        return this.iconic != null;
    }

    private structuralListener = {
        childEvent: (event: StructuralEvent) => {
            if (this.childNodes) {
                if (event.children.length == 0) {
                    this.removeChildren();
                    this.fireStructureChanged([]);
                }
                else {
                    this.updateChildNodes(event.children)
                }
            }
            else {
                // Allow view to change if we got between children and no children
                if (this.childIds) {
                    if (this.childIds.length == 0) {
                        if (event.children.length == 0) {
                            this.logger.warn("This is a bug caused by the server sending the structural notification multiple times.");
                        }
                        else {
                            this.fireCollapse();
                        }
                    }
                    else if (event.children.length == 0) {
                        this.fireStructureChanged([]);
                    }
                }
                else {
                    this.childIds = event.children;
                    if (this.childIds.length == 0) {
                        this.fireStructureChanged([]);
                    }
                    else {
                        this.fireCollapse();
                    }
                }
            }
            this.childIds = event.children;
        }
    }

    private updateChildNodes(newIds?: number[]): void {

        if (!this.childIds) {
            throw Error("Null child ids - should never happen");
        }

        let result: DiffOp<number>[];
        if (newIds) {
            result = arrayDiff(this.childIds, newIds);
        }
        else {
            result = this.childIds.map((e, i) =>
                ({ op: Op.INSERT, value: e, index: i }));
        }

        if (result.length == 0) {
            throw Error("No updates = should never happen");
        }

        const promises: Promise<DiffOp<NodeModelController | number>>[] = result.map(op => {
            if (op.op == Op.INSERT) {
                const insertPromise: Promise<NodeModelController> =
                    this.nodeFactory.createNode(op.value);

                return insertPromise.then(node =>
                    ({ op: op.op, value: node, index: op.index }));
            }
            else {
                return Promise.resolve(op);
            }
        });

        Promise.all(promises)
            .then((ops: DiffOp<NodeModelController | number>[]) => {

                if (!this.childNodes) {
                    this.childNodes = [];
                }

                ops.forEach(op => {
                    if (op.op == Op.INSERT) {
                        (this.childNodes as NodeModelController[]).splice(op.index, 0, op.value as NodeModelController)
                    }
                    else {
                        const existing: NodeModelController = (this.childNodes as NodeModelController[])[op.index];
                        if (existing.nodeId != op.value as number) {
                            throw new Error("This should never happen");
                        }
                        existing.destroy();
                        (this.childNodes as NodeModelController[]).splice(op.index, 1);
                    }
                });

                this.fireStructureChanged(this.childNodes);
            });

    }

    private removeChildren(): void {

        if (!this.childNodes) {
            throw new Error("No child nodes - should be impossible")
        }
        this.childNodes.forEach(e => e.destroy());
        this.childNodes = null;
    }


    private iconListenerFor(iconic: Iconic): IconListener {

        let lastIconId: string | null = null;

        return {
            iconEvent: (event: IconEvent) => {
                const iconId = event.iconId;
                lastIconId = iconId;
                iconic.iconForId(iconId)
                    .then((imageData: ImageData) => {
                        // only update if another update hasn't beaten this one.
                        if (lastIconId == iconId) {
                            this.icon = imageData;
                            this.iconListeners.forEach(l => l.iconChanged(imageData));
                        }
                    });
            }
        };
    }

    private fireStructureChanged(childNodes: NodeModelController[]): void {

        const event = {
            children: childNodes,
        };

        this.structureListeners.forEach(e => e.childrenChanged(event));
    }

    private fireCollapse(): void {

        this.structureListeners.forEach(e => e.nodeCollapsed());
    }

    select: () => void = () => {
        this.selected = true;
        this.selectionListeners.forEach(e => e.nodeSelected());
    }

    unselect: () => void = () => {
        this.selected = false;
        this.selectionListeners.forEach(e => e.nodeUnselected());
    }

    beingDragged: () => void = () => {
        this.selectionListeners.forEach(e => e.nodeBeingDragged());
    }

    dropHappened: () => void = () => {
        this.selectionListeners.forEach(e => e.dropHappened());
    }

    dropComplete: () => void = () => {
        this.selectionListeners.forEach(e => e.nodeDropped());
    }

    expand: () => void = () => {
        if (!this.childIds || this.childIds.length == 0) {
            throw new Error("Can't expand a node without children.");
        }

        this.updateChildNodes();

        this.structureListeners.forEach(e => e.nodeExpanded());
    }

    collapse: () => void = () => {
        if (!this.childNodes) {
            throw new Error("Can't collapse a node without children.");
        }

        this.removeChildren();

        this.fireCollapse();
    }


    addSelectionListener(listener: NodeSelectionListener): void {
        if (this.selected) {
            listener.nodeSelected();
        }

        this.selectionListeners.push(listener);
    }

    addStructureListener(listener: NodeStructureListener): void {
        if (this.childNodes) {
            listener.childrenChanged({
                children: this.childNodes
            });
            listener.nodeExpanded();
        }
        else if (this.childIds) {
            if (this.childIds.length == 0) {
                listener.childrenChanged({
                    children: []
                })
            }
            else {
                listener.nodeCollapsed();
            }
        }

        this.structureListeners.push(listener)
    }

    addIconListener(listener: NodeIconListener): void {
        if (this.icon) {
            listener.iconChanged(this.icon);
        }
        this.iconListeners.push(listener);
    }

    provideActions(): ActionSet {

        return this.nodeFactory.provideActions();
    }

    destroy(): void {
        if (this.childNodes) {
            // should we fire collapse?
            this.childNodes.forEach(child => child.destroy());
        }
        if (this.selected) {
            this.unselect();
        }
        this.nodeFactory.nodeRemoved(this);
        this.proxy.destroy();
    }

}
