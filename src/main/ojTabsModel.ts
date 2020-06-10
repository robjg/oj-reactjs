
export interface TabSelectionEvent {
    newTab: string;
    oldTab: string;
}

export interface TabSelectionListener {

    tabChanged: (event: TabSelectionEvent) => void;
}

export interface TabsModel {

    addTabSelectionListener(listener: TabSelectionListener): void;

    tabSelected: (tab: string) => void;
}

export class OjTabsModel implements TabsModel {

    private currentTab: string;

    tabSelectionListeners: TabSelectionListener[] = [];

    constructor(selectedTab: string) {
        this.currentTab = selectedTab;
    }

    addTabSelectionListener(listener: TabSelectionListener): void {
			this.tabSelectionListeners.push(listener);
    }
	
    tabSelected = (tab: string): void => {
			
        let event: TabSelectionEvent = {
                newTab: tab,
                oldTab: this.currentTab
        };

        for (var i = 0; i < this.tabSelectionListeners.length; ++i) {
            var callback = this.tabSelectionListeners[i].tabChanged;
            if (callback !== undefined) {
                callback(event);
            }
        }

        this.currentTab = tab;
    };
}