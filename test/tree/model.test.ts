import {  mock } from 'jest-mock-extended';

import { JavaClass } from '../../src/remote/java';
import { Iconic, IconListener, ImageData, Structural, StructuralListener } from '../../src/remote/ojremotes';
import { RemoteProxy } from '../../src/remote/remote';
import { ChildrenChangedEvent, NodeFactory, NodeIconListener, NodeModelController, NodeStructureListener, ProxyNodeModelController } from '../../src/tree/model';
import { Phaser } from '../testutil';


test("Structure Changes Broadcast", async () => {

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
    
    const nodeFactory = new class NfStub implements NodeFactory {
        createNode(nodeId: number): Promise<NodeModelController> {
            if (nodeId == 2) {
                const promise: Promise<NodeModelController> = Promise.resolve(n2);
                return promise;
            }
            if (nodeId == 3) {
                return Promise.resolve(n3);
            }
            throw new Error('Method not implemented for ' + nodeId);
        }
    }



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
    
    proxyMc.addStructureListener(listener);

    await phaser.next();

    expect(listener.expanded).toBe(false);
    expect(listener.children).toStrictEqual([n2, n3]);

    proxyMc.expand();

    expect(listener.expanded).toBe(true);

    expect(sl.length).toBe(1);
    sl[0].childEvent({ remoteId: 1, children: [3]});

    await phaser.next();

    expect(listener.children).toStrictEqual([n3]);
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
    
    const nodeFactory = new class NfStub implements NodeFactory {
        createNode(nodeId: number): Promise<NodeModelController> {
            if (nodeId == 2) {
                const promise: Promise<NodeModelController> = Promise.resolve(n2);
                return promise;
            }
            if (nodeId == 3) {
                return Promise.resolve(n3);
            }
            throw new Error('Method not implemented for ' + nodeId);
        }
    }


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

    remoteListener[0].iconEvent({ remoteId: 1, iconId: "bar"});

    await phaser.next();

    expect(iconResults.length).toBe(2);
    expect(iconResults[1].description).toBe("bar");
})


