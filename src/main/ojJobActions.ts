import { ActionStatus, ActionDao, ActionData, DialogData } from "./ojDao";
import { Form } from "./ojForm";
import { TreeSelectionListener, TreeSelectionEvent } from "./ojTreeModel";

interface ActionListener {

    actionPerformed(status: ActionStatus): void;
}

/**
 * Create action buttons.
 *
 * @param ojActionsDao
 * @param ojForm
 * @param divId
 * @returns {{selectionChanged: selectionChanged}} A selection listener.
 */
export class OjJobActions implements TreeSelectionListener {

    private actionListeners: ActionListener[] = [];

    constructor(private ojActionsDao: ActionDao,
                private ojForm: Form,
                private divId = 'ojJobActions') {

    }

    private statusCallback = (data: ActionStatus): void => {

        for (var i = 0; i < this.actionListeners.length; ++i) {
            this.actionListeners[i].actionPerformed(data);
        }
    }

	private htmlForAction(nodeId: number, action: ActionData) {

        var clickFunction;

        if (action.actionType === 'FORM') {
            clickFunction = () => {
                this.actionDialog(nodeId, action.name);
            }
        }
        else {
            clickFunction = () => {
                return this.ojActionsDao.executeAction(
                    nodeId, action.name, this.statusCallback);
            }
        }

		return $('<button>').attr(
				{ class: action.name +'_action' }
			).click(clickFunction
			).append(action.displayName);
	}	
	
	private createActionButtons(nodeId: number, actionList: ActionData[]) {
		
		var actionsDiv$ = $('#' + this.divId);
		
		for (var i = 0; i < actionList.length; ++i) {
			actionsDiv$.append(this.htmlForAction(nodeId, actionList[i]));
		}
	}
	
	private removeActionButtons() {
		
		$('#' + this.divId).empty();
	}

	private actionsChanged(event: { nodeId: number, actionList: ActionData[] }) {

		var actionList = event.actionList;
		var nodeId = event.nodeId;
		
		if (actionList !== undefined) {
			this.createActionButtons(nodeId, actionList);
		}
	}
	
	private actionsCallback(nodeId: number): (data: ActionData[]) => void {
		
		return (data: ActionData[]):void => {
			this.actionsChanged({
				nodeId: nodeId,
				actionList: data });
		};
	}

    private actionDialog(nodeId: number, actionName: string) {

        var submitForm = (form$: JQuery) => {
            this.ojActionsDao.formAction(nodeId, actionName, form$, this.statusCallback);
        };

        this.ojActionsDao.dialogFor(nodeId, actionName, (data: DialogData) => {

            this.ojForm.doForm(data, submitForm);
        });
    }

    selectionChanged = (event: TreeSelectionEvent): void => {
			
        var to = event.toNodeId;

        this.removeActionButtons();

        if (to !== undefined) {
            this.ojActionsDao.actionsFor(to, this.actionsCallback(to));
        }
	};

    addActionListener = (listener: ActionListener): void => {
        this.actionListeners.push(listener);
    }
}