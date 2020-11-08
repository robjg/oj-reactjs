import { JAVA_STRING } from '../../src/remote/java';
import { RemoteConnection, RemoteProxy, RemoteSessionFactory, ServerInfo } from '../../src/remote/remote';
import { InvokeRequest, InvokeResponse } from '../../src/remote/invoke';
import { ConfigurationOwner, ConfigurationOwnerHandler } from '../../src/remote/ojremotes';
import { NotificationListener, NotificationType } from '../../src/remote/notify';

// Should move
test('Session With ConfigurationOwner', async () => {

    const requests: Array<InvokeRequest<any>> = new Array();

    const responses = new Array<InvokeResponse<any>>();

    responses.push(new InvokeResponse<ServerInfo>(ServerInfo.javaClass.name,
        {
            implementations: [
                {
                    type: ConfigurationOwner.javaClass.name,
                    version: "2.0"
                }
            ]
        }));

    responses.push(new InvokeResponse<string>(JAVA_STRING.name, "Foo"));

    let invokeIndex: number = 0;

    const invoker: RemoteConnection = {
        invoke<T>(invokeRequest: InvokeRequest<T>): Promise<InvokeResponse<T>> {

            requests.push(invokeRequest);

            return Promise.resolve(responses[invokeIndex++]);
        },

        addNotificationListener<T>(remoteId: number,
            notificationType: NotificationType<T>,
            listener: NotificationListener<T>): void {
            throw Error("Unexpected");
        },

        removeNotificationListener<T>(remoteId: number,
            notificationType: NotificationType<T>,
            listener: NotificationListener<T>): void {
            throw Error("Unexpected");
        }
    }

    const sessionFactory = new RemoteSessionFactory(invoker)
        .register(new ConfigurationOwnerHandler());

    const session = sessionFactory.createRemoteSession();

    const proxy: RemoteProxy = await session.getOrCreate(1);

    expect(proxy.isA(ConfigurationOwner)).toBe(true);

    const configurationOwner: ConfigurationOwner = proxy.as(ConfigurationOwner);

    const form: string = await configurationOwner.blankForm(true, "some:foo", "foo.bar.foo");

    expect(form).toBe("Foo");

    const formRequest = requests[1];

    expect(formRequest.args).toStrictEqual([true, "some:foo", "foo.bar.foo"]);
    expect(formRequest.remoteId).toStrictEqual(1);
    expect(formRequest.argTypes).toBeUndefined();
})
