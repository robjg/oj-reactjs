import { RemoteProxy } from '../remote/remote'

import { Clipboard } from '../clipboard';

/**
 * The context in which an ActionFactory may or may not create an Action. There is
 * an instance of this class per node in a job tree.
 */
export interface ActionContext {

    /** The parent context or null if this is the root. */
    parent: ActionContext | null;

    /** The proxy to the remote node. */
    proxy: RemoteProxy;

    /** Access to the clipboard abstraction. */
    clipboard: Clipboard;

    /** Provide the index of a child. Used for dropping config before a node. */
    indexOf(child: ActionContext): number | undefined;
}

/**
 * Creates an Action or not given then ActionContext.
 */
export interface ActionFactory {

    /**
     * Possibly creates an {@link Action} for the given context.
     * 
     * @param actionContext A context to provide information for creating the action.
     * @returns An action or null if the factory can't provide one for the given context.
     */
    createAction(actionContext: ActionContext): Action | null;
}


/**
 * An Action is something that can be performed via a menu
 */
export interface Action {

    /** The name of the action. Used as the title in menus. */
    readonly name: string;

    /** An optional group. To be used to group menu items. */
    readonly group?: string;

    /** Is the action currently enabled. */
    readonly isEnabled: boolean;

    /** Perform the action. */
    readonly perform: () => void;

}

/** 
 * Implemented by an Action for a node that can be dragged. 
 */
export interface DragAction extends Action {

    /** Is the node draggable. */
    isDraggable: boolean;

    /** Get the config for the drag node. */
    dragData(): Promise<string>;

    /** Called when the drag is complete. */
    dragComplete(): void;
}

export class DragAction {

    /** Type Guard for {@link DragAction} */
    static isDragAction(action: Action): action is DragAction {
        return typeof (action as DragAction).isDraggable === 'boolean';
    }
}

/**
 * Implementated by an Action for a node that can have config dropped on to it. 
 * This will be a Structural job such as Sequential, Parallel or Folder.
 */
export interface DropAction extends Action {

    isDropTarget: boolean;

    drop(dragData: string): Promise<void>;
}

export class DropAction {

    /** Type Guard for {@link DropAction} */
    static isDropAction(action: Action): action is DropAction {
        return typeof (action as DropAction).isDropTarget === 'boolean';
    }
}

/**
 * Implemented by an Action foor a node that can have config dropped before it. 
 * This will be a node that is the child of a Structural job such as a Folder.
 */
export interface DropBeforeAction extends Action {

    isDropBeforeTarget: boolean;

    dropBefore(dragData: string): Promise<void>;
}

export class DropBeforeAction {

    static isDropBeforeAction(action: Action): action is DropBeforeAction {
        return typeof (action as DropBeforeAction).isDropBeforeTarget === 'boolean';
    }
}


/** 
 * Collects Actions.
 */
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

/**
 * Creates an {@link ActionSet} for a given {@link ActionContext}.
 */
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





