import { mock } from "jest-mock-extended";
import { Clipboard } from "../../src/clipboard";
import { ConfigurationOwner, ConfigPoint, Resettable, Runnable, Stoppable } from "../../src/remote/ojremotes";
import { RemoteProxy } from "../../src/remote/remote";
import { CopyActionFactory, CutActionFactory, DeleteActionFactory, HardResetActionFactory, PasteActionFactory, PasteBeforeActionFactory, RunActionFactory, SoftResetActionFactory, StopActionFactory } from "../../src/menu/ojactions";
import { Action, ActionContext, DragAction, DropAction, DropBeforeAction } from "../../src/menu/actions";
import { Latch } from "../testutil";

test("Runnable Runs", () => {

    const runnable = mock<Runnable>();

    const proxy = mock<RemoteProxy>();
    
    proxy.isA.calledWith(Runnable).mockReturnValue(true);
    proxy.as.calledWith(Runnable).mockReturnValue(runnable);

    const actionContext = mock<ActionContext>();
    Object.defineProperty(actionContext, 'proxy', { value: proxy }); 
    Object.defineProperty(actionContext, 'clipboard', { value: mock<Clipboard>() }); 

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

    const actionContext = mock<ActionContext>();
    Object.defineProperty(actionContext, 'proxy', { value: proxy }); 
    Object.defineProperty(actionContext, 'clipboard', { value: mock<Clipboard>() }); 

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

    const actionContext = mock<ActionContext>();
    Object.defineProperty(actionContext, 'proxy', { value: proxy }); 
    Object.defineProperty(actionContext, 'clipboard', { value: mock<Clipboard>() }); 

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

    const actionContext = mock<ActionContext>();
    Object.defineProperty(actionContext, 'proxy', { value: proxy }); 
    Object.defineProperty(actionContext, 'clipboard', { value: mock<Clipboard>() }); 

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

    const actionContext = mock<ActionContext>();
    Object.defineProperty(actionContext, 'proxy', { value: proxy }); 
    Object.defineProperty(actionContext, 'clipboard', { value: mock<Clipboard>() }); 

    const actionFactory = new StopActionFactory();

    const action = actionFactory.createAction(actionContext);

    expect(action).not.toBeNull();

    (action as Action).perform();

    expect(stoppable.stop).toBeCalled();
});

test("Cut cuts", async () => {

    const proxy = mock<RemoteProxy>();

    const latch: Latch = new Latch();

    const dragPoint = mock<ConfigPoint>();
    dragPoint.isCutSupported = false;
    dragPoint.cut.calledWith()
    .mockImplementation(() => {
        latch.countDown();
        return Promise.resolve("SOME CONFIG")
    });

    proxy.isA.calledWith(ConfigPoint).mockReturnValue(true);
    proxy.as.calledWith(ConfigPoint).mockReturnValue(dragPoint);

    const clipboard = mock<Clipboard>();

    const childContext = mock<ActionContext>();
    Object.defineProperty(childContext, 'proxy', { value: proxy }); 
    Object.defineProperty(childContext, 'clipboard', { value: clipboard }); 

    const actionFactory = new CutActionFactory();

    const action = actionFactory.createAction(childContext);

    expect(action).not.toBeNull();

    expect((action as Action).isEnabled).toBe(false);

    // Happens later via notification.
    dragPoint.isCutSupported = true;

    expect((action as Action).isEnabled).toBe(true);

    (action as Action).perform();

    expect(dragPoint.cut).toBeCalled();

    await latch.promise;

    expect(clipboard.copy).toBeCalledWith("SOME CONFIG");
});

test("Cut as a DragAction", async () => {

    const proxy = mock<RemoteProxy>();

    const latch: Latch = new Latch();

    const dragPoint = mock<ConfigPoint>();
    dragPoint.isCutSupported = true;
    dragPoint.copy.calledWith()
    .mockImplementation(() => {
        latch.countDown();
        return Promise.resolve("SOME CONFIG")
    });

    proxy.isA.calledWith(ConfigPoint).mockReturnValue(true);
    proxy.as.calledWith(ConfigPoint).mockReturnValue(dragPoint);

    const childContext = mock<ActionContext>();
    Object.defineProperty(childContext, 'proxy', { value: proxy }); 
    Object.defineProperty(childContext, 'clipboard', { value: mock<Clipboard>() }); 

    const actionFactory = new CutActionFactory();

    const action = actionFactory.createAction(childContext);

    if (action == null) {
        throw new Error("Unexepected null");
    }

    expect(DragAction.isDragAction(action)).toBe(true);
    expect(DropAction.isDropAction(action)).toBe(false);
    expect((action as DragAction).isDraggable).toBe(true);

    const data: string = await (action as DragAction).dragData();

    await latch.promise;

    expect(data).toBe("SOME CONFIG");

    (action as DragAction).dragComplete();

    expect(dragPoint.delete).toBeCalled();
});

test("Cut disabled", async () => {

    const proxy = mock<RemoteProxy>();

    const dragPoint = mock<ConfigPoint>();
    dragPoint.isCutSupported = false;

    proxy.isA.calledWith(ConfigPoint).mockReturnValue(true);
    proxy.as.calledWith(ConfigPoint).mockReturnValue(dragPoint);

    const actionContext = mock<ActionContext>();
    Object.defineProperty(actionContext, 'proxy', { value: proxy }); 
    Object.defineProperty(actionContext, 'clipboard', { value: mock<Clipboard>() }); 

    const actionFactory = new CutActionFactory();

    const action = actionFactory.createAction(actionContext);

    expect(action).not.toBeNull();
    expect((action as Action).isEnabled).toBe(false);

});

test("Copy copies", async () => {

    const proxy = mock<RemoteProxy>();

    const latch: Latch = new Latch();

    const dragPoint = mock<ConfigPoint>();
    dragPoint.copy.calledWith()
    .mockImplementation( () => {
        latch.countDown();
        return Promise.resolve("SOME CONFIG");
    })
    
    proxy.isA.calledWith(ConfigPoint).mockReturnValue(true);
    proxy.as.calledWith(ConfigPoint).mockReturnValue(dragPoint);

    const clipboard = mock<Clipboard>();

    const childContext = mock<ActionContext>();
    Object.defineProperty(childContext, 'proxy', { value: proxy }); 
    Object.defineProperty(childContext, 'clipboard', { value: clipboard }); 

    const actionFactory = new CopyActionFactory();

    const action = actionFactory.createAction(childContext);

    expect(action).not.toBeNull();
    expect((action as Action).isEnabled).toBe(true);

    (action as Action).perform();

    expect(dragPoint.copy).toBeCalled();

    await latch.promise;

    expect(clipboard.copy).toBeCalledWith("SOME CONFIG");
});

test("Paste pastes", async () => {

    const proxy = mock<RemoteProxy>();

    const latch: Latch = new Latch();

    const dragPoint = mock<ConfigPoint>();
    dragPoint.isPasteSupported = false;
    dragPoint.paste.mockImplementation((i, c) => {
        latch.countDown();
        return Promise.resolve();
    });

    proxy.isA.calledWith(ConfigPoint).mockReturnValue(true);
    proxy.as.calledWith(ConfigPoint).mockReturnValue(dragPoint);

    const clipboard = mock<Clipboard>();
    clipboard.paste.mockReturnValue(Promise.resolve("SOME CONFIG"));

    const childContext = mock<ActionContext>();
    Object.defineProperty(childContext, 'proxy', { value: proxy }); 
    Object.defineProperty(childContext, 'clipboard', { value: clipboard }); 

    const actionFactory = new PasteActionFactory();

    const action = actionFactory.createAction(childContext);

    expect(action).not.toBeNull();

    expect((action as Action).isEnabled).toBe(false);

    // happens later via notification
    dragPoint.isPasteSupported = true;

    expect((action as Action).isEnabled).toBe(true);

    (action as Action).perform();

    await latch.promise;

    expect(dragPoint.paste).toBeCalledWith(-1, "SOME CONFIG");
});

test("Paste as Drop Action", async () => {

    const proxy = mock<RemoteProxy>();

    const latch: Latch = new Latch();

    const dragPoint = mock<ConfigPoint>();
    dragPoint.isPasteSupported = true;
    dragPoint.paste.mockImplementation((i, c) => {
        latch.countDown();
        return Promise.resolve();
    });

    proxy.isA.calledWith(ConfigPoint).mockReturnValue(true);
    proxy.as.calledWith(ConfigPoint).mockReturnValue(dragPoint);

    const clipboard = mock<Clipboard>();
    clipboard.paste.mockReturnValue(Promise.resolve("SOME CONFIG"));

    const childContext = mock<ActionContext>();
    Object.defineProperty(childContext, 'proxy', { value: proxy }); 
    Object.defineProperty(childContext, 'clipboard', { value: clipboard }); 

    const actionFactory = new PasteActionFactory();

    const action = actionFactory.createAction(childContext);

    if (action == null) {
        throw new Error("Unexepected null");
    }

    expect(DragAction.isDragAction(action)).toBe(false);
    expect(DropAction.isDropAction(action)).toBe(true);
    expect((action as DropAction).isDropTarget).toBe(true);

    (action as DropAction).drop("SOME CONFIG");

    await latch.promise;

    expect(dragPoint.paste).toBeCalledWith(-1, "SOME CONFIG");
});

test("Paste Before pastes", async () => {

    const parentProxy = mock<RemoteProxy>();

    const latch: Latch = new Latch();

    const parentDragPoint = mock<ConfigPoint>();
    parentDragPoint.isPasteSupported = false;
    parentDragPoint.paste.mockImplementation((i, c) => {
        latch.countDown();
        return Promise.resolve();
    });

    parentProxy.isA.calledWith(ConfigPoint).mockReturnValue(true);
    parentProxy.as.calledWith(ConfigPoint).mockReturnValue(parentDragPoint);

    const clipboard = mock<Clipboard>();
    clipboard.paste.mockReturnValue(Promise.resolve("SOME CONFIG"));

    const parentContext = mock<ActionContext>();
    Object.defineProperty(parentContext, 'proxy', { value: parentProxy }); 
    parentContext.indexOf.mockReturnValue(0);

    const childContext = mock<ActionContext>();
    Object.defineProperty(childContext, 'parent', { value: parentContext }); 
    Object.defineProperty(childContext, 'clipboard', { value: clipboard }); 

    const actionFactory = new PasteBeforeActionFactory();

    const action = actionFactory.createAction(childContext);

    expect(action).not.toBeNull();

    expect((action as Action).isEnabled).toBe(false);

    // happens later via notification
    parentDragPoint.isPasteSupported = true;

    expect((action as Action).isEnabled).toBe(true);

    (action as Action).perform();

    await latch.promise;

    expect(parentDragPoint.paste).toBeCalledWith(0, "SOME CONFIG");
});

test("Paste Before as Drop Before Action", async () => {

    const parentProxy = mock<RemoteProxy>();

    const latch: Latch = new Latch();

    const parentDragPoint = mock<ConfigPoint>();
    parentDragPoint.isPasteSupported = true;
    parentDragPoint.paste.mockImplementation((i, c) => {
        latch.countDown();
        return Promise.resolve();
    });

    parentProxy.isA.calledWith(ConfigPoint).mockReturnValue(true);
    parentProxy.as.calledWith(ConfigPoint).mockReturnValue(parentDragPoint);

    const clipboard = mock<Clipboard>();
    clipboard.paste.mockReturnValue(Promise.resolve("SOME CONFIG"));

    const parentContext = mock<ActionContext>();
    Object.defineProperty(parentContext, 'proxy', { value: parentProxy }); 
    parentContext.indexOf.mockReturnValue(2);

    const childContext = mock<ActionContext>();
    Object.defineProperty(childContext, 'parent', { value: parentContext }); 
    Object.defineProperty(childContext, 'clipboard', { value: clipboard }); 

    const actionFactory = new PasteBeforeActionFactory();

    const action = actionFactory.createAction(childContext);

    if (action == null) {
        throw new Error("Unexepected null");
    }

    expect(DragAction.isDragAction(action)).toBe(false);
    expect(DropAction.isDropAction(action)).toBe(false);
    expect(DropBeforeAction.isDropBeforeAction(action)).toBe(true);
    expect((action as DropBeforeAction).isDropBeforeTarget).toBe(true);

    (action as DropBeforeAction).dropBefore("SOME CONFIG");

    await latch.promise;

    expect(parentDragPoint.paste).toBeCalledWith(2, "SOME CONFIG");
});

test("Delete deletes", async () => {

    const proxy = mock<RemoteProxy>();

    const dragPoint = mock<ConfigPoint>();
    dragPoint.isCutSupported = false;

    proxy.isA.calledWith(ConfigPoint).mockReturnValue(true);
    proxy.as.calledWith(ConfigPoint).mockReturnValue(dragPoint);

    const actionContext = mock<ActionContext>();
    Object.defineProperty(actionContext, 'proxy', { value: proxy }); 
    Object.defineProperty(actionContext, 'clipboard', { value: mock<Clipboard>() }); 

    const actionFactory = new DeleteActionFactory();

    const action = actionFactory.createAction(actionContext);

    expect(action).not.toBeNull();
    expect((action as Action).isEnabled).toBe(false);

    // happens later via notification
    dragPoint.isCutSupported = true;

    expect((action as Action).isEnabled).toBe(true);

    (action as Action).perform();

    expect(dragPoint.delete).toBeCalled();
});
