import { TreeSelectionEvent, TreeSelectionListener, TreeSelectionModel } from "../main/ojTreeModel";
import { NodeLifecycleEvent, NodeLifecycleListener, NodeLifecycleSupport, NodeModelController, NodeSelectionListener } from "./model";


export class TreeSelectionBridge implements TreeSelectionModel {

    private readonly listeners: TreeSelectionListener[] = []

    private lastSelectedNode: NodeModelController | null = null;

    private thisIsUs: boolean = false;

    constructor(lifecycleSupport: NodeLifecycleSupport) {

        const self = this;

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