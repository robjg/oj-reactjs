import { mock } from "jest-mock-extended";
import { Action, ActionContext, ActionFactories, ActionFactory } from "../../src/menu/actions";

test("Test actions are filtered", async () => {

    const actionFactory1 = mock<ActionFactory>();
    const actionFactory2 = mock<ActionFactory>();

    const action1 = mock<Action>();

    actionFactory1.createAction
    .mockReturnValue(Promise.resolve(action1))
    actionFactory2.createAction
    .mockReturnValue(Promise.resolve(null))

    const actionFactories: ActionFactories = 
        new ActionFactories([actionFactory1, actionFactory2]);

    const results: Action[] = await actionFactories.actionsFor(mock<ActionContext>());

    expect(results.length).toBe(1);
    expect(results[0]).toBe(action1);
});