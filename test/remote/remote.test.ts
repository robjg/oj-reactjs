import { javaClasses, RemoteSessionFactory, ServerInfo, ComponentTransportable, JAVA_STRING, ConfigurationOwner } from '../../src/remote/remote';
import { Invoker, InvokeRequest, InvokeResponse } from '../../src/remote/invoke';


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

test('Session', () => {

    const args: Array<Array<any>> = new Array();

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

            args.push(invokeRequest.args);

            return Promise.resolve(responses[invokeIndex++]);
        }
    }

    const sessionFactory = new RemoteSessionFactory(invoker);

    const session = sessionFactory.createRemoteSession();
})