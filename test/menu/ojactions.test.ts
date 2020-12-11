import { mock } from "jest-mock-extended";
import { Clipboard } from "../../src/clipboard";
import { ConfigurationOwner, Resettable, Runnable, Stoppable } from "../../src/remote/ojremotes";
import { RemoteProxy } from "../../src/remote/remote";
import { CopyActionFactory, CutActionFactory, DeleteActionFactory, HardResetActionFactory, PasteActionFactory, RunActionFactory, SoftResetActionFactory, StopActionFactory } from "../../src/menu/ojactions";
import { Action, ActionContext } from "../../src/menu/actions";
import { Latch } from "../testutil";

test("Runnable Runs", () => {

    const runnable = mock<Runnable>();

    const proxy = mock<RemoteProxy>();
    
    proxy.isA.calledWith(Runnable).mockReturnValue(true);
    proxy.as.calledWith(Runnable).mockReturnValue(runnable);

    const actionContext: ActionContext = {
        parent: null,
        proxy: proxy,
        clipboard: mock<Clipboard>()
    };

    const actionFactory = new RunActionFactory();

    const action = actionFactory.createAction(actionContext);

    expect(action).not.toBeNull();

    (action as Action).perform();

    expect(runnable.run).toBeCalled();
});

test("Soft Reset Resets", () => {

    const resettable = mock<Resettable>();

    const proxy = mock<RemoteProxy>();
    
    proxy.isA.calledWith(Resettable).mockReturnValue(true);
    proxy.as.calledWith(Resettable).mockReturnValue(resettable);

    const actionContext: ActionContext = {
        parent: null,
        proxy: proxy,
        clipboard: mock<Clipboard>()
    };

    const actionFactory = new SoftResetActionFactory();

    const action = actionFactory.createAction(actionContext);

    expect(action).not.toBeNull();

    (action as Action).perform();

    expect(resettable.softReset).toBeCalled();
});

test("Hard Reset Resets", () => {

    const resettable = mock<Resettable>();

    const proxy = mock<RemoteProxy>();
    
    proxy.isA.calledWith(Resettable).mockReturnValue(true);
    proxy.as.calledWith(Resettable).mockReturnValue(resettable);

    const actionContext: ActionContext = {
        parent: null,
        proxy: proxy,
        clipboard: mock<Clipboard>()
    };

    const actionFactory = new HardResetActionFactory();

    const action = actionFactory.createAction(actionContext);

    expect(action).not.toBeNull();

    (action as Action).perform();

    expect(resettable.hardReset).toBeCalled();
});

test("Stoppable stops", () => {

    const stoppable = mock<Stoppable>();

    const proxy = mock<RemoteProxy>();
    
    proxy.isA.calledWith(Stoppable).mockReturnValue(true);
    proxy.as.calledWith(Stoppable).mockReturnValue(stoppable);

    const actionContext: ActionContext = {
        parent: null,
        proxy: proxy,
        clipboard: mock<Clipboard>()
    };

    const actionFactory = new StopActionFactory();

    const action = actionFactory.createAction(actionContext);

    expect(action).not.toBeNull();

    (action as Action).perform();

    expect(stoppable.stop).toBeCalled();
});

test("Stoppable stops", () => {

    const stoppable = mock<Stoppable>();

    const proxy = mock<RemoteProxy>();
    
    proxy.isA.calledWith(Stoppable).mockReturnValue(true);
    proxy.as.calledWith(Stoppable).mockReturnValue(stoppable);

    const actionContext: ActionContext = {
        parent: null,
        proxy: proxy,
        clipboard: mock<Clipboard>()
    };

    const actionFactory = new StopActionFactory();

    const action = actionFactory.createAction(actionContext);

    expect(action).not.toBeNull();

    (action as Action).perform();

    expect(stoppable.stop).toBeCalled();
});

test("Cut cuts", async () => {

    const proxy = mock<RemoteProxy>();

    const latch: Latch = new Latch();

    const configOwner = mock<ConfigurationOwner>();

    configOwner.cut.calledWith(proxy)
    .mockImplementation((p) => {
        latch.countDown();
        return Promise.resolve("SOME CONFIG")
    });

    const proxyOwner = mock<RemoteProxy>();
    
    proxyOwner.isA.calledWith(ConfigurationOwner).mockReturnValue(true);
    proxyOwner.as.calledWith(ConfigurationOwner).mockReturnValue(configOwner);

    const ownerContext: ActionContext = {
        parent: null,
        proxy: proxyOwner,
        clipboard: mock<Clipboard>()
    };

    const clipboard = mock<Clipboard>();

    const childContext: ActionContext = {
        parent: ownerContext,
        proxy: proxy,
        clipboard: clipboard
    };

    const actionFactory = new CutActionFactory();

    const action = actionFactory.createAction(childContext);

    expect(action).not.toBeNull();
    expect((action as Action).isEnabled).toBe(true);

    (action as Action).perform();

    expect(configOwner.cut).toBeCalled();

    await latch.promise;

    expect(clipboard.copy).toBeCalledWith("SOME CONFIG");
});

test("Copy copies", async () => {

    const proxy = mock<RemoteProxy>();

    const latch: Latch = new Latch();

    const configOwner = mock<ConfigurationOwner>();

    configOwner.copy.calledWith(proxy)
    .mockImplementation((p) => {
        latch.countDown();
        return Promise.resolve("SOME CONFIG")
    });

    const proxyOwner = mock<RemoteProxy>();
    
    proxyOwner.isA.calledWith(ConfigurationOwner).mockReturnValue(true);
    proxyOwner.as.calledWith(ConfigurationOwner).mockReturnValue(configOwner);

    const ownerContext: ActionContext = {
        parent: null,
        proxy: proxyOwner,
        clipboard: mock<Clipboard>()
    };

    const clipboard = mock<Clipboard>();

    const childContext: ActionContext = {
        parent: ownerContext,
        proxy: proxy,
        clipboard: clipboard
    };

    const actionFactory = new CopyActionFactory();

    const action = actionFactory.createAction(childContext);

    expect(action).not.toBeNull();
    expect((action as Action).isEnabled).toBe(true);

    (action as Action).perform();

    expect(configOwner.copy).toBeCalled();

    await latch.promise;

    expect(clipboard.copy).toBeCalledWith("SOME CONFIG");
});

test("Paste pastes", async () => {

    const proxy = mock<RemoteProxy>();

    const latch: Latch = new Latch();

    const configOwner = mock<ConfigurationOwner>();
    configOwner.paste
    .mockImplementation((p, i, c) => {
        latch.countDown();
        return Promise.resolve();
    });

    const proxyOwner = mock<RemoteProxy>();
    
    proxyOwner.isA.calledWith(ConfigurationOwner).mockReturnValue(true);
    proxyOwner.as.calledWith(ConfigurationOwner).mockReturnValue(configOwner);

    const ownerContext: ActionContext = {
        parent: null,
        proxy: proxyOwner,
        clipboard: mock<Clipboard>()
    };

    const clipboard = mock<Clipboard>();
    clipboard.paste.mockReturnValue(Promise.resolve("SOME CONFIG"));

    const childContext: ActionContext = {
        parent: ownerContext,
        proxy: proxy,
        clipboard: clipboard
    };

    const actionFactory = new PasteActionFactory();

    const action = actionFactory.createAction(childContext);

    expect(action).not.toBeNull();
    expect((action as Action).isEnabled).toBe(true);

    (action as Action).perform();

    await latch.promise;

    expect(configOwner.paste).toBeCalledWith(proxy, -1, "SOME CONFIG");
});

test("Delete deletes", () => {

    const proxy = mock<RemoteProxy>();

    const configOwner = mock<ConfigurationOwner>();

    const proxyOwner = mock<RemoteProxy>();
    
    proxyOwner.isA.calledWith(ConfigurationOwner).mockReturnValue(true);
    proxyOwner.as.calledWith(ConfigurationOwner).mockReturnValue(configOwner);

    const ownerContext: ActionContext = {
        parent: null,
        proxy: proxyOwner,
        clipboard: mock<Clipboard>()
    };

    const childContext: ActionContext = {
        parent: ownerContext,
        proxy: proxy,
        clipboard: mock<Clipboard>()
    };

    const actionFactory = new DeleteActionFactory();

    const action = actionFactory.createAction(childContext);

    expect(action).not.toBeNull();
    expect((action as Action).isEnabled).toBe(true);

    (action as Action).perform();

    expect(configOwner.delete).toBeCalled();
});
