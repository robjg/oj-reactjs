import { JavaClass, javaClasses, JAVA_STRING, JavaObject, JAVA_OBJECT, JAVA_BOOLEAN, JAVA_VOID, JAVA_INT } from './java';
import { RemoteHandlerFactory, ClientToolkit, RemoteProxy, Initialisation, Destroyable, RemoteConnection, RemoteSessionFactory, RemoteSession, } from './remote'
import { OperationType } from './invoke'
import { NotificationType, Notification, NotificationListener } from './notify'
import { Logger, LoggerFactory } from '../logging';


// Object

export interface ObjectProxy {

    readonly toString: string;
}

export class ObjectProxy implements JavaObject<ObjectProxy> {
    static readonly javaClass = javaClasses.register(
        ObjectProxy, JAVA_OBJECT.name);

    getJavaClass() {
        return ObjectProxy.javaClass;
    }
}

export class ObjectHandler implements RemoteHandlerFactory<ObjectProxy> {

    readonly interfaceClass = ObjectProxy.javaClass;

    createHandler(toolkit: ClientToolkit, initialisation: Initialisation<string>): ObjectProxy {

        const remoteName: string = initialisation.data;

        class Impl extends ObjectProxy {

            readonly toString: string = remoteName;
        }

        return new Impl();
    }
}


// Stateful

export enum StateFlag {
    READY = "READY",
    EXECUTING = "EXECUTING",
    STOPPABLE = "STOPPABLE",
    COMPLETE = "COMPLETE",
    INCOMPLETE = "INCOMPLETE",
    EXCEPTION = "EXCEPTION",
    DESTROYED = "DESTROYED"
}

export type State = {
    name: string;
    flags: StateFlag[];
}

export class StateData implements JavaObject<StateData> {
    static readonly javaClass = javaClasses.register(
        StateData, "org.oddjob.jmx.handlers.StatefulHandlerFactory$StateData");

    constructor(readonly jobState: State,
        readonly date: Date,
        readonly throwable: any) { }


    getJavaClass(): JavaClass<StateData> {
        return StateData.javaClass;
    }
}

// Iconic

export class IconEvent {

    constructor(readonly remoteId: number,
        readonly iconId: string) { }
}


export interface IconListener {

    iconEvent(event: IconEvent): void;
}

export interface Iconic {

    iconForId(id: string): Promise<ImageData>;

    addIconListener(listener: IconListener): void;

    /**
     * Remove a listener.
     * 
     * @param listener The IconListener.
     */
    removeIconListener(listener: IconListener): void;
}

export class Iconic implements JavaObject<Iconic> {
    static readonly javaClass = javaClasses.register(
        Iconic, "org.oddjob.Iconic");

    getJavaClass(): JavaClass<Iconic> {
        return Iconic.javaClass;
    }
}

export class IconData implements JavaObject<IconData> {
    static readonly javaClass = javaClasses.register(
        IconData, "org.oddjob.jmx.handlers.IconicHandlerFactory$IconData");

    constructor(readonly id: string) { }

    getJavaClass(): JavaClass<IconData> {
        return IconData.javaClass;
    }
}

export class ImageData implements JavaObject<IconData> {
    static readonly javaClass = javaClasses.register(
        ImageData, "org.oddjob.images.ImageData");

    constructor(readonly bytes: string,
        readonly mediaType: string,
        readonly description?: string
    ) { }

    getJavaClass(): JavaClass<ImageData> {
        return ImageData.javaClass;
    }
}

export class IconicHandler implements RemoteHandlerFactory<Iconic> {

    private readonly logger: Logger = LoggerFactory.getLogger(IconicHandler);

    static ICON_CHANGED_NOTIF_TYPE: NotificationType<IconData> =
        NotificationType.ofName("org.oddjob.iconchanged")
            .andDataType(IconData.javaClass);

    static SYNCHRONIZE: OperationType<Notification<IconData>> =
        OperationType.ofName("iconicSynchronize")
            .andDataType(javaClasses.forType(Notification))
            .withSignature();

    static ICON_FOR: OperationType<ImageData> =
        OperationType.ofName("Iconic.iconForId")
            .andDataType(javaClasses.forType(ImageData))
            .withSignature(JAVA_STRING);

    static iconCache: Map<string, ImageData> = new Map();

    readonly interfaceClass = Iconic.javaClass;

    createHandler(toolkit: ClientToolkit): Iconic {

        var listeners: IconListener[] = [];

        var lastEvent: IconEvent | null = null;

        const factory = this;

        function extractEvent(notification: Notification<IconData>): IconEvent | null {
            if (notification.data?.id) {
                return new IconEvent(notification.remoteId, notification.data.id)
            }
            else {
                factory.logger.warn("Icon notification has no icon id: " + JSON.stringify(notification));
                return null;
            }
        }

        const notificationListener: NotificationListener<IconData> = {
            handleNotification: (notification: Notification<IconData>) => {
                lastEvent = extractEvent(notification);
                if (lastEvent != null) {
                    const notNullLastEvent: IconEvent = lastEvent;
                    listeners.forEach(l => l.iconEvent(notNullLastEvent));
                }
            }
        }

        class Impl extends Iconic implements Destroyable {

            async iconForId(id: string): Promise<ImageData> {

                const cachedImage = IconicHandler.iconCache.get(id);
                if (cachedImage) {
                    return Promise.resolve(cachedImage);
                }

                const imageData = await toolkit.invoke(IconicHandler.ICON_FOR, id);
                if (!imageData) {
                    factory.logger.warn("No Image Data for " + id);
                }
                else {
                    IconicHandler.iconCache.set(id, imageData);
                }
                return imageData;
            }

            addIconListener(listener: IconListener): void {


                if (lastEvent == null) {

                    toolkit.invoke(IconicHandler.SYNCHRONIZE)
                        .then(notification => {
                            const event = extractEvent(notification);
                            if (event != null) {
                                listener.iconEvent(lastEvent = event);
                            }

                            toolkit.addNotificationListener(IconicHandler.ICON_CHANGED_NOTIF_TYPE,
                                notificationListener);
                        });
                }
                else {
                    listener.iconEvent(lastEvent);
                }

                listeners.push(listener);

            }

            /**
             * Remove a listener.
             * 
             * @param listener The IconListener.
             */
            removeIconListener(listener: IconListener): void {

                listeners = listeners.filter(e => e != listener);
                if (listeners.length == 0) {
                    lastEvent == null;
                    toolkit.removeNotificationListener(IconicHandler.ICON_CHANGED_NOTIF_TYPE,
                        notificationListener);
                }
            }

            destroy(): void {
                toolkit.removeNotificationListener(IconicHandler.ICON_CHANGED_NOTIF_TYPE,
                    notificationListener);
            }

        }

        return new Impl();
    }
}

// Structural

export class StructuralEvent {

    constructor(readonly remoteId: number,
        readonly children: number[]) { }
}


export interface StructuralListener {

    childEvent(event: StructuralEvent): void;
}

export interface Structural {

    addStructuralListener(listener: StructuralListener): void;

    /**
     * Remove a listener.
     * 
     * @param listener The IconListener.
     */
    removeStructuralListener(listener: StructuralListener): void;
}

export class Structural implements JavaObject<Structural> {
    static readonly javaClass = javaClasses.register(
        Structural, "org.oddjob.Structural");

    getJavaClass(): JavaClass<Structural> {
        return Structural.javaClass;
    }
}

export class ChildData implements JavaObject<ChildData> {
    static readonly javaClass = javaClasses.register(
        ChildData, "org.oddjob.jmx.handlers.StructuralHandlerFactory$ChildData");

    constructor(readonly remoteIds: number[]) { }

    getJavaClass(): JavaClass<ChildData> {
        return ChildData.javaClass;
    }
}

export class StructuralHandler implements RemoteHandlerFactory<Structural> {

    private readonly logger: Logger = LoggerFactory.getLogger(StructuralHandler);

    static STRUCTURAL_NOTIF_TYPE: NotificationType<ChildData> =
        NotificationType.ofName("org.oddjob.structural")
            .andDataType(ChildData.javaClass);

    static SYNCHRONIZE: OperationType<Notification<ChildData>> =
        OperationType.ofName("structuralSynchronize")
            .andDataType(javaClasses.forType(Notification))
            .withSignature();

    readonly interfaceClass = Structural.javaClass;

    createHandler(toolkit: ClientToolkit): Structural {

        let listeners: StructuralListener[] = [];

        let lastEvent: StructuralEvent | null = null;

        const factory = this;

        function extractEvent(notification: Notification<ChildData>): StructuralEvent | null {
            if (notification.data?.remoteIds) {
                return new StructuralEvent(notification.remoteId, notification.data.remoteIds);
            }
            else {
                factory.logger.warn("Structural notification has no remotes ids: " + JSON.stringify(notification));
                return null;
            }
        }

        const notificationListener: NotificationListener<ChildData> = {
            handleNotification: (notification: Notification<ChildData>) => {
                lastEvent = extractEvent(notification);
                if (lastEvent != null) {
                    const notNullLastEvent: StructuralEvent = lastEvent;
                    listeners.forEach(l => l.childEvent(notNullLastEvent));
                }
            }
        }

        class Impl extends Structural implements Destroyable {

            addStructuralListener(listener: StructuralListener): void {


                if (lastEvent == null) {

                    toolkit.invoke(StructuralHandler.SYNCHRONIZE)
                        .then(notification => {
                            const event = extractEvent(notification);
                            if (event != null) {
                                listener.childEvent(lastEvent = event);
                            }

                            toolkit.addNotificationListener(StructuralHandler.STRUCTURAL_NOTIF_TYPE,
                                notificationListener);
                        });
                }
                else {
                    listener.childEvent(lastEvent);
                }

                listeners.push(listener);

            }

            /**
             * Remove a listener.
             * 
             * @param listener The IconListener.
             */
            removeStructuralListener(listener: StructuralListener): void {

                listeners = listeners.filter(e => e != listener);
                if (listeners.length == 0) {
                    lastEvent == null;
                    toolkit.removeNotificationListener(StructuralHandler.STRUCTURAL_NOTIF_TYPE,
                        notificationListener);
                }
            }

            destroy(): void {
                toolkit.removeNotificationListener(StructuralHandler.STRUCTURAL_NOTIF_TYPE,
                    notificationListener);
            }
        }

        return new Impl();
    }
}

// Runnable

export interface Runnable {

    run(): void;
}

export class Runnable implements JavaObject<Runnable> {
    static readonly javaClass = javaClasses.register(
        Runnable, "java.lang.Runnable");

    getJavaClass(): JavaClass<Runnable> {
        return Runnable.javaClass;
    }
}

export class RunnableHandler implements RemoteHandlerFactory<Runnable> {

    static RUN: OperationType<void> =
        OperationType.ofName("run")
            .andDataType(JAVA_VOID)
            .withSignature();

    readonly interfaceClass = Runnable.javaClass;

    createHandler(toolkit: ClientToolkit): Runnable {

        const factory = this;


        class Impl extends Runnable {

            run(): void {

                toolkit.invoke(RunnableHandler.RUN);
            }
        }

        return new Impl();
    }
}

// Resettable

export interface Resettable {

    softReset(): void;

    hardReset(): void;
}

export class Resettable implements JavaObject<Resettable> {
    static readonly javaClass = javaClasses.register(
        Resettable, "org.oddjob.Resettable");

    getJavaClass(): JavaClass<Resettable> {
        return Resettable.javaClass;
    }
}

export class ResettableHandler implements RemoteHandlerFactory<Resettable> {

    static SOFT_RESET: OperationType<void> =
        OperationType.ofName("softReset")
            .andDataType(JAVA_VOID)
            .withSignature();

    static HARD_RESET: OperationType<void> =
        OperationType.ofName("hardReset")
            .andDataType(JAVA_VOID)
            .withSignature();

    readonly interfaceClass = Resettable.javaClass;

    createHandler(toolkit: ClientToolkit): Resettable {

        const factory = this;


        class Impl extends Resettable {

            softReset(): void {

                toolkit.invoke(ResettableHandler.SOFT_RESET);
            }

            hardReset(): void {

                toolkit.invoke(ResettableHandler.HARD_RESET);
            }
        }

        return new Impl();
    }
}

// Stoppable

export interface Stoppable {

    stop(): void;
}

export class Stoppable implements JavaObject<Stoppable> {
    static readonly javaClass = javaClasses.register(
        Stoppable, "org.oddjob.Stoppable");

    getJavaClass(): JavaClass<Stoppable> {
        return Stoppable.javaClass;
    }
}

export class StoppableHandler implements RemoteHandlerFactory<Stoppable> {

    static STOP: OperationType<void> =
        OperationType.ofName("stop")
            .andDataType(JAVA_VOID)
            .withSignature();

    readonly interfaceClass = Stoppable.javaClass;

    createHandler(toolkit: ClientToolkit): Stoppable {

        const factory = this;

        class Impl extends Stoppable {

            stop(): void {

                toolkit.invoke(StoppableHandler.STOP);
            }
        }

        return new Impl();
    }
}

// Configuration Owner

export interface DragPoint {

    isCutSupported: boolean;

    isPasteSupported: boolean;

    cut(): Promise<string>;

    copy(): Promise<string>;

    paste(index: number, configXml: string): Promise<void>;

    delete(): Promise<void>;

    possibleChildren(): Promise<string[]>;
}

export class DragPointInfo implements JavaObject<DragPointInfo> {
    static readonly javaClass = javaClasses.register(
        DragPointInfo, "org.oddjob.jmx.handlers.DragPointInfo");

    constructor(readonly supportsCut: boolean,
        readonly supportsPaste: boolean) {
    }

    getJavaClass(): JavaClass<DragPointInfo> {
        return DragPointInfo.javaClass;
    }
}

export class PossibleChildren implements JavaObject<PossibleChildren> {
    static readonly javaClass = javaClasses.register(
        PossibleChildren, "org.oddjob.jmx.handlers.PossibleChildren");

    constructor(readonly tags: string[]) {
    }

    getJavaClass(): JavaClass<PossibleChildren> {
        return PossibleChildren.javaClass;
    }
}

export interface ConfigurationOwner {

    dragPointFor(proxy: RemoteProxy): Promise<DragPoint | null>

    formFor(proxy: RemoteProxy): Promise<string>;

    blankForm(isComponent: boolean,
        element: string,
        propertyClass: string): Promise<string>;

    replaceJson(proxy: RemoteProxy, json: string): void;
}

export class ConfigurationOwner implements JavaObject<ConfigurationOwner> {
    static readonly javaClass = javaClasses.register(
        ConfigurationOwner, "org.oddjob.arooa.parsing.ConfigurationOwner");

    getJavaClass(): JavaClass<ConfigurationOwner> {
        return ConfigurationOwner.javaClass;
    }
}

export class ConfigurationOwnerHandler implements RemoteHandlerFactory<ConfigurationOwner> {

    static DRAG_POINT_INFO: OperationType<DragPointInfo> =
        OperationType.ofName("dragPointInfo")
            .andDataType(javaClasses.forType(DragPointInfo))
            .withSignature(JAVA_OBJECT);

    static CUT: OperationType<string> =
        new OperationType("configCut", JAVA_STRING.name, [JAVA_OBJECT.name]);

    static COPY: OperationType<string> =
        new OperationType("configCopy", JAVA_STRING.name, [JAVA_OBJECT.name]);

    static PASTE: OperationType<void> =
        new OperationType("configPaste", JAVA_VOID.name,
            [JAVA_OBJECT.name, JAVA_INT.name, JAVA_STRING.name]);

    static DELETE: OperationType<void> =
        new OperationType("configDelete", JAVA_VOID.name, [JAVA_OBJECT.name]);

    static POSSIBLE_CHILDREN: OperationType<PossibleChildren> =
        OperationType.ofName("possibleChildren")
            .andDataType(PossibleChildren.javaClass)
            .withSignature(JAVA_OBJECT);

    static formFor: OperationType<string> =
        new OperationType("formFor", JAVA_STRING.name, [JAVA_OBJECT.name]);

    static blankForm: OperationType<string> =
        new OperationType("blankForm", JAVA_STRING.name,
            [JAVA_BOOLEAN.name, JAVA_STRING.name, JAVA_STRING.name]);

    static replaceJson: OperationType<void> =
        new OperationType("configReplaceJson", JAVA_VOID.name,
            [JAVA_OBJECT.name, JAVA_STRING.name]);

    readonly interfaceClass = ConfigurationOwner.javaClass;

    createHandler(toolkit: ClientToolkit): ConfigurationOwner {

        class DragPointImpl implements DragPoint {

            readonly isCutSupported: boolean;

            readonly isPasteSupported: boolean;

            constructor(readonly proxy: RemoteProxy,
                dragPointInfo: DragPointInfo) {

                this.isCutSupported = dragPointInfo.supportsCut;
                this.isPasteSupported = dragPointInfo.supportsPaste;
            }

            cut(): Promise<string> {
                return toolkit.invoke(ConfigurationOwnerHandler.CUT, this.proxy);
            }

            copy(): Promise<string> {
                return toolkit.invoke(ConfigurationOwnerHandler.COPY, this.proxy);
            }

            paste(index: number, configXml: string): Promise<void> {
                return toolkit.invoke(ConfigurationOwnerHandler.PASTE, this.proxy, index, configXml)
            }

            delete(): Promise<void> {
                return toolkit.invoke(ConfigurationOwnerHandler.DELETE, this.proxy);
            }

            async possibleChildren(): Promise<string[]> {
                const possibleChildren : PossibleChildren 
                    = await toolkit.invoke(ConfigurationOwnerHandler.POSSIBLE_CHILDREN, this.proxy)
                    
                return possibleChildren.tags;
            }
        }

        class Impl extends ConfigurationOwner {

            private lastDragPoint: DragPointImpl | null = null;

            async dragPointFor(proxy: RemoteProxy): Promise<DragPoint | null> {
                if (proxy == this.lastDragPoint?.proxy) {
                    return Promise.resolve(this.lastDragPoint);
                }

                const dragPointInfo: Promise<DragPointInfo | null>
                    = toolkit.invoke(ConfigurationOwnerHandler.DRAG_POINT_INFO, proxy);

                const dpi = await dragPointInfo;
                if (dpi) {
                    return new DragPointImpl(proxy, dpi);
                }
                else {
                    return null;
                }
            }

            formFor(proxy: RemoteProxy): Promise<string> {

                return toolkit.invoke(ConfigurationOwnerHandler.formFor, proxy);
            }

            blankForm(isComponent: boolean,
                element: string,
                propertyClass: string): Promise<string> {

                return toolkit.invoke(ConfigurationOwnerHandler.blankForm,
                    isComponent, element, propertyClass);
            }

            replaceJson(proxy: RemoteProxy, json: string): void {

                toolkit.invoke(ConfigurationOwnerHandler.replaceJson,
                    proxy, json);
            }
        }

        return new Impl();
    }
}

export function ojRemoteSession(remote: RemoteConnection): RemoteSession {

    return RemoteSessionFactory.from(remote)
        .register(new ObjectHandler())
        .register(new IconicHandler())
        .register(new StructuralHandler())
        .register(new ConfigurationOwnerHandler())
        .register(new RunnableHandler())
        .register(new ResettableHandler())
        .register(new StoppableHandler())
        .createRemoteSession();

}