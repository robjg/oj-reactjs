

export enum SelectedState {
    NONE,
    SELECTED,
    MENU,
    DRAG_PENDING,
    DRAGGABLE
}

export interface NodeState {

    readonly isDraggable: boolean;

    readonly dragData: string;

    readonly selectedState: SelectedState;

    enquireDrag(dragDataFn: () => Promise<string>): void;

    // passed as function so make it a property
    toggleSelect: () => void;

    unselect(): void;

    // Should only be called from the selection listener
    select(): void;

    menuOn(): void;

    menuOff(): void;
}

export type NodeStateCallbacks = {

    stateCallback: (nodeState: NodeState) => void;

    selectCallback: () => void;

    unselectCallback:() => void;
}


abstract class BaseNodeState implements NodeState {

    abstract selectedState: SelectedState;

    isDraggable: boolean = false;

    constructor(protected readonly callbacks: NodeStateCallbacks) {}

    get dragData(): string {
        throw new Error("Illegal State");
    }

    enquireDrag(dragDataFn: () => Promise<string>): void {
        throw new Error("Can only Drag from an unselected state");
    }

    abstract toggleSelect: () => void;

    abstract unselect(): void;

    abstract select(): void;

    menuOn(): void {
        throw new Error("Can only Selected State should turn menu on");

    }

    menuOff(): void {
        throw new Error("Can only Menu State should turn menu off");
    }
}

export class InitialNodeState extends BaseNodeState {

    private timeout: any;

    selectedState: SelectedState = SelectedState.NONE;

    enquireDrag(dragDataFn: () => Promise<string>): void {

        const self: InitialNodeState = this;

        this.timeout = setTimeout(function() {
            self.callbacks.stateCallback(new DragPending(self.callbacks))
            dragDataFn().then(data => {
                self.callbacks.stateCallback(new DraggableNodeState(self.callbacks, data))
                })
            }, 500);    
    }

    toggleSelect = () => {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
        this.callbacks.selectCallback();
    }

    unselect(): void {
        // nothing to do.        
    }

    select(): void {
        this.callbacks.stateCallback(new SelectedNodeState(this.callbacks))
    }
}

class DragPending extends BaseNodeState {

    selectedState: SelectedState = SelectedState.DRAG_PENDING;

    enquireDrag(dragDataFn: () => Promise<string>): void {
            // Ignore any new enquiry
    }

    toggleSelect = () => {
        this.callbacks.selectCallback();
    }

    unselect(): void {
        // wait for
    }

    select(): void {
        this.callbacks.stateCallback(new SelectedNodeState(this.callbacks));
    }
}

class DraggableNodeState extends BaseNodeState {

    private first: boolean = true;

    constructor(callbacks: NodeStateCallbacks,
            private readonly dragData_: string) {
        super(callbacks)
    }

    selectedState: SelectedState = SelectedState.DRAGGABLE;

    isDraggable: boolean = true;

    get dragData(): string {
        return this.dragData_;
    }

    enquireDrag(dragDataFn: () => Promise<string>): void {
        // we are already draggable
    }

    toggleSelect = () => {
        if (this.first) {
            this.callbacks.selectCallback();
            this.first = false;    
        }
        else {
            this.callbacks.unselectCallback();
        }
    }

    unselect(): void {
            this.callbacks.stateCallback(new InitialNodeState(this.callbacks))
    }

    select(): void {
        // ignore callback from toggle select
    }

    menuOn(): void {
        this.callbacks.stateCallback(new MenuNodeState(this.callbacks));
    }
}

class SelectedNodeState extends BaseNodeState {

    private timeout: any;

    selectedState: SelectedState = SelectedState.SELECTED;

    enquireDrag(dragDataFn: () => Promise<string>): void {

        const self: SelectedNodeState = this;

        this.timeout = setTimeout(function() {
            self.callbacks.stateCallback(new DragPending(self.callbacks))
            dragDataFn().then(data => {
                self.callbacks.stateCallback(new DraggableNodeState(self.callbacks, data))
                })
            }, 500);    
    }

    toggleSelect = () => {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
        this.callbacks.unselectCallback();
    }

    unselect(): void {
        this.callbacks.stateCallback(new InitialNodeState(this.callbacks))
    }

    select(): void {

    }

    menuOn(): void {
        this.callbacks.stateCallback(new MenuNodeState(this.callbacks));
    }
}

class MenuNodeState extends BaseNodeState {

    selectedState: SelectedState = SelectedState.MENU;

    toggleSelect = () => {
        this.callbacks.unselectCallback();
    }

    unselect(): void {
        this.callbacks.stateCallback(new InitialNodeState(this.callbacks))
    }

    select(): void {
        this.callbacks.stateCallback(new SelectedNodeState(this.callbacks));
    }

    menuOff(): void {
        this.callbacks.stateCallback(new InitialNodeState(this.callbacks));
    }
}