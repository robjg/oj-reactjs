import { DesignActionFactory } from "../design/designAction";
import { ConfigurationOwner, Resettable, Runnable, Stoppable } from "../remote/ojremotes";
import { Action, ActionContext, ActionFactory, contextSearch } from "./actions";

export class RunActionFactory implements ActionFactory {

    createAction(actionContext: ActionContext): Action | null {
 
        const proxy = actionContext.proxy;

        if (proxy.isA(Runnable)) {

            const runnable = proxy.as(Runnable);

            return {
                name: "Start",

                isEnabled: true,

                perform: (): void => runnable.run()
            }
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
            }
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
            }
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
            }
        }
        else {
            return null;
        }
    }
}

export class CutActionFactory implements ActionFactory {

    createAction(actionContext: ActionContext): Action | null {
 
        const configOwner: ConfigurationOwner | null = contextSearch(actionContext, ConfigurationOwner);

        if (configOwner == null) {
            return null;
        }

        const proxy = actionContext.proxy;

        return {
            name: "Cut",

            isEnabled: true,

            perform: (): void => {
                configOwner.cut(proxy)
                .then(config => actionContext.clipboard.copy(config));
            }
        }
    }
}

export class CopyActionFactory implements ActionFactory {

    createAction(actionContext: ActionContext): Action | null {
 
        const configOwner: ConfigurationOwner | null = contextSearch(actionContext, ConfigurationOwner);

        if (configOwner == null) {
            return null;
        }

        const proxy = actionContext.proxy;

        return {
            name: "Copy",

            isEnabled: true,

            perform: (): void => {
                configOwner.copy(proxy)
                .then(config => actionContext.clipboard.copy(config));
            }
        }
    }
}

export class PasteActionFactory implements ActionFactory {

    createAction(actionContext: ActionContext): Action | null {
 
        const configOwner: ConfigurationOwner | null = contextSearch(actionContext, ConfigurationOwner);

        if (configOwner == null) {
            return null;
        }

        const proxy = actionContext.proxy;

        return {
            name: "Paste",

            isEnabled: true,

            perform: (): void => {

                actionContext.clipboard.paste()
                .then(contents => {
                    if (contents) {
                        configOwner.paste(proxy, -1, contents);
                    }
                });
            }
        }
    }
}

export class DeleteActionFactory implements ActionFactory {

    createAction(actionContext: ActionContext): Action | null {
 
        const configOwner: ConfigurationOwner | null = contextSearch(actionContext, ConfigurationOwner);

        if (configOwner == null) {
            return null;
        }

        const proxy = actionContext.proxy;

        return {
            name: "Delete",

            isEnabled: true,

            perform: (): void => {
                configOwner.delete(proxy);
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
        new DesignActionFactory()]
}