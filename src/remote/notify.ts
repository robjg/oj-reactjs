
import { map } from 'jquery';
import { JavaClass, javaClasses, JavaObject } from './java';

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
        Notification, "org.oddjob.Iconic");

    getJavaClass(): JavaClass<Notification<T>> {
        return Notification.javaClass;
    }

    constructor(readonly remoteId: number,
        readonly type: NotificationType<T>,
        readonly sequence: number,
        readonly data?: T) {
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
}

class SubscriptionRequest<T> {

    constructor(readonly action: string,
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

export interface Channel {

    send(message: string): void

    setReceive(callback: (message: string) => void): void;
}

export class RemoteNotifier implements Notifier {

    private readonly listeners: ListenerManager = new ListenerManager();

    constructor(private readonly channel: Channel) {
        this.channel.setReceive((message: string) => {

            const notification = JSON.parse(message) as Notification<any>;    
            this.listeners.dispatch(notification);
        });
    }

    static fromWebSocket(url: string): RemoteNotifier {

        const ws: WebSocket = new WebSocket(url);

        return new RemoteNotifier({
            send: (message: string) => ws.send(message),
            setReceive: (callback: (message: string) => void) => {
                const wsCallback = (event: any) => {
                    const data = event.data as string; 
                    callback(data);                   
                }
                ws.onmessage = wsCallback;
            }
        })        
    }

    static fromChannel(channel: Channel) : RemoteNotifier {
        return new RemoteNotifier(channel);
    }

    addNotificationListener<T>(remoteId: number,
        notificationType: NotificationType<T>,
        listener: NotificationListener<T>): void {

        if (this.listeners.addNotificationListener(
            remoteId, notificationType, listener)) {

                const request = new SubscriptionRequest<T>("ADD", remoteId, notificationType);

                this.channel.send(JSON.stringify(request));
        }
    }

    removeNotificationListener<T>(remoteId: number,
        notificationType: NotificationType<T>,
        listener: NotificationListener<T>): void {

        if (this.listeners.removeNotificationListener(
            remoteId, notificationType, listener)) {

                const request = new SubscriptionRequest<T>("REMOVE", remoteId, notificationType);

                this.channel.send(JSON.stringify(request));
        }
    }
}