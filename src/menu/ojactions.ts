import { DesignActionFactory } from "../design/designAction";
import { Resettable, Runnable, Stoppable } from "../remote/ojremotes";
import { Action, ActionContext, ActionFactory } from "./actions";

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

export function ojActions() {

    return [new RunActionFactory(),
        new SoftResetActionFactory(), 
        new HardResetActionFactory(), 
        new StopActionFactory(),
        new DesignActionFactory()]
}