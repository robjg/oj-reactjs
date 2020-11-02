import { JavaClass, javaClasses, JavaObject } from './java';
import { Invoker, OperationType, InvokeRequest, InvokeResponse, RemoteInvoker } from './invoke';
import { NotificationListener, NotificationType, Notifier, RemoteNotifier } from './notify';
import { Logger } from '../logging';

export interface Destroyable {

    destroy(): void;
}

export interface RemoteProxy extends Destroyable {

    readonly remoteId: number;

    isA(cntor: { new(...args: any[]): any }): boolean;

    as<T>(cntor: { new(...args: any[]): T }): T;
}

export interface RemoteIdMappings {

    idFor(proxy: RemoteProxy): number | undefined;

    objectFor(remoteId: number): RemoteProxy | undefined;
}

export interface Transportable {

    importResolve(remoteIdMappings: RemoteIdMappings): RemoteProxy;
}

export interface Exportable {

    exportTransportable(): Transportable;
}

export interface RemoteConnection extends Invoker, Notifier {

}

export class RemoteConnection {

    static of(invoker: Invoker, notifier: Notifier): RemoteConnection {
        return new class {
            invoke<T>(invokeRequest: InvokeRequest<T>): Promise<InvokeResponse<T>> {
                return invoker.invoke(invokeRequest);
            }

            addNotificationListener<T>(remoteId: number,
                notificationType: NotificationType<T>,
                listener: NotificationListener<T>): void {
                notifier.addNotificationListener(remoteId, notificationType, listener);
            }

            removeNotificationListener<T>(remoteId: number,
                notificationType: NotificationType<T>,
                listener: NotificationListener<T>): void {
                notifier.removeNotificationListener(remoteId, notificationType, listener);
            }
        }
    }

    static fromHost(host: string): RemoteConnection {
        return RemoteConnection.of(new RemoteInvoker(`http://${host}/invoke`),
            RemoteNotifier.fromWebSocket(`ws://${host}/notifier`));
    }
}

export interface RemoteSession {

    getOrCreate(remoteId: number): Promise<RemoteProxy>;

}

export class ComponentTransportable implements Transportable, JavaObject<ComponentTransportable> {
    static readonly javaClass = javaClasses.register(
        ComponentTransportable, "org.oddjob.jmx.client.ComponentTransportable");

    constructor(readonly remoteId: number) {

    }

    getJavaClass(): JavaClass<ComponentTransportable> {
        return ComponentTransportable.javaClass;
    }

    importResolve(remoteIdMappings: RemoteIdMappings): RemoteProxy {

        const proxy = remoteIdMappings.objectFor(this.remoteId);

        if (proxy) {
            return proxy;
        }
        else {
            throw new Error("No remote for " + this.remoteId);
        }
    }
}

class RemoteProxyImpl implements RemoteProxy {

    constructor(readonly remoteId: number,
        readonly manager: HandlerManager) {

    }

    isA(cntor: { new(...args: any[]): any }): boolean {
        return this.manager.handlerFor(javaClasses.forType(cntor)) != undefined;
    }

    as<T>(cntor: { new(...args: any[]): T }): T {
        const jc: JavaClass<any> = javaClasses.forType(cntor);
        if (!jc) {
            throw new Error("No JavaClass for" + cntor);
        }
        const t : T = this.manager.handlerFor(jc);
        if (t) {
            return t;
        }
        else {
            throw new Error("No handler for " + jc.name);
        }
    }

    destroy() {
        this.manager.destroy();
    }
}


class RemoteSessionImpl implements RemoteSession, RemoteIdMappings {

    readonly proxies = new Map<number, RemoteProxy>();

    readonly ids = new Map<RemoteProxy, number>();

    readonly managerFactory: HandlerManagerFactory;

    constructor(readonly remote: RemoteConnection, factories: Map<JavaClass<any>, RemoteHandlerFactory<any>>) {
        this.managerFactory = new HandlerManagerFactory(factories);
    }

    idFor(proxy: RemoteProxy): number | undefined {
        return this.ids.get(proxy);
    }

    objectFor(remoteId: number): RemoteProxy | undefined {
        return this.proxies.get(remoteId);
    }

    async getOrCreate(remoteId: number): Promise<RemoteProxy> {

        let proxy = this.proxies.get(remoteId);

        if (proxy) {
            return Promise.resolve(proxy);
        }

        const toolkit = new ClientToolkitImpl(remoteId, this, this.remote)

        const remoteHandler: RemoteOddjobBean = new RemoteOddjobBeanHandler().createHandler(toolkit);

        const serverInfo = await remoteHandler.serverInfo();

        const handlerManager = this.managerFactory.create(serverInfo.implementations, toolkit);

        proxy = new RemoteProxyImpl(remoteId, handlerManager);

        this.proxies.set(remoteId, proxy);
        this.ids.set(proxy, remoteId);
        return proxy;
    }

}

export class RemoteSessionFactory {

    readonly factories = new Map<JavaClass<any>, RemoteHandlerFactory<any>>();

    constructor(readonly remote: RemoteConnection) {

    }

    static from(remote: RemoteConnection): RemoteSessionFactory {
        return new RemoteSessionFactory(remote);
    }

    register<T extends JavaObject<T>>(handlerFactory: RemoteHandlerFactory<T>): RemoteSessionFactory {
        this.factories.set(handlerFactory.interfaceClass, handlerFactory);
        return this;
    }

    createRemoteSession(): RemoteSession {

        return new RemoteSessionImpl(this.remote, this.factories);
    }
}

export interface ClientToolkit {

    readonly logger: Logger;

    invoke<T>(operationType: OperationType<T>, ...args: any): Promise<T>;

    addNotificationListener<T>(notificationType: NotificationType<T>, notificationListener: NotificationListener<T>): void;

    removeNotificationListener<T>(notificationType: NotificationType<T>, notificationListener: NotificationListener<T>): void;

}


class ClientToolkitImpl implements ClientToolkit {

    readonly logger = Logger.getLogger();

    constructor(private readonly remoteId: number,
        private readonly remoteIdMappings: RemoteIdMappings,
        private readonly remote: RemoteConnection) {
    }

    async invoke<T>(operationType: OperationType<T>, ...args: any): Promise<T> {

        let argChange: boolean = false;
        let actualTypes: string[] = [];
        let actualArgs: any[] = [];

        for (let i = 0; i < args.length; ++i) {
            if (args[i] instanceof RemoteProxyImpl) {
                const proxy = args[i];
                const proxyId = this.remoteIdMappings.idFor(proxy);
                if (!proxyId) {
                    throw new Error("No id for " + proxy);
                }
                actualArgs.push(new ComponentTransportable(proxyId));
                actualTypes.push(ComponentTransportable.javaClass.name);
                argChange = true;
            }
            else {
                actualArgs.push(args[i]);
                actualTypes.push(operationType.signature[i]);
            }
        }


        let invokeRequest = new InvokeRequest(
            this.remoteId,
            operationType,
            actualArgs
        )

        if (argChange) {
            invokeRequest.argTypes = actualTypes;
        }

        const invokeResponse: InvokeResponse<T> = await this.remote.invoke(invokeRequest)

        if (invokeResponse.value &&
            ComponentTransportable.javaClass.name == invokeResponse.type) {
            let componentTransportable = invokeResponse.value as ComponentTransportable;
            let remoteProxy: unknown = componentTransportable.importResolve(this.remoteIdMappings);
            return remoteProxy as T;
        }
        else {
            return invokeResponse.value;
        }
    }

    addNotificationListener<T>(notificationType: NotificationType<T>, notificationListener: NotificationListener<T>): void {
        this.remote.addNotificationListener(this.remoteId, notificationType, notificationListener);
    }

    removeNotificationListener<T>(notificationType: NotificationType<T>, notificationListener: NotificationListener<T>): void {
        this.remote.removeNotificationListener(this.remoteId, notificationType, notificationListener);
    }
}

export interface Initialisation<T> {
    type: string;
    data: T;
}

export class Implementation<T> {

    constructor (readonly type: string, 
        readonly version: string,
    readonly initialisation?: Initialisation<T>) {

    } 
}

export interface ServerInfo {
    
    implementations: Implementation<any>[];
}

export class ServerInfo implements JavaObject<ServerInfo> {
    static readonly javaClass = javaClasses.register(
        ServerInfo, "org.oddjob.jmx.server.ServerInfo");

    

    getJavaClass(): JavaClass<ServerInfo> {
        return ServerInfo.javaClass;
    }


}

export interface RemoteHandlerFactory<T extends JavaObject<T>> {

    readonly interfaceClass: JavaClass<T>;

    createHandler(toolkit: ClientToolkit, initialisation?: Initialisation<any>): T;

}

interface RemoteOddjobBean {

    serverInfo(): Promise<ServerInfo>;
}

class RemoteOddjobBean implements JavaObject<RemoteOddjobBean> {
    static readonly javaClass = javaClasses.register(
        RemoteOddjobBean, "org.oddjob.jmx.RemoteOddjobBean");

    getJavaClass(): JavaClass<RemoteOddjobBean> {
        return RemoteOddjobBean.javaClass;
    }
}

class RemoteOddjobBeanHandler implements RemoteHandlerFactory<RemoteOddjobBean> {

    static SERVER_INFO_OP: OperationType<ServerInfo> =
        OperationType.ofName("serverInfo")
            .andDataType(ServerInfo.javaClass)
            .withSignature();

    readonly interfaceClass = RemoteOddjobBean.javaClass;

    createHandler(toolkit: ClientToolkit): RemoteOddjobBean {

        class Impl extends RemoteOddjobBean {
            serverInfo(): Promise<ServerInfo> {

                return toolkit.invoke(RemoteOddjobBeanHandler.SERVER_INFO_OP);
            }

        }

        return new Impl();
    }
}

class HandlerManager implements Destroyable {

    constructor(readonly handlers: Map<JavaClass<any>, any>) {

    }

    handlerFor<T>(javaClass: JavaClass<T>): T {
        return this.handlers.get(javaClass);
    }

    destroy(): void {

        function isDestroyable(handler: any): handler is Destroyable {
            return (handler as Destroyable).destroy !== undefined;
          }
                    
          this.handlers.forEach((v, k) => {
         
            if (isDestroyable(v)) {
                v.destroy();
            }            
        });
    }
}

class HandlerManagerFactory {

    constructor(readonly factories: Map<JavaClass<any>, RemoteHandlerFactory<any>>) {
        this.factories.set(RemoteOddjobBean.javaClass, new RemoteOddjobBeanHandler());
    }

    create(implementations: Implementation<any>[], clientToolkit: ClientToolkit): HandlerManager {

        const handlers = new Map<JavaClass<any>, any>();

        implementations.filter(impl => javaClasses.isKnown(impl.type))
        .forEach(impl => {
            const javaClass: JavaClass<any> = javaClasses.forName(impl.type);
            const factory = this.factories.get(javaClass);
            if (factory != undefined) {

                const handler = factory.createHandler(clientToolkit, impl.initialisation);
                handlers.set(javaClass, handler)
            }
        })

        return new HandlerManager(handlers);
    }
}


