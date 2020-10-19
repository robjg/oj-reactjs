import { JavaClass, javaClasses, JavaObject } from './java';
import { Invoker, OperationType, InvokeRequest, InvokeResponse } from './invoke';


export interface RemoteProxy {

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

    constructor(readonly manager: HandlerManager) {

    }

    isA(cntor: { new(...args: any[]): any }): boolean {
        return this.manager.handlerFor(javaClasses.forType(cntor)) != undefined;
    }

    as<T>(cntor: { new(...args: any[]): T }): T {
        return this.manager.handlerFor(javaClasses.forType(cntor));
    }
}


class RemoteSessionImpl implements RemoteSession, RemoteIdMappings {

    readonly proxies = new Map<number, RemoteProxy>();

    readonly ids = new Map<RemoteProxy, number>();

    readonly managerFactory: HandlerManagerFactory;

    constructor(readonly invoker: Invoker, factories: Map<JavaClass<any>, RemoteHandlerFactory<any>>) {
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

        const toolkit = new ClientToolkitImpl(remoteId, this, this.invoker)

        const remoteHandler: RemoteOddjobBean = new RemoteOddjobBeanHandler().createHandler(toolkit);

        const serverInfo = await remoteHandler.serverInfo();

        const theClases = serverInfo.interfaces
            .filter(name => javaClasses.isKnown(name))
            .map(name => javaClasses.forName(name));

        const handlerManager = this.managerFactory.create(theClases, toolkit);

        proxy = new RemoteProxyImpl(handlerManager);

        this.proxies.set(remoteId, proxy);
        this.ids.set(proxy, remoteId);
        return proxy;
    }

}

export class RemoteSessionFactory {

    readonly factories = new Map<JavaClass<any>, RemoteHandlerFactory<any>>(); 

    constructor(readonly invoker: Invoker) {

    }

    register<T extends JavaObject<T>>(handlerFactory: RemoteHandlerFactory<T>): RemoteSessionFactory {
        this.factories.set(handlerFactory.interfaceClass, handlerFactory);
        return this;
    }

    createRemoteSession(): RemoteSession {

        return new RemoteSessionImpl(this.invoker, this.factories);
    }
}

export interface ClientToolkit {

    invoke<T>(operationType: OperationType<T>, ...args: any): Promise<T>;
}


class ClientToolkitImpl implements ClientToolkit {

    constructor(private readonly remoteId: number,
        private readonly remoteIdMappings: RemoteIdMappings,
        private readonly invoker: Invoker) {

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

        const invokeResponse : InvokeResponse<T> = await this.invoker.invoke(invokeRequest)

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
}

export interface ServerInfo {
    interfaces: string[];
    noop(): void;
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

    createHandler(toolkit: ClientToolkit): T;

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

    static serverInfoOp: OperationType<ServerInfo> =
        OperationType.ofName("serverInfo")
        .andDataType(ServerInfo.javaClass)
        .withSignature();

    readonly interfaceClass = RemoteOddjobBean.javaClass;

    createHandler(toolkit: ClientToolkit): RemoteOddjobBean {

        class Impl extends RemoteOddjobBean {
            serverInfo(): Promise<ServerInfo> {

                return toolkit.invoke(RemoteOddjobBeanHandler.serverInfoOp);
            }

        }

        return new Impl();
    }
}


class HandlerManager {

    constructor(readonly handlers: Map<JavaClass<any>, any>) {

    }

    handlerFor<T>(javaClass: JavaClass<T>): T {
        return this.handlers.get(javaClass);
    }
}

class HandlerManagerFactory {

    constructor(readonly factories: Map<JavaClass<any>, RemoteHandlerFactory<any>>) {
        this.factories.set(RemoteOddjobBean.javaClass, new RemoteOddjobBeanHandler());
    }

    create(theClasses: JavaClass<any>[], clientToolkit: ClientToolkit): HandlerManager {

        const handlers = new Map<JavaClass<any>, any>();

        theClasses.forEach(jc => {
            const factory = this.factories.get(jc);
            if (factory != undefined) {
                handlers.set(jc, factory.createHandler(clientToolkit))
            }
        })

        return new HandlerManager(handlers);
    }
}


