import { Invoker, OperationType, InvokeRequest, InvokeResponse } from './invoke';

export interface JavaClass<T> {

    name: string;

    is(arg: RemoteObject<any> | string): boolean;

}

export class JavaClassImpl<T> implements JavaClass<T> {

    constructor(readonly name: string) {

    }

    is(arg: RemoteObject<any> | string): boolean {
        if (typeof arg == 'string') {
            return arg as string === this.name;
        }
        else {
            return arg.getJavaClass().name == this.name;
        }
    }
}

export const JAVA_OBJECT = new JavaClassImpl<any>("java.lang.Object");
export const JAVA_STRING = new JavaClassImpl<string>("java.lang.String");
export const JAVA_INT = new JavaClassImpl<number>("int");
export const JAVA_LONG = new JavaClassImpl<number>("long");
export const JAVA_DOUBLE = new JavaClassImpl("double");
export const JAVA_FLOAT = new JavaClassImpl("float");
export const JAVA_BOOLEAN = new JavaClassImpl("boolean");
export const JAVA_SHORT = new JavaClassImpl("short");
export const JAVA_VOID = new JavaClassImpl("void");


class JavaClasses {

    readonly registry = new Map<new (...args: any[]) => any, JavaClass<any>>();

    readonly byName = new Map<string, JavaClass<any>>();

    register<T>(cntor: { new(...args: any[]): T }, className: string): JavaClass<T> {
        const javaClass = new JavaClassImpl(className)
        this.registry.set(cntor, javaClass);
        this.byName.set(className, javaClass);
        return javaClass;
    }

    forType<T>(cntor: { new(...args: any[]): T }): JavaClass<T> {
        let maybe = this.registry.get(cntor);
        if (maybe) {
            return maybe
        }
        else {
            throw new Error("No Java class registered for " + cntor);
        }
    }

    forName(className: string): JavaClass<any> {
        let maybe = this.byName.get(className);
        if (maybe) {
            return maybe
        }
        else {
            throw new Error("No Java class registered for " + className);
        }
    }

    isKnown(className: string): boolean {
        return this.byName.get(className) != undefined;
    }

    is<T>(className: string, cntor: { new(...args: any[]): T }): boolean {
        return className === this.registry.get(cntor)?.name;
    }
}

export const javaClasses = new JavaClasses();


export interface RemoteObject<T extends RemoteObject<T>> {

    getJavaClass(): JavaClass<T>;
}

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

export class ComponentTransportable implements Transportable, RemoteObject<ComponentTransportable> {
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

    readonly managerFactory = new HandlerManagerFactory();

    constructor(readonly invoker: Invoker) {

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

    constructor(readonly invoker: Invoker) {

    }

    createRemoteSession(): RemoteSession {

        return new RemoteSessionImpl(this.invoker);
    }

}

interface ClientToolkit {

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

        const invokeResponse = await this.invoker.invoke(invokeRequest)

        if (invokeResponse.value &&
            ComponentTransportable.javaClass.is(invokeResponse.type)) {
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

export class ServerInfo implements RemoteObject<ServerInfo> {
    static readonly javaClass = javaClasses.register(
        ServerInfo, "org.oddjob.jmx.server.ServerInfo");

    getJavaClass(): JavaClass<ServerInfo> {
        return ServerInfo.javaClass;
    }
}

interface RemoteHandlerFactory<T extends RemoteObject<T>> {

    createHandler(toolkit: ClientToolkit): T;

}

interface RemoteOddjobBean {

    serverInfo(): Promise<ServerInfo>;
}

class RemoteOddjobBean implements RemoteObject<RemoteOddjobBean> {
    static readonly javaClass = javaClasses.register(
        RemoteOddjobBean, "org.oddjob.jmx.RemoteOddjobBean");

    getJavaClass(): JavaClass<RemoteOddjobBean> {
        return RemoteOddjobBean.javaClass;
    }
}

class RemoteOddjobBeanHandler implements RemoteHandlerFactory<RemoteOddjobBean> {

    static serverInfoOp: OperationType<ServerInfo> =
        new OperationType("serverInfo", ServerInfo.javaClass.name, []);


    createHandler(toolkit: ClientToolkit): RemoteOddjobBean {

        class Impl extends RemoteOddjobBean {
            serverInfo(): Promise<ServerInfo> {

                return toolkit.invoke(RemoteOddjobBeanHandler.serverInfoOp);
            }

        }

        return new Impl();
    }
}

export interface ConfigurationOwner {

    formFor(proxy: RemoteProxy): Promise<string>;

    blankForm(isComponent: boolean,
        element: string,
        propertyClass: string): Promise<string>;
}

export class ConfigurationOwner implements RemoteObject<ConfigurationOwner> {
    static readonly javaClass = javaClasses.register(
        ConfigurationOwner, "org.oddjob.arooa.parsing.ConfigurationOwner");

    getJavaClass(): JavaClass<ConfigurationOwner> {
        return ConfigurationOwner.javaClass;
    }
}

class ConfigurationOwnerHandler implements RemoteHandlerFactory<ConfigurationOwner> {

    static formFor: OperationType<string> =
        new OperationType("formFor", JAVA_STRING.name, [JAVA_OBJECT.name]);

    static blankForm: OperationType<string> =
        new OperationType("blankForm", JAVA_STRING.name,
            [JAVA_BOOLEAN.name, JAVA_STRING.name, JAVA_STRING.name]);

    createHandler(toolkit: ClientToolkit): ConfigurationOwner {

        class Impl extends ConfigurationOwner {

            formFor(proxy: RemoteProxy): Promise<string> {

                return toolkit.invoke(ConfigurationOwnerHandler.formFor, proxy);
            }

            blankForm(isComponent: boolean,
                element: string,
                propertyClass: string): Promise<string> {

                    return toolkit.invoke(ConfigurationOwnerHandler.blankForm,
                        isComponent, element, propertyClass)
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

    readonly factories = new Map<JavaClass<any>, RemoteHandlerFactory<any>>();

    constructor() {
        this.factories.set(RemoteOddjobBean.javaClass, new RemoteOddjobBeanHandler());
        this.factories.set(ConfigurationOwner.javaClass, new ConfigurationOwnerHandler())
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


