import { JavaClass, javaClasses, JAVA_STRING, RemoteObject, RemoteHandlerFactory, ClientToolkit } from './remote'
import { OperationType } from './invoke'
import { NotificationType, Notification } from './notify'


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

export class StateData implements RemoteObject<StateData> {
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

    iconForId(id: String): Promise<IconData>;

    addIconListener(listener: IconListener): void;

    /**
     * Remove a listener.
     * 
     * @param listener The IconListener.
     */
    removeIconListener(listener: IconListener): void;
}

export class Iconic implements RemoteObject<Iconic> {
    static readonly javaClass = javaClasses.register(
        Iconic, "org.oddjob.Iconic");

    getJavaClass(): JavaClass<Iconic> {
        return Iconic.javaClass;
    }
}

export class IconData implements RemoteObject<IconData> {
    static readonly javaClass = javaClasses.register(
        IconData, "org.oddjob.jmx.handlers.IconHandlerFactory$IconData");

    constructor(readonly wdith: number,
        readonly height: number,
        readonly pixels: string,
        readonly description?: string
    ) { }

    getJavaClass(): JavaClass<IconData> {
        return IconData.javaClass;
    }
}

class IconicHandler implements RemoteHandlerFactory<Iconic> {

    static ICON_CHANGED_NOTIF_TYPE: NotificationType<IconData> =
        NotificationType.ofName("org.oddjob.iconchanged")
            .andDataType(IconData.javaClass);

    static SYNCHRONIZE: OperationType<Notification<IconData>[]> =
        OperationType.ofName("iconicSynchronize")
            .andDataType(javaClasses.forType(Notification))
            .withSignature();

    static ICON_FOR: OperationType<IconData> =
        OperationType.ofName("Iconic.iconForId")
            .andDataType(javaClasses.forType(IconData))
            .withSignature(JAVA_STRING);


    createHandler(toolkit: ClientToolkit): Iconic {


        
        class Impl extends Iconic {


            iconForId(id: String): Promise<IconData> {

                return toolkit.invoke(IconicHandler.ICON_FOR, id);
            }

            addIconListener(listener: IconListener): void {

            }

            /**
             * Remove a listener.
             * 
             * @param listener The IconListener.
             */
            removeIconListener(listener: IconListener): void {

            }

        }

        return new Impl();
    }
}
