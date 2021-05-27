import { AddJobActionFactory, DesignActionFactory } from "../design/designAction";
import { ConfigurationOwner, ConfigPoint, Resettable, Runnable, Stoppable } from "../remote/ojremotes";
import { Implementation } from "../remote/remote";
import { Action, ActionContext, ActionFactory, contextSearch, DragAction, DropAction, DropBeforeAction } from "./actions";

export class RunActionFactory implements ActionFactory {

    createAction(actionContext: ActionContext): Action | null {

        const proxy = actionContext.proxy;

        if (proxy.isA(Runnable)) {

            const runnable = proxy.as(Runnable);

            return {
                name: "Start",

                isEnabled: true,

                perform: (): void => runnable.run()
            };
        }
        else {
            return null;
        }
    }
}

export class SoftResetActionFactory implements ActionFactory {

    createAction(actionContext: ActionContext): Action | null {

        const proxy = actionContext.proxy;

        if (proxy.isA(Resettable)) {

            const resettable = proxy.as(Resettable);

            return {
                name: "Soft Reset",

                isEnabled: true,

                perform: (): void => resettable.softReset()
            };
        }
        else {
            return null;
        }
    }
}

export class HardResetActionFactory implements ActionFactory {

    createAction(actionContext: ActionContext): Action | null {

        const proxy = actionContext.proxy;

        if (proxy.isA(Resettable)) {

            const resettable = proxy.as(Resettable);

            return {
                name: "Hard Reset",

                isEnabled: true,

                perform: (): void => resettable.hardReset()
            };
        }
        else {
            return null;
        }
    }
}

export class StopActionFactory implements ActionFactory {

    createAction(actionContext: ActionContext): Action | null {

        const proxy = actionContext.proxy;

        if (proxy.isA(Stoppable)) {

            const stoppable = proxy.as(Stoppable);

            return {
                name: "Stop",

                isEnabled: true,

                perform: (): void => stoppable.stop()
            };
        }
        else {
            return null;
        }
    }
}

export class CutActionFactory implements ActionFactory {

    createAction(actionContext: ActionContext): DragAction | null {

        if (!actionContext.proxy.isA(ConfigPoint)) {
            return null;
        }

        const dragPoint: ConfigPoint = actionContext.proxy.as(ConfigPoint);

        class Impl implements DragAction {

            readonly name: string = "Cut";

            get isEnabled(): boolean {
                return dragPoint.isCutSupported;
            }

            perform(): void {
                dragPoint.cut()
                    .then(config => actionContext.clipboard.copy(config));
            }

            get isDraggable(): boolean {
                return dragPoint.isCutSupported;
            }

            dragData(): Promise<string> {
                return dragPoint.copy();
            }

            dragComplete(): void {
                dragPoint.delete();
            }
        }

        return new Impl();
    }
}

export class CopyActionFactory implements ActionFactory {

    createAction(actionContext: ActionContext): Action | null {

        if (!actionContext.proxy.isA(ConfigPoint)) {
            return null;
        }

        const dragPoint: ConfigPoint = actionContext.proxy.as(ConfigPoint);

        return {
            name: "Copy",

            isEnabled: true,

            perform: (): void => {
                dragPoint.copy()
                    .then(config => actionContext.clipboard.copy(config));
            }
        }
    }
}

export class PasteActionFactory implements ActionFactory {

    createAction(actionContext: ActionContext): DropAction | null {

        if (!actionContext.proxy.isA(ConfigPoint)) {
            return null;
        }

        const dragPoint: ConfigPoint = actionContext.proxy.as(ConfigPoint);

        class Impl implements DropAction {

            readonly name: string = "Paste";

            get isEnabled(): boolean {
                return dragPoint.isPasteSupported;
            }

            perform(): void {

                actionContext.clipboard.paste()
                    .then(contents => {
                        if (contents) {
                            dragPoint.paste(-1, contents);
                        }
                    });
            }

            get isDropTarget(): boolean {
                return dragPoint.isPasteSupported
            }

            drop(data: string): Promise<void> {
                return dragPoint.paste(-1, data);
            }
        }

        return new Impl();
    }
}

export class PasteBeforeActionFactory implements ActionFactory {

    createAction(actionContext: ActionContext): DropBeforeAction | null {

        if (!actionContext.parent) {
            return null;
        }

        const parentContext: ActionContext = actionContext.parent;

        if (!parentContext.proxy.isA(ConfigPoint)) {
            return null;
        }

        const parentDragPoint: ConfigPoint = parentContext.proxy.as(ConfigPoint);

        class Impl implements DropBeforeAction {

            readonly name: string = "Paste Before";

            get isEnabled(): boolean {
                return parentDragPoint.isPasteSupported;
            }

            perform(): void {

                actionContext.clipboard.paste()
                    .then(contents => {
                        if (contents) {
                            const index = parentContext.indexOf(actionContext);
                            if (index != undefined) {
                                parentDragPoint.paste(index, contents);
                            }
                        }
                    });
            }

            get isDropBeforeTarget(): boolean {
                return parentDragPoint.isPasteSupported;
            }

            dropBefore(data: string): Promise<void> {
                const index = parentContext.indexOf(actionContext);
                if (index) {
                    return parentDragPoint.paste(index, data);
                }
                else {
                    return Promise.resolve();
                }
            }
        }

        return new Impl();
    }
}

export class DeleteActionFactory implements ActionFactory {

    createAction(actionContext: ActionContext): Action | null {

        if (!actionContext.proxy.isA(ConfigPoint)) {
            return null;
        }

        const dragPoint: ConfigPoint = actionContext.proxy.as(ConfigPoint);

        class Impl implements Action {

            name: string = "Delete";

            get isEnabled(): boolean {
                return dragPoint.isCutSupported;
            }

            perform(): void {
                dragPoint.delete();
            }
        }
        return new Impl();
    }
}


/**
 * Provide all Oddjobs Actions factories.
 */
export function ojActions(): ActionFactory[] {

    return [
        new CutActionFactory(),
        new CopyActionFactory(),
        new PasteActionFactory(),
        new PasteBeforeActionFactory(),
        new DeleteActionFactory(),
        new RunActionFactory(),
        new SoftResetActionFactory(),
        new HardResetActionFactory(),
        new StopActionFactory(),
        new DesignActionFactory(),
        new AddJobActionFactory()]
}