import { IconEvent, Iconic, IconListener, ImageData, ObjectProxy, Structural, StructuralEvent } from "../remote/ojremotes";
import { RemoteProxy, RemoteSession } from "../remote/remote";


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

    private selectionListeners: NodeSelectionListener[] = [];

    private structureListeners: NodeStructureListener[] = [];

    private iconListeners: NodeIconListener[] = [];

    private children: NodeModelController[] = [];

    private structural: Structural | null;

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
            const iconic: Iconic = proxy.as(Iconic);
            iconic.addIconListener(this.iconListenerFor(iconic));
        }

    }

    get isStructural() {
        return this.structural != null;
    }

    private structuralListener = {
        childEvent: (event: StructuralEvent) => {
            const existing: number[] = this.children.map(e => e.nodeId)
            if (this.compareNodeList(existing, event.children)) {
                this.fireStructureChanged();
            }
        }
    }

    private iconListenerFor(iconic: Iconic): IconListener {

        return {
            iconEvent: (event: IconEvent) => {
                iconic.iconForId(event.iconId)
                    .then((imageData: ImageData) => {
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

    private childInserted(nodeId: number, index: number): void {

        this.nodeFactory.createNode(nodeId)
            .then(node => {
                this.children.push(node);
            });

    }

    private childDeleted(nodeId: number, index: number): void {

        this.children[index].destroy();
        this.children = this.children.splice(index, 1);
    }

    private compareNodeList(nodes1: number[], nodes2: number[]): boolean {

        let changed: boolean = false;

        var lastI = 0, insertPoint = 0;

        for (var j = 0; j < nodes2.length; ++j) {

            var found = false;

            for (var i = lastI; i < nodes1.length; ++i) {

                if (nodes2[j] == nodes1[i]) {

                    for (; lastI < i; ++lastI) {
                        this.childDeleted(nodes1[lastI], insertPoint);
                        changed = true;
                    }
                    ++lastI;
                    ++insertPoint;
                    found = true;
                    break;
                }
            }

            if (!found) {
                this.childInserted(nodes2[j], insertPoint++);
                changed = true;
            }
        }

        for (var i = lastI; i < nodes1.length; ++i) {
            this.childDeleted(nodes1[i], insertPoint);
            changed = true;
        }

        return changed;
    }

    select(): void {
        this.selectionListeners.forEach(e => e.nodeSelected());
    }

    unselct(): void {
        this.selectionListeners.forEach(e => e.nodeUnselected());
    }

    expand(): void {
        this.structureListeners.forEach(e => e.nodeExpanded);
    }

    collapse(): void {
        this.structureListeners.forEach(e => e.nodeCollapsed);
    }


    addSelectionListener(listener: NodeSelectionListener): void {
        this.selectionListeners.push(listener);
    }

    addStructureListener(listener: NodeStructureListener): void {
        this.structureListeners.push(listener);
    }

    addIconListener(listener: NodeIconListener): void {
        this.iconListeners.push(listener);
    }

    destroy(): void {
        this.proxy.destroy();
    }

}
