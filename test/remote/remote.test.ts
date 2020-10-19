import { javaClasses, JAVA_STRING } from '../../src/remote/java';
import { RemoteProxy, RemoteSessionFactory, ServerInfo } from '../../src/remote/remote';
import { Invoker, InvokeRequest, InvokeResponse } from '../../src/remote/invoke';
import {  ConfigurationOwner, ConfigurationOwnerHandler } from '../../src/remote/ojremotes';


class A {

}

class B {

}


test('Test JavaClasses', () => {

    javaClasses.register(A, "foo.A");
    javaClasses.register(B, "foo.B");

    const classA = javaClasses.forName("foo.A");

    expect(classA.name).toBe("foo.A");

    const classB = javaClasses.forType(B);

    expect(classB.name).toBe("foo.B");

});

test('Session', async () => {

    const requests: Array<InvokeRequest<any>> = new Array();

    const responses = new Array<InvokeResponse<any>>();

    responses.push(new InvokeResponse<ServerInfo>(ServerInfo.javaClass.name,
        {
            interfaces: [
                ConfigurationOwner.javaClass.name
            ]
        }));

    responses.push(new InvokeResponse<string>(JAVA_STRING.name, "Foo"));

    let invokeIndex: number = 0;

    const invoker: Invoker = {
        invoke<T>(invokeRequest: InvokeRequest<T>) : Promise<InvokeResponse<T>> {

            requests.push(invokeRequest);

            return Promise.resolve(responses[invokeIndex++]);
        }
    }

    const sessionFactory = new RemoteSessionFactory(invoker)
        .register(new ConfigurationOwnerHandler());

    const session = sessionFactory.createRemoteSession();
    
    const proxy: RemoteProxy = await session.getOrCreate(1);

    expect(proxy.isA(ConfigurationOwner)).toBe(true);

    const configurationOwner: ConfigurationOwner = proxy.as(ConfigurationOwner);

    const form:string = await configurationOwner.blankForm(true, "some:foo", "foo.bar.foo");

    expect(form).toBe("Foo"); 

    const formRequest = requests[1];

    expect(formRequest.args).toStrictEqual([true, "some:foo", "foo.bar.foo"]);
    expect(formRequest.remoteId).toStrictEqual(1);
    expect(formRequest.argTypes).toBeUndefined();
})
