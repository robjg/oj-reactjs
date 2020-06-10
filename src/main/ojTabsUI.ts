import { TabsModel, TabSelectionEvent } from "./ojTabsModel";

export class OjDetailTabsUI {

	constructor(selectable: TabsModel,private tabsId: string = 'oj-detail-tabs') {

        $(this.tabLinkSelector("state")).click(function() {
            selectable.tabSelected("state");
        });
        $(this.tabLinkSelector("console")).click(function() {
            selectable.tabSelected("console");
        });
        $(this.tabLinkSelector("log")).click(function() {
            selectable.tabSelected("log");
        });
        $(this.tabLinkSelector("properties")).click(function() {
            selectable.tabSelected("properties");
        });

    }

	private tabLinkSelector(tab: string): string {
		return('#' + this.tabsId + " ." + tab + " a");
	}
	
	private tabSelector(tab: string): string {
		return('#' + this.tabsId + " ." + tab);
	}
	
	private changeUITab = (oldTab: string, newTab: string): void => {
		if (oldTab !== undefined) {
			$(this.tabSelector(oldTab)).attr(
					{ class: oldTab + ' notSelected'
					});
		}
		
		if (newTab !== undefined) {
			$(this.tabSelector(newTab)).attr(
					{ class: newTab + ' selected'
					});
		}
	}

    tabChanged = (event: TabSelectionEvent): void => {
        this.changeUITab(event.oldTab, event.newTab);
    }
}
