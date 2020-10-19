import { JavaClass, javaClasses, JAVA_STRING, JavaObject, JAVA_OBJECT, JAVA_BOOLEAN, JAVA_VOID } from './java';
import { RemoteHandlerFactory, ClientToolkit, RemoteProxy, } from './remote'
import { OperationType } from './invoke'
import { NotificationType, Notification, NotificationListener } from './notify'


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

    iconForId(id: String): Promise<ImageIconData>;

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
        IconData, "org.oddjob.jmx.handlers.IconHandlerFactory$IconData");

    constructor(readonly id: string) { }

    getJavaClass(): JavaClass<IconData> {
        return IconData.javaClass;
    }
}

export class ImageIconData implements JavaObject<IconData> {
    static readonly javaClass = javaClasses.register(
        ImageIconData, "org.oddjob.images.ImageIconData");

    constructor(readonly wdith: number,
        readonly height: number,
        readonly pixels: string,
        readonly description?: string
    ) { }

    getJavaClass(): JavaClass<ImageIconData> {
        return ImageIconData.javaClass;
    }
}

class IconicHandler implements RemoteHandlerFactory<Iconic> {

    static ICON_CHANGED_NOTIF_TYPE: NotificationType<IconData> =
        NotificationType.ofName("org.oddjob.iconchanged")
            .andDataType(IconData.javaClass);

    static SYNCHRONIZE: OperationType<Notification<IconData>> =
        OperationType.ofName("iconicSynchronize")
            .andDataType(javaClasses.forType(Notification))
            .withSignature();

    static ICON_FOR: OperationType<ImageIconData> =
        OperationType.ofName("Iconic.iconForId")
            .andDataType(javaClasses.forType(ImageIconData))
            .withSignature(JAVA_STRING);

    readonly interfaceClass = Iconic.javaClass;

    createHandler(toolkit: ClientToolkit): Iconic {

        var listeners: IconListener[] = [];

        var lastEvent: IconEvent | null = null;

        function extractEvent(notification: Notification<IconData>): IconEvent {
            // the id should never actually be missing.
            const iconId: string = notification.data?.id || "unknown";
            return new IconEvent(notification.remoteId, iconId);
        }

        const notificationListener: NotificationListener<IconData> = {
            handleNotification: (notification: Notification<IconData>) => {
                listeners.forEach(l => l.iconEvent(lastEvent = extractEvent(notification)));
            }
        }


        class Impl extends Iconic {


            iconForId(id: String): Promise<ImageIconData> {

                return toolkit.invoke(IconicHandler.ICON_FOR, id);
            }

            addIconListener(listener: IconListener): void {


                if (lastEvent == null) {

                    toolkit.invoke(IconicHandler.SYNCHRONIZE)
                        .then(notification => {
                            listener.iconEvent(lastEvent = extractEvent(notification));

                            toolkit.addNotificationListener(IconicHandler.ICON_CHANGED_NOTIF_TYPE,
                                notificationListener);
                        });
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

        }

        return new Impl();
    }
}

// Configuraiton Owner

export interface ConfigurationOwner {

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

        class Impl extends ConfigurationOwner {

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
