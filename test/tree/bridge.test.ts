import { mock } from 'jest-mock-extended';

import { TreeSelectionListener } from '../../src/main/ojTreeModel';
import { TreeSelectionBridge } from '../../src/tree/bridge';
import { NodeLifecycleListener, NodeLifecycleSupport, NodeModelController, NodeSelectionListener } from '../../src/tree/model';

test("Select and Unselect", () => {

    const node1 = mock<NodeModelController>();
    Object.defineProperty(node1, "nodeId", { value: 1 });

    const nls = mock<NodeLifecycleSupport>();

    const bridge: TreeSelectionBridge = new TreeSelectionBridge(nls)

    const lifecycleListener: NodeLifecycleListener =
        nls.addLifecycleListener.mock.calls[0][0] as NodeLifecycleListener;

    lifecycleListener.nodeAdded({ node: node1 });

    const nsl1: NodeSelectionListener =
        node1.addSelectionListener.mock.calls[0][0] as NodeSelectionListener;

    const listener: TreeSelectionListener = mock<TreeSelectionListener>();

    bridge.addSelectionListener(listener);

    expect(listener.selectionChanged).not.toBeCalled();

    nsl1.nodeSelected();

    expect(listener.selectionChanged).toBeCalledWith({
        toNodeId: 1
    });

    nsl1.nodeUnselected();

    expect(listener.selectionChanged).toBeCalledWith({
        fromNodeId: 1
    });

    expect(node1.unselect).not.toBeCalled();
});

test("Select, add, select new", () => {

    const node1 = mock<NodeModelController>();
    Object.defineProperty(node1, "nodeId", { value: 1 });
    const node2 = mock<NodeModelController>();
    Object.defineProperty(node2, "nodeId", { value: 2 });

    const nls = mock<NodeLifecycleSupport>();

    const bridge: TreeSelectionBridge = new TreeSelectionBridge(nls)

    const lifecycleListener: NodeLifecycleListener =
        nls.addLifecycleListener.mock.calls[0][0] as NodeLifecycleListener;

    lifecycleListener.nodeAdded({ node: node1 });

    const nsl1: NodeSelectionListener =
        node1.addSelectionListener.mock.calls[0][0] as NodeSelectionListener;

    const listener: TreeSelectionListener = mock<TreeSelectionListener>();

    bridge.addSelectionListener(listener);

    expect(listener.selectionChanged).not.toBeCalled();

    nsl1.nodeSelected();

    expect(listener.selectionChanged).toBeCalledWith({
        toNodeId: 1
    });

    lifecycleListener.nodeAdded({ node: node2 });

    const nsl2: NodeSelectionListener =
        node2.addSelectionListener.mock.calls[0][0] as NodeSelectionListener;

    nsl2.nodeSelected();

    expect(listener.selectionChanged).toBeCalledWith({
        fromNodeId: 1,
        toNodeId: 2
    })

    expect(node1.unselect).toBeCalled();
});

test("Selection tracked and managed", () => {

    const node1 = mock<NodeModelController>();
    Object.defineProperty(node1, "nodeId", { value: 1 });
    const node2 = mock<NodeModelController>();
    Object.defineProperty(node2, "nodeId", { value: 2 });
    const node3 = mock<NodeModelController>();
    Object.defineProperty(node3, "nodeId", { value: 3 });

    const nls = mock<NodeLifecycleSupport>();

    const bridge: TreeSelectionBridge = new TreeSelectionBridge(nls)

    const lifecycleListener: NodeLifecycleListener =
        nls.addLifecycleListener.mock.calls[0][0] as NodeLifecycleListener;

    lifecycleListener.nodeAdded({ node: node1 });
    lifecycleListener.nodeAdded({ node: node2 });
    lifecycleListener.nodeAdded({ node: node3 });

    const nsl1: NodeSelectionListener =
        node1.addSelectionListener.mock.calls[0][0] as NodeSelectionListener;
    const nsl2: NodeSelectionListener =
        node2.addSelectionListener.mock.calls[0][0] as NodeSelectionListener;
    const nsl3: NodeSelectionListener =
        node3.addSelectionListener.mock.calls[0][0] as NodeSelectionListener;

    const listener: TreeSelectionListener = mock<TreeSelectionListener>();

    bridge.addSelectionListener(listener);

    expect(listener.selectionChanged).not.toBeCalled();

    nsl1.nodeSelected();

    expect(listener.selectionChanged).toBeCalledWith({
        toNodeId: 1
    });

    nsl3.nodeSelected();

    expect(listener.selectionChanged).toBeCalledWith({
        fromNodeId: 1,
        toNodeId: 3
    })

    expect(node1.unselect).toBeCalled();


});

test("Drag then Drop State tracked and managed", () => {

    const node1 = mock<NodeModelController>();
    Object.defineProperty(node1, "nodeId", { value: 1 });
    const node2 = mock<NodeModelController>();
    Object.defineProperty(node2, "nodeId", { value: 2 });

    const nls = mock<NodeLifecycleSupport>();

    const bridge: TreeSelectionBridge = new TreeSelectionBridge(nls)

    const lifecycleListener: NodeLifecycleListener =
        nls.addLifecycleListener.mock.calls[0][0] as NodeLifecycleListener;

    lifecycleListener.nodeAdded({ node: node1 });
    lifecycleListener.nodeAdded({ node: node2 });

    const nsl1: NodeSelectionListener =
        node1.addSelectionListener.mock.calls[0][0] as NodeSelectionListener;
    const nsl2: NodeSelectionListener =
        node2.addSelectionListener.mock.calls[0][0] as NodeSelectionListener;

    const listener: TreeSelectionListener = mock<TreeSelectionListener>();

    bridge.addSelectionListener(listener);

    nsl1.nodeSelected();
    nsl1.nodeBeingDragged();

    nsl2.dropHappened();

    expect(node1.dropComplete).toBeCalled();

    nsl1.nodeUnselected();

    // sanity check we don't go round in circles
    expect(node1.unselect).not.toBeCalled();

});

test("Drag then Cancel State tracked and managed", () => {

    const node1 = mock<NodeModelController>();
    Object.defineProperty(node1, "nodeId", { value: 1 });
    const node2 = mock<NodeModelController>();
    Object.defineProperty(node2, "nodeId", { value: 2 });

    const nls = mock<NodeLifecycleSupport>();

    const bridge: TreeSelectionBridge = new TreeSelectionBridge(nls)

    const lifecycleListener: NodeLifecycleListener =
        nls.addLifecycleListener.mock.calls[0][0] as NodeLifecycleListener;

    lifecycleListener.nodeAdded({ node: node1 });
    lifecycleListener.nodeAdded({ node: node2 });

    const nsl1: NodeSelectionListener =
        node1.addSelectionListener.mock.calls[0][0] as NodeSelectionListener;
    const nsl2: NodeSelectionListener =
        node2.addSelectionListener.mock.calls[0][0] as NodeSelectionListener;

    const listener: TreeSelectionListener = mock<TreeSelectionListener>();

    bridge.addSelectionListener(listener);

    nsl1.nodeSelected();
    nsl1.nodeBeingDragged();

    // a stopped drag calls mouse up on the original which causes unselect.
    nsl1.nodeUnselected();

    nsl2.dropHappened();

    expect(node1.dropComplete).not.toBeCalled();

    // sanity check we don't go round in circles
    expect(node1.unselect).not.toBeCalled();
});
