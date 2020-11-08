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

    readonly nodeName: string;

    readonly nodeId: number;

    private expanded: boolean = false;

    private selectionListeners: NodeSelectionListener[] = [];

    private structureListeners: NodeStructureListener[] = [];

    private iconListeners: NodeIconListener[] = [];

    private children: NodeModelController[] = [];

    private structureInitialised: boolean = false;

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
            const existing: number[] = this.children.map(e => e.nodeId)

            const result: DiffOp<number>[] = arrayDiff(existing, event.children);
            if (result.length > 0) {

                const promises: Promise<DiffOp<NodeModelController | number>>[] = result.map(op => {
                    if (op.op == Op.INSERT) {
                        const insertPromise: Promise<NodeModelController> = 
                             this.nodeFactory.createNode(op.value);

                        return insertPromise.then( node => 
                            ({ op: op.op, value: node, index: op.index }));
                    }
                    else {
                        return Promise.resolve(op);
                    }
                });

                Promise.all(promises)
                    .then((ops: DiffOp<NodeModelController | number>[]) => {
                        ops.forEach(op => {
                            if (op.op == Op.INSERT) {
                                this.children.splice(op.index, 0, op.value as NodeModelController)
                            }
                            else {
                                const existing: NodeModelController = this.children[op.index];
                                if (existing.nodeId != op.value as number) {
                                    throw new Error("This should never happen");
                                }
                                existing.destroy();
                                this.children.splice(op.index, 1);
                            }
                        });

                        this.structureInitialised = true;
                        this.fireStructureChanged();
                    });
            }
            else {
                this.structureInitialised = true;
            }
        }
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

    private fireStructureChanged(): void {

        const event = {
            children: this.children,
        };

        this.structureListeners.forEach(e => e.childrenChanged(event));
    }

    select: () => void = () => {
        this.selectionListeners.forEach(e => e.nodeSelected());
    }

    unselct: () => void = () => {
        this.selectionListeners.forEach(e => e.nodeUnselected());
    }

    expand: () => void = () => {
        this.expanded = true;
        this.structureListeners.forEach(e => e.nodeExpanded());
    }

    collapse: () => void  = () => {
        this.expanded = false;
        this.structureListeners.forEach(e => e.nodeCollapsed());
    }


    addSelectionListener(listener: NodeSelectionListener): void {
        this.selectionListeners.push(listener);
    }

    addStructureListener(listener: NodeStructureListener): void {
        if (this.structureInitialised) {
            listener.childrenChanged({
                children: this.children
            });
        }
        if (this.expanded) {
            listener.nodeExpanded();
        }
        else {
            listener.nodeCollapsed();
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
