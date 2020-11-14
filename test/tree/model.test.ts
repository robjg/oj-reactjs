import { mock, mockReset } from 'jest-mock-extended';
import { Action } from '../../src/menu/actions';
import { OperationType } from '../../src/remote/invoke';

import { JavaClass } from '../../src/remote/java';
import { Notification, NotificationListener } from '../../src/remote/notify';
import { IconData, IconEvent, Iconic, IconicHandler, IconListener, ImageData, Structural, StructuralListener } from '../../src/remote/ojremotes';
import { ClientToolkit, RemoteProxy } from '../../src/remote/remote';
import { ChildrenChangedEvent, NodeActionFactory, NodeFactory, NodeIconListener, NodeModelController, NodeSelectionListener, NodeStructureListener, ProxyNodeModelController } from '../../src/tree/model';
import { Latch, Phaser } from '../testutil';


test("Structure Changes Broadcast from 2 nodes to 1", async () => {

    let sl: StructuralListener[] = [];

    const p1 = new class ProxyStub implements RemoteProxy {
        remoteId: number = 1;
        isA(cntor: new (...args: any[]) => any): boolean {
            if (cntor == Structural) {
                return true;
            }
            else {
                return false;
            }
        }
        as<T>(cntor: new (...args: any[]) => T): T {
            if (cntor as unknown == Structural) {
                return new class Impl implements Structural {
                    addStructuralListener(listener: StructuralListener): void {
                        listener.childEvent({ remoteId: 1, children: [2, 3] })
                        sl.push(listener);
                    }
                    removeStructuralListener(listener: StructuralListener): void {
                        throw new Error('Method not implemented.');
                    }
                    getJavaClass(): JavaClass<Structural> {
                        throw new Error('Method not implemented.');
                    }

                } as unknown as T
            }
            else {
                throw new Error('Unexpected with ' + cntor);
            }
        }
        destroy(): void {
            throw new Error('Method not implemented.');
        }

    };

    let n2: NodeModelController = mock<NodeModelController>();
    (n2 as any).nodeId = 2;

    let n3: NodeModelController = mock<NodeModelController>();
    (n3 as any).nodeId = 3;


    const nodeFactory: NodeActionFactory = mock<NodeActionFactory>();
    nodeFactory.createNode = (nodeId: number): Promise<NodeModelController> => {
            if (nodeId == 2) {
                const promise: Promise<NodeModelController> = Promise.resolve(n2);
                return promise;
            }
            if (nodeId == 3) {
                return Promise.resolve(n3);
            }
            throw new Error('Method not implemented for ' + nodeId);
        };

    const proxyMc = new ProxyNodeModelController(p1, nodeFactory);

    expect(proxyMc.isStructural).toBe(true);

    const phaser: Phaser = new Phaser();

    class StubListener implements NodeStructureListener {

        index = 0;
        expanded: boolean | undefined = undefined;
        children: NodeModelController[] = [];

        nodeExpanded: () => void = () => {
            this.expanded = true;
        }

        nodeCollapsed: () => void = () => {
            this.expanded = false;
        }

        childrenChanged: (event: ChildrenChangedEvent) => void =
            (event: ChildrenChangedEvent) => {
                this.children = event.children;
                phaser.release();
            }
    };

    const listener = new StubListener();

    expect(listener.expanded).toBe(undefined);

    proxyMc.addStructureListener(listener);

    expect(listener.expanded).toBe(false);

    proxyMc.expand();

    await phaser.next();

    expect(listener.expanded).toBe(true);

    expect(listener.children).toStrictEqual([n2, n3]);

    expect(sl.length).toBe(1);
    sl[0].childEvent({ remoteId: 1, children: [3] });

    await phaser.next();

    expect(listener.children).toStrictEqual([n3]);
});

test("Structural No Children and None Added", () => {

    const structural: Structural = mock<Structural>();

    const proxy = mock<RemoteProxy>();
    proxy.isA.calledWith(Structural).mockReturnValue(true);
    proxy.as.calledWith(Structural).mockReturnValue(structural);

    const nodeFactory = mock<NodeActionFactory>();

    const proxyMc = new ProxyNodeModelController(proxy, nodeFactory);

    const remoteListener: StructuralListener =
        (structural.addStructuralListener as any).mock.calls[0][0];

    const nodeListener = mock<NodeStructureListener>();

    // listen to the model

    proxyMc.addStructureListener(nodeListener);

    // send event - event could arrive first but probably not in real life because of synchronise.

    remoteListener.childEvent({ remoteId: 1, children: [] });

    // And check what we get

    expect(nodeListener.nodeCollapsed).not.toBeCalled();
    expect(nodeListener.nodeExpanded).not.toBeCalled();

    const event: ChildrenChangedEvent = nodeListener.childrenChanged.mock.calls[0][0];
    
    expect(event.children.length).toBe(0);

    // sanity check

    expect(nodeFactory.createNode).not.toBeCalled();
});

test("Give Structural with children when children removed then notification of 0 children only", () => {

    const structural: Structural = mock<Structural>();

    const proxy = mock<RemoteProxy>();
    proxy.isA.calledWith(Structural).mockReturnValue(true);
    proxy.as.calledWith(Structural).mockReturnValue(structural);

    const nodeFactory = mock<NodeActionFactory>();

    const proxyMc = new ProxyNodeModelController(proxy, nodeFactory);

    const remoteListener: StructuralListener =
        (structural.addStructuralListener as any).mock.calls[0][0];

    const nodeListener = mock<NodeStructureListener>();

    // listen to the model

    proxyMc.addStructureListener(nodeListener);

    // send event - event could arrive first but probably not in real life because of synchronise.

    remoteListener.childEvent({ remoteId: 1, children: [2, 3] });

    // And check what we get

    expect(nodeListener.nodeCollapsed).toBeCalledTimes(1);
    expect(nodeListener.nodeExpanded).not.toBeCalled();

    expect(nodeListener.childrenChanged).not.toBeCalled();

    // now remove nodes

    mockReset(nodeListener.nodeCollapsed);

    remoteListener.childEvent({ remoteId: 1, children: [] });

    const event: ChildrenChangedEvent = nodeListener.childrenChanged.mock.calls[0][0];
    
    expect(event.children.length).toBe(0);

    expect(nodeListener.nodeCollapsed).not.toBeCalled();
    expect(nodeListener.nodeExpanded).not.toBeCalled();

});

test("Icon Changes", async () => {

    let remoteListener: IconListener[] = [];

    const p1 = new class ProxyStub implements RemoteProxy {
        remoteId: number = 1;
        isA(cntor: new (...args: any[]) => any): boolean {
            if (cntor == Iconic) {
                return true;
            }
            else {
                return false;
            }
        }
        as<T>(cntor: new (...args: any[]) => T): T {
            if (cntor as unknown == Iconic) {
                return new class Impl extends Iconic {
                    addIconListener(listener: IconListener) {
                        listener.iconEvent({ remoteId: 1, iconId: "foo" });
                        remoteListener.push(listener);
                    }

                    removeIconListener(listener: IconListener) {
                        throw new Error('Method not implemented.');
                    }

                    iconForId(id: string): Promise<ImageData> {
                        return Promise.resolve(new ImageData("abc",
                            "image/gif", id));
                    }

                } as unknown as T
            }
            else {
                throw new Error('Unexpected with ' + cntor);
            }
        }
        destroy(): void {
            throw new Error('Method not implemented.');
        }

    };

    let n2: NodeModelController = mock<NodeModelController>();
    (n2 as any).nodeId = 2;

    let n3: NodeModelController = mock<NodeModelController>();
    (n3 as any).nodeId = 3;

    const nodeFactory: NodeActionFactory = mock<NodeActionFactory>()
    nodeFactory.createNode = (nodeId: number): Promise<NodeModelController>  => {
            if (nodeId == 2) {
                const promise: Promise<NodeModelController> = Promise.resolve(n2);
                return promise;
            }
            if (nodeId == 3) {
                return Promise.resolve(n3);
            }
            throw new Error('Method not implemented for ' + nodeId);
        };


    const proxyMc = new ProxyNodeModelController(p1, nodeFactory);

    expect(proxyMc.isIconic).toBe(true);

    const iconResults: ImageData[] = [];

    const phaser: Phaser = new Phaser();

    const listener: NodeIconListener = mock<NodeIconListener>();
    listener.iconChanged = (imageData: ImageData) => {
        iconResults.push(imageData);
        phaser.release();
    }

    proxyMc.addIconListener(listener);

    await phaser.next();

    expect(iconResults.length).toBe(1);
    expect(iconResults[0].description).toBe("foo");

    remoteListener[0].iconEvent({ remoteId: 1, iconId: "bar" });

    await phaser.next();

    expect(iconResults.length).toBe(2);
    expect(iconResults[1].description).toBe("bar");
})


test("Iconic Handler Copes if Icon arrives later than cached notification", async () => {

    const toolkit: ClientToolkit = mock<ClientToolkit>();

    const synchLatch = new Latch();
    const allDone = new Latch(2);

    toolkit.invoke = <T>(operationType: OperationType<T>, ...args: any): Promise<T> => {
        if (operationType == IconicHandler.ICON_FOR) {
            if (args[0] == "foo") {
                return Promise.resolve(new ImageData("abc", "image/gif", "foo")) as unknown as Promise<T>;
            }
            else if (args[0] == "bar") {
                const promise = new Promise<T>((resolve) => {
                    setInterval(() => {
                        resolve(new ImageData("xyz", "image/gif", "bar") as unknown as T)
                        
                    }, 100);
                });
                return promise;
            }
            else {
                throw new Error("Unexpected");
            }
        }
        else if (operationType == IconicHandler.SYNCHRONIZE) {
            const promise: Promise<T> = Promise.resolve(Notification.from(
                42, IconicHandler.ICON_CHANGED_NOTIF_TYPE,
                1000, new IconData("foo")) as unknown as T);
            promise.then(() => synchLatch.countDown())
            return promise;
        }
        else {
            throw new Error("Unexpected");
        }
    }

    const handler: Iconic = new IconicHandler().createHandler(toolkit);

    const remoteProxy = mock<RemoteProxy>();
    remoteProxy.isA.calledWith(Iconic).mockReturnValue(true);
    remoteProxy.as.calledWith(Iconic).mockReturnValue(handler);

    const nodeFactory: NodeActionFactory = mock<NodeActionFactory>();

    const proxyMc = new ProxyNodeModelController(remoteProxy, nodeFactory);

    const nodeIconListener = mock<NodeIconListener>();

    proxyMc.addIconListener(nodeIconListener);

    proxyMc.addIconListener({ iconChanged: (image) => {allDone.countDown()}})

    await synchLatch.promise;

    const notificationListener: NotificationListener<any> =
        (toolkit.addNotificationListener as any).mock.calls[0][1];

    notificationListener.handleNotification(Notification.from(
        42, IconicHandler.ICON_CHANGED_NOTIF_TYPE,
        1001, new IconData("bar")))

    notificationListener.handleNotification(Notification.from(
        42, IconicHandler.ICON_CHANGED_NOTIF_TYPE,
        1002, new IconData("foo")))

    await allDone.promise;

    const calls: any[][] = nodeIconListener.iconChanged.mock.calls;

    // bar icon change doesn't make it because second foo beats the image data.
    expect((calls[1][0] as ImageData).description).toBe("foo");
});

test("Tree Selection select deselect", () => {

    const remoteProxy = mock<RemoteProxy>();

    const nodeFactory: NodeActionFactory = mock<NodeActionFactory>();

    const proxyMc = new ProxyNodeModelController(remoteProxy, nodeFactory);

    const selectionListener = mock<NodeSelectionListener>();

    proxyMc.addSelectionListener(selectionListener);

    expect(selectionListener.nodeUnselected).toBeCalledTimes(1);
    expect(selectionListener.nodeSelected).toBeCalledTimes(0);

    proxyMc.select();

    expect(selectionListener.nodeUnselected).toBeCalledTimes(1);
    expect(selectionListener.nodeSelected).toBeCalledTimes(1);

    proxyMc.unselect();

    expect(selectionListener.nodeUnselected).toBeCalledTimes(2);
    expect(selectionListener.nodeSelected).toBeCalledTimes(1);
})

test("Provide Actions", async () => {


    const remoteProxy = mock<RemoteProxy>();

    const fooAction: Action = {
        name: "Foo",
        isEnabled: true,
        perform: () => {}
    }

    const nodeFactory = mock<NodeActionFactory>();
    nodeFactory.provideActions.mockReturnValue(Promise.resolve([fooAction]));

    const proxyMc = new ProxyNodeModelController(remoteProxy, nodeFactory);

    const actions = await proxyMc.provideActions();

    expect(actions.length).toBe(1);
    expect(actions[0].name).toBe("Foo");
});