import { mock } from "jest-mock-extended";
import { Resettable, Runnable, Stoppable } from "../../src/remote/ojremotes";
import { RemoteProxy } from "../../src/remote/remote";
import { HardResetActionFactory, RunActionFactory, SoftResetActionFactory, StopActionFactory } from "../../src/menu/ojactions";
import { Action, ActionContext } from "../../src/menu/actions";

test("Runnable Runs", () => {

    const runnable = mock<Runnable>();

    const proxy = mock<RemoteProxy>();
    
    proxy.isA.calledWith(Runnable).mockReturnValue(true);
    proxy.as.calledWith(Runnable).mockReturnValue(runnable);

    const actionContext: ActionContext = {
        parent: null,
        proxy: proxy
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
        proxy: proxy
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
        proxy: proxy
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
        proxy: proxy
    };

    const actionFactory = new StopActionFactory();

    const action = actionFactory.createAction(actionContext);

    expect(action).not.toBeNull();

    (action as Action).perform();

    expect(stoppable.stop).toBeCalled();
});
