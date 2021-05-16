import { mock } from "jest-mock-extended";
import { Action, DragAction, DropAction, ActionContext, ActionFactories, ActionFactory, ActionSet } from "../../src/menu/actions";

test("Test actions are filtered", () => {

    const actionFactory1 = mock<ActionFactory>();
    const actionFactory2 = mock<ActionFactory>();

    const action1 = mock<Action>();

    actionFactory1.createAction
        .mockReturnValue(action1)
    actionFactory2.createAction
        .mockReturnValue(null)

    const actionFactories: ActionFactories =
        new ActionFactories([actionFactory1, actionFactory2]);

    const results: ActionSet = actionFactories.actionsFor(mock<ActionContext>());

    expect(results.actions.length).toBe(1);
    expect(results.actions[0]).toBe(action1);
});

test("Drag Drop Interaction Think Through", async () => {

    const dragAction = mock<DragAction>();
    dragAction.isDraggable = false;
    dragAction.dragData.mockImplementation(() => Promise.resolve("Some Data"));

    const dragActionFactory = mock<ActionFactory>();
    dragActionFactory.createAction
        .mockReturnValue(dragAction);

    const dropAction = mock<DropAction>();
    dropAction.isDropTarget = false;

    const dropActionFactory = mock<ActionFactory>();
    dropActionFactory.createAction
        .mockReturnValue(dropAction);

    const actionFactories: ActionFactories =
        new ActionFactories([dragActionFactory, dropActionFactory]);

    const actionSet: ActionSet = actionFactories.actionsFor(mock<ActionContext>());

    expect(actionSet.isDraggable).toBe(false);

    // Drag notifications arive later
    dragAction.isDraggable = true;

    expect(actionSet.isDraggable).toBe(true);

    const dragData: string | undefined = await actionSet.dragData();

    if (dragData == undefined) {
        throw new Error();
    }

    expect(actionSet.isDropTarget).toBe(false);

    dropAction.isDropTarget = true;

    expect(actionSet.isDropTarget).toBe(true);

    actionSet.drop(dragData);

    expect(dropAction.drop).toBeCalledWith("Some Data");

    actionSet.dragComplete();

    expect(dragAction.dragComplete).toBeCalled();
});