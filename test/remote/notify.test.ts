import { checkServerIdentity } from "tls";
import { JAVA_STRING } from "../../src/remote/java";
import { Channel, RemoteNotifier, Notification, NotificationType } from "../../src/remote/notify";

test('Listener Management', () => {

    class ourChannel implements Channel {

        readonly sent: string[] = [];

        callback: ((message: string) => void) | null = null;

        send(message: string): void {
            this.sent.push(message);
        }

        setReceive(callback: (message: string) => void): void {
            this.callback = callback;
        }
    }

    const channel = new ourChannel();

    const test: RemoteNotifier = RemoteNotifier.fromChannel(channel);

    if (channel.callback == null) {
        throw new Error("Shouldn't be null now");
    }

    const callback: ((message: string) => void) = channel.callback;

    const received1: Notification<any>[] = [];
    const received12: Notification<any>[] = [];
    const received2: Notification<any>[] = [];
    const received4: Notification<any>[] = [];

    const type1: NotificationType<string> = NotificationType.ofName("type1")
        .andDataType(JAVA_STRING);

    const type2: NotificationType<string> = NotificationType.ofName("type2")
        .andDataType(JAVA_STRING);


        const handler1 = { 
            handleNotification: (n: Notification<string>) => { received1.push(n) } 
        };
        const handler12 = { 
            handleNotification: (n: Notification<string>) => { received12.push(n) } 
        };
    const handler2 = { 
        handleNotification: (n: Notification<string>) => { received2.push(n) } 
    };
    const handler3 =         {
        handleNotification: (n: Notification<string>) => { throw Error("Nothing should be sent here") }
    };
    const handler4 =         {
        handleNotification: (n: Notification<string>) => { received4.push(n) }
    };

    test.addNotificationListener(2, type1, handler1);

    expect(channel.sent.length).toBe(1);

    test.addNotificationListener(2, type2, handler2);

    expect(channel.sent.length).toBe(2);

    test.addNotificationListener(3, type2, handler3);

    expect(channel.sent.length).toBe(3);

    test.addNotificationListener(2, type1, handler12);

    expect(channel.sent.length).toBe(3);

    test.addNotificationListener(1, type2, handler4);

    expect(channel.sent.length).toBe(4);

    callback('{"remoteId": 2, "type": { "name": "type1", "type": "java.lang.String" }, "data": "foo" }');

    expect(received1.length).toBe(1);
    expect(received1[0].data).toBe("foo");

    expect(received12.length).toBe(1);
    expect(received12[0].data).toBe("foo");

    expect(received2.length).toBe(0);
    expect(received4.length).toBe(0);

    callback('{"remoteId": 2, "type": { "name": "type2", "type": "java.lang.String" }, "data": "bar" }');

    expect(received1.length).toBe(1);

    expect(received12.length).toBe(1);

    expect(received2.length).toBe(1);
    expect(received2[0].data).toBe("bar");

    expect(received4.length).toBe(0);

    callback('{"remoteId": 1, "type": { "name": "type2", "type": "java.lang.String" }, "data": "yum" }');

    expect(received1.length).toBe(1);

    expect(received12.length).toBe(1);

    expect(received2.length).toBe(1);

    expect(received4.length).toBe(1);
    expect(received4[0].data).toBe("yum");

    test.removeNotificationListener(2, type1, handler1);

    expect(channel.sent.length).toBe(4);

    callback('{"remoteId": 2, "type": { "name": "type1", "type": "java.lang.String" }, "data": "foo2" }');

    expect(received1.length).toBe(1);

    expect(received12.length).toBe(2);
    expect(received12[1].data).toBe("foo2");

    expect(received2.length).toBe(1);

    expect(received4.length).toBe(1);

    test.removeNotificationListener(2, type1, handler12);

    expect(channel.sent.length).toBe(5);

    test.removeNotificationListener(2, type2, handler2);

    expect(channel.sent.length).toBe(6);

    test.removeNotificationListener(3, type2, handler3);

    expect(channel.sent.length).toBe(7);

    test.removeNotificationListener(1, type2, handler4);

    expect(channel.sent.length).toBe(8);

    test.addNotificationListener(1, type2, handler4);

    expect(channel.sent.length).toBe(9);
});