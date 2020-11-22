import { DesignActionFactory } from "../design/designAction";
import { OjJobActions } from "../main/ojJobActions";
import { Runnable } from "../remote/ojremotes";
import { Action, ActionContext, ActionFactory } from "./actions";

export class RunnableActionFactory implements ActionFactory {

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

export function ojActions() {

    return [new RunnableActionFactory(), 
        new DesignActionFactory()]
}