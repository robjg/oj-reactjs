import { RemoteProxy } from '../remote/remote'

import { Clipboard } from '../clipboard';

/**
 * The context in which an ActionFactory may or may not create an Action.
 */
export interface ActionContext {

    parent: ActionContext | null;

    proxy: RemoteProxy;

    clipboard: Clipboard;

    indexOf(child: ActionContext): number | undefined;
}

/**
 * Creates an Action or not given then ActionContext.
 */
export type ActionFactory = {

    createAction(actionContext: ActionContext): Action | null;
}


/**
 * An Action is something that can be performed via a menu
 */
export interface Action {

    name: string;

    isEnabled: boolean;

    perform: () => void;

}

export interface DragAction extends Action {

    isDraggable: boolean;

    dragData(): Promise<string>;

    dragComplete(): void;
}

export class DragAction {

    static isDragAction(action: Action): action is DragAction {
        return typeof (action as DragAction).isDraggable === 'boolean';
    }
}

export interface DropAction extends Action {

    isDropTarget: boolean;

    drop(dragData: string): Promise<void>;
}

export class DropAction {

    static isDropAction(action: Action): action is DropAction {
        return typeof (action as DropAction).isDropTarget === 'boolean';
    }
}

export interface DropBeforeAction extends Action {

    isDropBeforeTarget: boolean;

    dropBefore(dragData: string): Promise<void>;
}

export class DropBeforeAction {

    static isDropBeforeAction(action: Action): action is DropBeforeAction {
        return typeof (action as DropBeforeAction).isDropBeforeTarget === 'boolean';
    }
}


export interface ActionSet {

    readonly actions: Action[];

    readonly isDraggable: boolean;

    readonly isDropTarget: boolean;

    readonly isDropBeforeTarget: boolean;

    dragData(): Promise<string>;

    drop(dragData: string): Promise<void>;

    dropBefore(dragData: string): Promise<void>

    dragComplete(): void;
}

export class ActionFactories {

    constructor(private readonly actionFactories: ActionFactory[]) { }

    actionsFor(context: ActionContext): ActionSet {

        const actions: (Action | null)[] = this.actionFactories.map(f => f.createAction(context));

        const validActions: Action[] = actions.filter(action => action != null)
            .map(action_1 => action_1 as Action);

        var dragAction: DragAction | null = null;

        var dropAction: DropAction | null = null;

        var dropBeforeAction: DropBeforeAction | null = null;

        validActions.forEach(a => {
            if (DragAction.isDragAction(a)) {
                dragAction = a;
            }
            if (DropAction.isDropAction(a)) {
                dropAction = a;
            }
            if (DropBeforeAction.isDropBeforeAction(a)) {
                dropBeforeAction = a;
            }
        });

        return new ActionSetImpl(validActions, dragAction, dropAction, dropBeforeAction);
    }
}

class ActionSetImpl implements ActionSet {

    constructor(readonly actions: Action[],
        private readonly dragAction: DragAction | null,
        private readonly dropAction: DropAction | null,
        private readonly dropBeforeAction: DropBeforeAction | null) {

        this.dragData = this.dragData.bind(this);
        this.drop = this.drop.bind(this);
        this.dragComplete = this.dragComplete.bind(this);
    }

    get isDraggable(): boolean {
        return this.dragAction?.isDraggable || false;
    }

    get isDropTarget(): boolean {
        return this.dropAction?.isDropTarget || false;
    }

    get isDropBeforeTarget() : boolean {
        return this.dropBeforeAction?.isDropBeforeTarget || false;
    }

    dragData(): Promise<string> {
        if (this.dragAction) {
            return this.dragAction.dragData();
        }
        else {
            throw new Error("Not Draggable");
        }
    }

    drop(dragData: string): Promise<void> {
        if (this.dropAction) {
            return this.dropAction.drop(dragData);
        }
        else {
            throw new Error("Not Droppable");
        }
    }

    dropBefore(dragData: string): Promise<void> {
        if (this.dropBeforeAction) {
            return this.dropBeforeAction.dropBefore(dragData);
        }
        else {
            throw new Error("Not Droppable");
        }
    }

    dragComplete(): void {
        if (this.dragAction) {
            this.dragAction.dragComplete();
        }
        else {
            throw new Error("Not Draggable");
        }
    }
}

/**
 * Searches the hierarchical ActionContexts for a object of a Type.
 * 
 * @param context The Context
 * @param cntor The type as defined by its constructor.
 * @returns The thing we're searching for or null.
 */
export function contextSearch<T>(context: ActionContext | null, cntor: ({ new(...args: any[]): T })): T | null {
    if (context == null) {
        return null;
    }
    if (context.proxy.isA(cntor)) {
        return context.proxy.as(cntor);
    }
    return contextSearch(context.parent, cntor);
}





