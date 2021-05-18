import { TreeSelectionEvent, TreeSelectionListener, TreeSelectionModel } from "../main/ojTreeModel";
import { NodeLifecycleEvent, NodeLifecycleListener, NodeLifecycleSupport, NodeModelController, NodeSelectionListener } from "./model";

/**
 * A Bridge from the new {@link NodeModelController} to the old {@link TreeSelectionModel}.
 * This class is also responsible for tracking selected node state and a node being dragged and 
 * then dropped.
 */
export class TreeSelectionBridge implements TreeSelectionModel {

    private readonly listeners: TreeSelectionListener[] = []

    private lastSelectedNode: NodeModelController | null = null;

    private beingDragged: NodeModelController | null = null;

    // Flag used to tell if we are unselecting a node as we'll get called as a listener.
    private thisIsUs: boolean = false;

    constructor(lifecycleSupport: NodeLifecycleSupport) {

        const self = this;

        // creates a new style listener
        function listenerFor(node: NodeModelController): NodeSelectionListener {

            return {

                nodeSelected: (): void => {
                    let lastNodeId: number | undefined = undefined;
                    if (self.lastSelectedNode) {                       
                        lastNodeId = self.lastSelectedNode.nodeId;
                        self.thisIsUs = true;
                        self.lastSelectedNode.unselect()
                        self.thisIsUs = false;
                    }
                    self.lastSelectedNode = node;
                    const selectionEvent: TreeSelectionEvent = {
                        fromNodeId: lastNodeId,
                        toNodeId: node.nodeId
                    }

                    self.listeners.forEach(l => l.selectionChanged(selectionEvent))
                },

                nodeUnselected: (): void => {
                    if (!self.thisIsUs) {
                        const lastNodeId = self.lastSelectedNode?.nodeId;
                        const selectionEvent: TreeSelectionEvent = {
                            fromNodeId: lastNodeId,
                        }
                        self.listeners.forEach(l => l.selectionChanged(selectionEvent))
                        self.lastSelectedNode = null;
                    }

                    self.beingDragged = null;
                },

                nodeBeingDragged: (): void => {
                    self.beingDragged = node;
                },

                dropHappened: (): void => {
                    if (self.beingDragged) {
                        self.beingDragged.dropComplete();
                        self.beingDragged = null;
                    }
                },

                nodeDropped: (): void => {
                    // the view listens to this.     
                }
            }
        }


        const lifecycleListener: NodeLifecycleListener = {
            nodeAdded: (event: NodeLifecycleEvent): void => {
                event.node.addSelectionListener(listenerFor(event.node))
            },
            nodeRemoved: (event: NodeLifecycleEvent): void => {

            }
        }

        lifecycleSupport.addLifecycleListener(lifecycleListener);
    }

    addSelectionListener(listener: TreeSelectionListener): void {
        this.listeners.push(listener);
    }

}