import { IconEvent, Iconic, IconListener, ImageData, ObjectProxy, Structural, StructuralEvent } from "../remote/ojremotes";
import { RemoteProxy, RemoteSession } from "../remote/remote";
import { arrayDiff, DiffOp, Op } from "./util";


export interface NodeController {

    select(): void;

    unselct(): void;

    expand(): void;

    collapse(): void;
}

export interface NodeModelController extends NodeModel, NodeController {

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
 * Define callback for when selection is changed.
 */
export interface NodeSelectionListener {

    /**
     * Called when a user selects node.
     *
     * @param event
     */
    nodeSelected(): void;

    nodeUnselected(): void;
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


export interface NodeFactory {

    createNode(nodeId: number): Promise<NodeModelController>;
}

class Tracker {

    private nodeTracker: Map<number, NodeModelController> = new Map();

    add(nodeId: number, ProxyTree: NodeModelController) { }
}

export class SessionNodeFactory implements NodeFactory {

    readonly tracker: Tracker

    constructor(readonly session: RemoteSession) {
        this.tracker = new Tracker();
    }

    async createNode(nodeId: number): Promise<NodeModelController> {

        const proxy = await this.session.getOrCreate(nodeId);

        return new ProxyNodeModelController(proxy, this);
    }
}


export class ProxyNodeModelController implements NodeModelController {

    private static nodeCount = 0; 

    readonly nodeName: string;

    readonly nodeId: number;

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

    constructor(readonly proxy: RemoteProxy, readonly nodeFactory: NodeFactory) {

        this.nodeId = proxy.remoteId;

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
                        this.fireCollapse();
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

        return {
            iconEvent: (event: IconEvent) => {
                iconic.iconForId(event.iconId)
                    .then((imageData: ImageData) => {
                        this.icon = imageData;
                        this.iconListeners.forEach(l => l.iconChanged(imageData));
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
        this.selectionListeners.forEach(e => e.nodeSelected());
    }

    unselct: () => void = () => {
        this.selectionListeners.forEach(e => e.nodeUnselected());
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

    destroy(): void {
        this.proxy.destroy();
    }

}