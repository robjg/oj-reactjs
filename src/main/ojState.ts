import { StateDao, StateData } from "./ojDao";
import { TabSelectionListener, TabSelectionEvent } from "./ojTabsModel";
import { TreeSelectionListener, TreeSelectionEvent } from "./ojTreeModel";


interface StateTabOptions {
    tabName?: string;
    divId?: string;
    selected?: boolean;
}

export class OjState implements TabSelectionListener, TreeSelectionListener {

    private tabName: string;

    private tabSelected?: string;

    private selector: string;

    private selectedNodeId?: number;

    constructor(private ojStateDao: StateDao, private options: StateTabOptions = {}) {

        if (options.tabName) {
            this.tabName = options.tabName;
        }
        else {
            this.tabName = "state";
        }

        let divId: string;
        if (options.divId) {
            divId = options.divId;
        }
        else {
            divId = "oj-detail-tabs";
        }

        if (options.selected) {
            this.tabSelected = this.tabName;
        }

        this.selector = '#' + divId + " ." + this.tabName + "-content";

    }

	private setStateInTable(state: StateData) {
		
		var container$ = $(this.selector);

        container$.find(".state-state-cell").text(state.state);
        container$.find(".state-time-cell").text(new Date(state.time).toLocaleString());
        container$.find(".state-exception-cell").text(state.exception);
	}
	
	private removeAll() {
		
		var container$ = $(this.selector);

        container$.find(".state-state-cell").empty();
        container$.find(".state-time-cell").empty();
        container$.find(".state-exception-cell").empty();
	}
	
	stateCallback = (data: StateData): void => {
		
		if (data.nodeId !== this.selectedNodeId) {
			return;
		}
		
		this.setStateInTable(data);
	};
	
	private fetchState() {
		
		if (this.tabSelected !== this.tabName) {
			return;
		}
		
		if (this.selectedNodeId === undefined) {
			return;
		}
		
		this.ojStateDao.fetchState(this.selectedNodeId, this.stateCallback);
	}
	
    selectionChanged = (event: TreeSelectionEvent): void => {
			this.removeAll();
			this.selectedNodeId = event.toNodeId;
			this.fetchState();
    };
	
    tabChanged = (event: TabSelectionEvent): void => {
			this.tabSelected = event.newTab;
			this.fetchState();
    };
		
    poll() {
        this.fetchState();
    }
}