import { LoggerDao, LogLine, LinesData } from "./ojDao";
import { TreeSelectionListener, TreeSelectionEvent } from "./ojTreeModel";
import { TabSelectionListener, TabSelectionEvent } from "./ojTabsModel";

export class OjLogger implements TabSelectionListener, TreeSelectionListener {

    private selector: string;

    private tabSelected?: string;

    private selectedNodeId?: number;

    private lastLogSeq = -1;

    constructor(private ojLoggerDao: LoggerDao,
                private tabName: string = 'log',
                private divId: string = 'oj-detail-tabs') {

        this.selector = '#' + divId + " ." + tabName + "-content"
    }


	private addLogLines(lines: LogLine[]) {
		
		var container$ = $(this.selector);
		
		for (var i = 0; i < lines.length; ++i) {
			container$.append(lines[i].message);
			this.lastLogSeq = lines[i].logSeq
		}

        var height = container$[0].scrollHeight;
        container$.scrollTop(height);
	}
	
	private removeAll() {
		
		var container$ = $(this.selector);
		
		container$.empty();
	}
	
	private logLinesCallback = (data : LinesData) => {
		
		if (data.nodeId !== this.selectedNodeId) {
			return;
		}
		
		var lines = data.logLines;
		
		this.addLogLines(lines);
	};
	
	private fetchLogLines() {
		
		if (this.tabSelected !== this.tabName) {
			return;
		}
		
		if (this.selectedNodeId === undefined) {
			return;
		}
		
		this.ojLoggerDao.fetchLogLines(this.selectedNodeId, this.lastLogSeq, this.logLinesCallback);
	}
	
    selectionChanged = (event: TreeSelectionEvent): void => {
        this.removeAll();
        this.selectedNodeId = event.toNodeId;
        this.lastLogSeq = -1;
        this.fetchLogLines();
    };

    tabChanged = (event: TabSelectionEvent): void => {
        this.tabSelected = event.newTab;
        this.fetchLogLines();
    };

    poll() {
        this.fetchLogLines();
    }

}