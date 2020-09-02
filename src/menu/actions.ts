import { ConfigurationOwner} from '../remote/remote'

import { RemoteProxy } from '../remote/remote'

export type ActionContext = {

    configurationOwner?: ConfigurationOwner;

    proxy: RemoteProxy;
}

export type ActionFactory = {

    createAction(actionContext: ActionContext) : Action;
}



export interface Action {

    name: string;

    isEnabled: boolean;

    action: () => void;    

}


class DesignAction {


}

export interface AvailableActions {

    actionsFor(nodeId: number): Action[]; 
}

export const availalableActionFactories: ActionFactory[] = [];


