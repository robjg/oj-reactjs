import { AddJobActionFactory, DesignActionFactory } from "../design/designAction";
import { ConfigurationOwner, ConfigPoint, Resettable, Runnable, Stoppable } from "../remote/ojremotes";
import { Action, ActionContext, ActionFactory, contextSearch } from "./actions";

export class RunActionFactory implements ActionFactory {

    createAction(actionContext: ActionContext): Promise<Action | null> {

        const proxy = actionContext.proxy;

        if (proxy.isA(Runnable)) {

            const runnable = proxy.as(Runnable);

            return Promise.resolve({
                name: "Start",

                isEnabled: true,

                perform: (): void => runnable.run()
            });
        }
        else {
            return Promise.resolve(null);
        }
    }
}

export class SoftResetActionFactory implements ActionFactory {

    createAction(actionContext: ActionContext): Promise<Action | null> {

        const proxy = actionContext.proxy;

        if (proxy.isA(Resettable)) {

            const resettable = proxy.as(Resettable);

            return Promise.resolve({
                name: "Soft Reset",

                isEnabled: true,

                perform: (): void => resettable.softReset()
            });
        }
        else {
            return Promise.resolve(null);
        }
    }
}

export class HardResetActionFactory implements ActionFactory {

    createAction(actionContext: ActionContext): Promise<Action | null> {

        const proxy = actionContext.proxy;

        if (proxy.isA(Resettable)) {

            const resettable = proxy.as(Resettable);

            return Promise.resolve({
                name: "Hard Reset",

                isEnabled: true,

                perform: (): void => resettable.hardReset()
            });
        }
        else {
            return Promise.resolve(null);
        }
    }
}

export class StopActionFactory implements ActionFactory {

    createAction(actionContext: ActionContext): Promise<Action | null> {

        const proxy = actionContext.proxy;

        if (proxy.isA(Stoppable)) {

            const stoppable = proxy.as(Stoppable);

            return Promise.resolve({
                name: "Stop",

                isEnabled: true,

                perform: (): void => stoppable.stop()
            });
        }
        else {
            return Promise.resolve(null);
        }
    }
}

export class CutActionFactory implements ActionFactory {

    async createAction(actionContext: ActionContext): Promise<Action | null> {

        if (!actionContext.proxy.isA(ConfigPoint)) {
            return Promise.resolve(null);            
        }

        const dragPoint: ConfigPoint = actionContext.proxy.as(ConfigPoint);

        return {
            name: "Cut",

            isEnabled: dragPoint.isCutSupported,

            perform: (): void => {
                dragPoint.cut()
                    .then(config => actionContext.clipboard.copy(config));
            }
        };
    }
}

export class CopyActionFactory implements ActionFactory {

    async createAction(actionContext: ActionContext): Promise<Action | null> {

        if (!actionContext.proxy.isA(ConfigPoint)) {
            return Promise.resolve(null);            
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

    async createAction(actionContext: ActionContext): Promise<Action | null> {

        if (!actionContext.proxy.isA(ConfigPoint)) {
            return Promise.resolve(null);            
        }

        const dragPoint: ConfigPoint = actionContext.proxy.as(ConfigPoint);

        return {
            name: "Paste",

            isEnabled: dragPoint.isPasteSupported,

            perform: (): void => {

                actionContext.clipboard.paste()
                    .then(contents => {
                        if (contents) {
                            dragPoint.paste(-1, contents);
                        }
                    });
            }
        }
    }
}

export class DeleteActionFactory implements ActionFactory {

    async createAction(actionContext: ActionContext): Promise<Action | null> {

        if (!actionContext.proxy.isA(ConfigPoint)) {
            return Promise.resolve(null);            
        }

        const dragPoint: ConfigPoint = actionContext.proxy.as(ConfigPoint);

        return {
            name: "Delete",

            isEnabled: dragPoint.isCutSupported,

            perform: (): void => {
                dragPoint.delete();
            }
        }
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
        new DeleteActionFactory(),
        new RunActionFactory(),
        new SoftResetActionFactory(),
        new HardResetActionFactory(),
        new StopActionFactory(),
        new DesignActionFactory(),
        new AddJobActionFactory()]
}