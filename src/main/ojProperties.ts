import { PropertiesDao, PropertiesData } from "./ojDao";
import { TabSelectionListener, TabSelectionEvent } from "./ojTabsModel";
import { TreeSelectionListener, TreeSelectionEvent } from "./ojTreeModel";

export class OjProperties implements TabSelectionListener, TreeSelectionListener {

    private selector: string;

    private tabSelected?: string;

    private selectedNodeId?: number;

    constructor(private ojPropertiesDao: PropertiesDao,
                private tabName: string = "properties",
                private divId: string = "oj-detail-tabs") {

        this.selector = '#' + divId + " ." + tabName + "-content";
    }

	private setPropertiesInTable(properties: { [key: string]: string }) {
		
		var container$ = $(this.selector);

        for (var property in properties) {
            if (properties.hasOwnProperty(property)) {
                container$.append("<tr><td>" + property + 
                    "</td><td>" + properties[property] + "</td></tr>");
            }
        }
	}
	
	private removeAll() {
		
		var container$ = $(this.selector);

        container$.empty();
	}
	
	private propertiesCallback = (data: PropertiesData) => {
		
		if (data.nodeId !== this.selectedNodeId) {
			return;
		}
		
		this.setPropertiesInTable(data.properties);
	};
	
	private fetchProperties() {
		
		if (this.tabSelected !== this.tabName) {
			return;
		}
		
		if (this.selectedNodeId === undefined) {
			return;
		}
		
		this.ojPropertiesDao.fetchProperties(this.selectedNodeId, this.propertiesCallback);
	}
	
    selectionChanged = (event: TreeSelectionEvent): void => {
			this.removeAll();
			this.selectedNodeId = event.toNodeId;
			this.fetchProperties();
    };
	
    tabChanged = (event: TabSelectionEvent): void => {
        this.tabSelected = event.newTab;
        this.fetchProperties();
    };

    poll() {
        this.fetchProperties();
    }
}