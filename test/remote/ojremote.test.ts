import { mock } from 'jest-mock-extended';
import { InvokeRequest, InvokeResponse, OperationType } from '../../src/remote/invoke';
import { Notification, NotificationListener, NotificationType } from '../../src/remote/notify';
import { IconData, IconEvent, Iconic, IconicHandler, IconListener, ImageData, Runnable, RunnableHandler, StateData, StateFlag } from '../../src/remote/ojremotes';
import { ClientToolkit, Implementation, RemoteConnection, RemoteProxy, RemoteSession, RemoteSessionFactory, ServerInfo } from '../../src/remote/remote';
import { Latch, Phaser } from '../testutil';

test('StateData', () => {

    const json = '{"jobState":{"name":"EXCEPTION","flags":["EXCEPTION"]},"date":"Oct 5, 2020 9:53:12 AM","throwable":{"originalExcpetionClassName":"java.lang.RuntimeException","detailMessage":"Ahhh!","stackTrace":[{"declaringClass":"org.oddjob.web.gson.HandlerTypesAsJsonTest","methodName":"testStateful","fileName":"HandlerTypesAsJsonTest.java","lineNumber":44},{"declaringClass":"sun.reflect.NativeMethodAccessorImpl","methodName":"invoke0","fileName":"NativeMethodAccessorImpl.java","lineNumber":-2},{"declaringClass":"sun.reflect.NativeMethodAccessorImpl","methodName":"invoke","fileName":"NativeMethodAccessorImpl.java","lineNumber":62},{"declaringClass":"sun.reflect.DelegatingMethodAccessorImpl","methodName":"invoke","fileName":"DelegatingMethodAccessorImpl.java","lineNumber":43},{"declaringClass":"java.lang.reflect.Method","methodName":"invoke","fileName":"Method.java","lineNumber":498},{"declaringClass":"org.junit.runners.model.FrameworkMethod$1","methodName":"runReflectiveCall","fileName":"FrameworkMethod.java","lineNumber":50},{"declaringClass":"org.junit.internal.runners.model.ReflectiveCallable","methodName":"run","fileName":"ReflectiveCallable.java","lineNumber":12},{"declaringClass":"org.junit.runners.model.FrameworkMethod","methodName":"invokeExplosively","fileName":"FrameworkMethod.java","lineNumber":47},{"declaringClass":"org.junit.internal.runners.statements.InvokeMethod","methodName":"evaluate","fileName":"InvokeMethod.java","lineNumber":17},{"declaringClass":"org.junit.runners.ParentRunner","methodName":"runLeaf","fileName":"ParentRunner.java","lineNumber":325},{"declaringClass":"org.junit.runners.BlockJUnit4ClassRunner","methodName":"runChild","fileName":"BlockJUnit4ClassRunner.java","lineNumber":78},{"declaringClass":"org.junit.runners.BlockJUnit4ClassRunner","methodName":"runChild","fileName":"BlockJUnit4ClassRunner.java","lineNumber":57},{"declaringClass":"org.junit.runners.ParentRunner$3","methodName":"run","fileName":"ParentRunner.java","lineNumber":290},{"declaringClass":"org.junit.runners.ParentRunner$1","methodName":"schedule","fileName":"ParentRunner.java","lineNumber":71},{"declaringClass":"org.junit.runners.ParentRunner","methodName":"runChildren","fileName":"ParentRunner.java","lineNumber":288},{"declaringClass":"org.junit.runners.ParentRunner","methodName":"access$000","fileName":"ParentRunner.java","lineNumber":58},{"declaringClass":"org.junit.runners.ParentRunner$2","methodName":"evaluate","fileName":"ParentRunner.java","lineNumber":268},{"declaringClass":"org.junit.runners.ParentRunner","methodName":"run","fileName":"ParentRunner.java","lineNumber":363},{"declaringClass":"org.junit.runner.JUnitCore","methodName":"run","fileName":"JUnitCore.java","lineNumber":137},{"declaringClass":"com.intellij.junit4.JUnit4IdeaTestRunner","methodName":"startRunnerWithArgs","fileName":"JUnit4IdeaTestRunner.java","lineNumber":69},{"declaringClass":"com.intellij.rt.junit.IdeaTestRunner$Repeater","methodName":"startRunnerWithArgs","fileName":"IdeaTestRunner.java","lineNumber":33},{"declaringClass":"com.intellij.rt.junit.JUnitStarter","methodName":"prepareStreamsAndStart","fileName":"JUnitStarter.java","lineNumber":220},{"declaringClass":"com.intellij.rt.junit.JUnitStarter","methodName":"main","fileName":"JUnitStarter.java","lineNumber":53}],"suppressedExceptions":[]}}';

    const obj = JSON.parse(json)
    const stateData = new StateData(obj.jobState, new Date(obj.date), obj.throwable);

    expect(stateData.jobState.name).toBe("EXCEPTION");
    expect(stateData.jobState.flags[0]).toBe(StateFlag.EXCEPTION);

    expect(stateData.date).toStrictEqual(new Date("Oct 5, 2020 9:53:12 AM"));

});



test('Iconic Handler', async () => {

    let listener_: NotificationListener<any> | null = null;

    const impls: Implementation<any>[] = [
        new Implementation(Iconic.javaClass.name, "2.0")];

    const syncNotification: Notification<IconData> = new Notification(42,
        IconicHandler.ICON_CHANGED_NOTIF_TYPE, 1000, new IconData("complete"));

    const laterNotification: Notification<IconData> = new Notification(42,
        IconicHandler.ICON_CHANGED_NOTIF_TYPE, 1001, new IconData("ready"));

    const latch: Latch = new Latch();

    const remote: RemoteConnection = {

        invoke<T>(invokeRequest: InvokeRequest<T>): Promise<InvokeResponse<T>> {

            if (invokeRequest.operationType.name == "serverInfo") {
                return Promise.resolve(InvokeResponse.ofJavaObject(
                    new class extends ServerInfo {
                        implementations = impls;
                    }));
            }

            if (invokeRequest.operationType.name == IconicHandler.SYNCHRONIZE.name) {
                return Promise.resolve(InvokeResponse.ofJavaObject(syncNotification));
            }

            throw Error("Unexpected");
        },

        addNotificationListener<T>(remoteId: number,
            notificationType: NotificationType<T>,
            listener: NotificationListener<T>): void {
            expect(remoteId).toBe(42);
            expect(notificationType).toBe(IconicHandler.ICON_CHANGED_NOTIF_TYPE);

            if (listener_ == null) {
                listener_ = listener;
                latch.countDown();
            }
            else {
                throw new Error("Unexpected.");
            }
        },

        removeNotificationListener<T>(remoteId: number,
            notificationType: NotificationType<T>,
            listener: NotificationListener<T>): void {
            if (listener_ == listener) {
                listener_ = null;
            }
            else {
                throw new Error("Unexpected.");
            }
        }
    }

    const session: RemoteSession = RemoteSessionFactory.from(remote)
        .register(new IconicHandler())
        .createRemoteSession();


    const proxy: RemoteProxy = await session.getOrCreate(42);

    expect(proxy.isA(Iconic)).toBe(true);

    const iconic: Iconic = proxy.as(Iconic);

    const results: IconEvent[] = [];

    iconic.addIconListener({ iconEvent: (event: IconEvent) => { results.push(event) } });

    await latch.promise;

    expect(listener_).not.toBeNull();
    expect(results.length).toBe(1);

    // 
    if (listener_) {
        (listener_ as NotificationListener<any>).handleNotification(laterNotification);
    }

    expect(results.length).toBe(2);

    proxy.destroy();

    expect(listener_).toBeNull();

});

test("Iconic Handler Caches Icons OK", async () => {

    const toolkit: ClientToolkit = mock<ClientToolkit>();

    toolkit.invoke = <T>(operationType: OperationType<T>, ...args: any): Promise<T> => {

        expect(operationType).toBe(IconicHandler.ICON_FOR);

        return Promise.resolve(new ImageData("abc", "image/gif")) as unknown as Promise<T>;

    }

    const handler: Iconic = new IconicHandler().createHandler(toolkit);

    const result1: ImageData = await handler.iconForId("foo");

    const result2: ImageData = await handler.iconForId("foo");

    expect(result1).toBe(result2);
});

test("Runnable inovkes run", () => {

    const toolkit: ClientToolkit = mock<ClientToolkit>();

    const runnable: Runnable = new RunnableHandler().createHandler(toolkit);

    runnable.run();

    expect(toolkit.invoke).toBeCalledWith(RunnableHandler.RUN);

})