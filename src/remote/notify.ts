
import { Logger, LoggerFactory } from '../logging';
import { JavaClass, javaClasses, JavaObject, JAVA_VOID } from './java';

export class NotificationType<T> {

    readonly type: string;

    constructor(readonly name: string,
        javaClass: JavaClass<T>) {

        this.type = javaClass.name;
    }

    static ofName<T>(name: string) {
        return { andDataType: (type: JavaClass<T>) => new NotificationType(name, type) }
    }
}

export class Notification<T> implements JavaObject<Notification<T>> {

    static readonly javaClass = javaClasses.register(
        Notification, "org.oddjob.remote.Notification");

    getJavaClass(): JavaClass<Notification<T>> {
        return Notification.javaClass;
    }

    constructor(readonly remoteId: number,
        readonly type: NotificationType<T>,
        readonly sequence: number,
        readonly data?: T) {
    }

    static from<T>(remoteId: number,
        type: NotificationType<T>,
        sequence: number,
        data?: T): Notification<T> {
        return new Notification<T>(remoteId, type, sequence, data);
    }
}


export interface NotificationListener<T> {

    handleNotification(notification: Notification<T>): void;
}

export interface Notifier {

    addNotificationListener<T>(remoteId: number,
        notificationType: NotificationType<T>,
        listener: NotificationListener<T>): void;

    removeNotificationListener<T>(remoteId: number,
        notificationType: NotificationType<T>,
        listener: NotificationListener<T>): void;

    close(): void;
}

enum RequestAction {
    ADD = "ADD",
    REMOVE = "REMOVE",
    HEARTBEAT = "HEARTBEAT",
}


class SubscriptionRequest<T> {

    constructor(readonly action: RequestAction,
        readonly remoteId: number,
        readonly type: NotificationType<T>) {
    }
}

class ListenersByType {

    private readonly listeners: Map<String, NotificationListener<any>[]> = new Map();

    dispatch(notification: Notification<any>) {

        const listeners: NotificationListener<any>[] | undefined =
            this.listeners.get(notification.type.name)

        if (listeners) {
            listeners.forEach(element => {
                element.handleNotification(notification);
            });
        }
    }

    addNotificationListener<T>(
        notificationType: NotificationType<T>,
        listener: NotificationListener<T>): boolean {

        const listeners: NotificationListener<any>[] | undefined =
            this.listeners.get(notificationType.name)

        if (listeners) {
            listeners.push(listener);
            return false;
        }
        else {
            this.listeners.set(notificationType.name, [listener]);
            return true;
        }
    }

    removeNotificationListener<T>(
        notificationType: NotificationType<T>,
        listener: NotificationListener<T>): boolean {

        const listeners: NotificationListener<any>[] | undefined =
            this.listeners.get(notificationType.name)

        if (listeners) {
            const newListeners: NotificationListener<T>[] =
                listeners.filter(e => e != listener);

            if (newListeners.length == 0) {
                this.listeners.delete(notificationType.name)
                return true;
            }
            else {
                this.listeners.set(notificationType.name,
                    newListeners);
                return false;
            }
        }
        else {
            // Don't thing this should ever happen. Should we error?
            return false;
        }
    }

    isEmpty(): boolean {
        return this.listeners.size == 0;
    }
}

class ListenerManager {

    private readonly listeners: Map<number, ListenersByType> = new Map();

    dispatch(notification: Notification<any>) {

        const listeners: ListenersByType | undefined =
            this.listeners.get(notification.remoteId)

        if (listeners) {
            listeners.dispatch(notification);
        }

    }

    addNotificationListener<T>(remoteId: number,
        notificationType: NotificationType<T>,
        listener: NotificationListener<T>): boolean {

        const listeners: ListenersByType | undefined =
            this.listeners.get(remoteId)

        if (listeners) {
            return listeners.addNotificationListener(
                notificationType, listener);
        }
        else {
            const newListeners = new ListenersByType();
            this.listeners.set(remoteId, newListeners);
            return newListeners.addNotificationListener(
                notificationType, listener);
        }
    }

    removeNotificationListener<T>(remoteId: number,
        notificationType: NotificationType<T>,
        listener: NotificationListener<T>): boolean {

        const listeners: ListenersByType | undefined =
            this.listeners.get(remoteId)

        if (listeners) {

            const lastForType: boolean = listeners.removeNotificationListener(
                notificationType, listener);

            if (listeners.isEmpty()) {
                this.listeners.delete(remoteId)
                return true;
            }
            else {
                return lastForType;
            }
        }
        else {
            // Don't thing this should ever happen. Should we error?
            return false;
        }
    }
}

/** A function that takes a command function and an interval and return a method of stopping it */
export type Timer = (fn: () => void, interval: number) => () => void; 

export type Clock = () => number;

export interface Channel {

    send(message: string): void

    setReceive(callback: (message: string) => void): void;

    close(): void;
}

export type NotifierOptions = {
    timer: Timer;
    clock: Clock;
}

const SYSTEM_REMOTE_ID: number = -1;

/** 10 second heartbeat */
export const HEARTBEAT_MILLIS: number = 10 * 1000;

const HEARTBEAT_TYPE: NotificationType<void> =
    NotificationType.ofName("heartbeat")
        .andDataType(JAVA_VOID);

const HEARTBEAT_REQUEST = new SubscriptionRequest(
    RequestAction.HEARTBEAT, SYSTEM_REMOTE_ID, HEARTBEAT_TYPE
);

export class RemoteNotifier implements Notifier {

    private readonly logger: Logger = LoggerFactory.getLogger(RemoteNotifier);

    private readonly listeners: ListenerManager = new ListenerManager();

    private readonly timerStop: () => void;

    private readonly clock: Clock;

    private lastMessageTime: number;

    constructor(private readonly channel: Channel, options?: NotifierOptions) {

        if (!options) {
            const timer = function(fn: () => void, interval: number): () => void {

                const id = setInterval(fn, interval);

                return () => {
                    clearInterval(id);
                }
            }
            const clock = Date.now;

            options = {
                timer: timer,
                clock: clock
            }
        }

        const clock: Clock = options.clock;
        this.lastMessageTime = clock();

        this.channel.setReceive((message: string) => {

            this.logger.debug("Received: " + message);

            const notification = JSON.parse(message) as Notification<any>;
            this.lastMessageTime = clock();
            this.listeners.dispatch(notification);
        });

        this.timerStop = options.timer(() => {
            const timeNow = clock();
            if (timeNow > this.lastMessageTime + HEARTBEAT_MILLIS) {
                this.channel.send(JSON.stringify(HEARTBEAT_REQUEST));
            }
        }, HEARTBEAT_MILLIS);

        this.clock = clock;
    }

    static fromWebSocket(url: string, options?: NotifierOptions): Promise<RemoteNotifier> {

        const ws: WebSocket = new WebSocket(url);

        return new Promise((promise, reject) => {

            ws.onerror = (ev) => reject("Failed to open WS:" + ev);

            ws.onopen = (ev) => {

                const wsChannel: Channel = {
                    send: (message: string) => ws.send(message),
                    setReceive: (callback: (message: string) => void) => {
                        const wsCallback = (event: any) => {
                            const data = event.data as string;
                            callback(data);
                        }
                        ws.onmessage = wsCallback;
                    },
                    close: (): void => {
                        ws.close();
                    }
                };
        
                promise(new RemoteNotifier(wsChannel, options));
            }
        });
    }

    static fromChannel(channel: Channel, options?: NotifierOptions): RemoteNotifier {
        return new RemoteNotifier(channel, options);
    }

    addNotificationListener<T>(remoteId: number,
        notificationType: NotificationType<T>,
        listener: NotificationListener<T>): void {

        if (this.listeners.addNotificationListener(
            remoteId, notificationType, listener)) {

            const request = new SubscriptionRequest<T>(RequestAction.ADD, remoteId, notificationType);

            this.sendRequest(request);
        }
    }

    removeNotificationListener<T>(remoteId: number,
        notificationType: NotificationType<T>,
        listener: NotificationListener<T>): void {

        if (this.listeners.removeNotificationListener(
            remoteId, notificationType, listener)) {

            const request = new SubscriptionRequest<T>(RequestAction.REMOVE, remoteId, notificationType);

            this.sendRequest(request);
        }
    }

    private sendRequest(request: SubscriptionRequest<any>) {

        const message = JSON.stringify(request);

        this.logger.debug("Sending: " + message);

        this.channel.send(message);
    }

    close(): void {
        this.timerStop();
        this.channel.close();
    }
}