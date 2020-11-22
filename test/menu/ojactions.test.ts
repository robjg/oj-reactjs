import { mock } from "jest-mock-extended";
import { Runnable } from "../../src/remote/ojremotes";
import { RemoteProxy } from "../../src/remote/remote";
import { RunnableActionFactory } from "../../src/menu/ojactions";
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

    const actionFactory = new RunnableActionFactory();

    const action = actionFactory.createAction(actionContext);

    expect(action).not.toBeNull();

    (action as Action).perform();

    expect(runnable.run).toBeCalled();
});

