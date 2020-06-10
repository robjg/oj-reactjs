
export interface AjaxCallback {
    (data: any, textStatus?: string, jqXHR?: JQueryXHR) : any;
}

export interface NodeInfo {
    nodeId: number;
    name: string;
    icon: string;
    children: number[];
}

export interface MakeNodeInfoRequestData {
    nodeInfo: NodeInfo[];
    eventSeq: number;
}

export interface IconProvider {

    iconSrcUrl(icon: string): string;
}

export interface TreeDao extends IconProvider {

    makeNodeInfoRequest(nodeIds: string,
                        ajaxCallback: (data: MakeNodeInfoRequestData, textStatus?: string, jqXHR?: JQueryXHR) => void,
                        eventSeq: number): void;
}

export interface ActionData {

    actionType: string;
    name: string;
    displayName: string;
}

export interface DialogFieldData {
    fieldType: string;
    label: string;
    name: string;
    value: string;
}

export interface DialogData {
    dialogType: string;
    fields: DialogFieldData[];
}

export interface ActionStatus {
    status: string;
    message: string;
}

export interface ActionDao {

    actionsFor(nodeId: number,
               ajaxCallback: (data: ActionData[], textStatus?: string, jqXHR?: JQueryXHR) => any
    ): JQueryXHR;

    dialogFor(nodeId: number,
              actionName:string,
              ajaxCallback: (data: DialogData, textStatus?: string, jqXHR?: JQueryXHR) => any
    ): JQueryXHR;

    executeAction(nodeId: number,
                  actionName:string,
                  statusCallback: (data: ActionStatus, textStatus?: string, jqXHR?: JQueryXHR) => any
    ): JQueryXHR;

    formAction(nodeId: number,
               actionName:string,
               form$: JQuery,
               statusCallback: (data: ActionStatus, textStatus?: string, jqXHR?: JQueryXHR) => any
    ): JQueryXHR;
}

export interface StateData {
    nodeId: number;
    state: string;
    time: number;
    exception: string;
}

export interface StateDao {

    fetchState(nodeId: number,
               ajaxCallback: (data: StateData, textStatus?: string, jqXHR?: JQueryXHR) => void): void;
}

export interface LogLine {
    logSeq: number;
    level: string;
    message: string;
}

export interface LinesData {

    nodeId: number;
    logLines: LogLine[];

}

export interface ConsoleDao {

    fetchConsoleLines(nodeId: number,
                      logSeq: number,
                      ajaxCallback: (data: LinesData, textStatus?: string, jqXHR?: JQueryXHR) => void): void;
}

export interface LoggerDao {

    fetchLogLines(nodeId: number,
                  logSeq: number,
                  ajaxCallback: (data: LinesData, textStatus?: string, jqXHR?: JQueryXHR) => void): void;
}

export interface PropertiesData {

    nodeId: number;
    properties: { [key: string]: string };
}

export interface PropertiesDao {
    fetchProperties(nodeId: number,
                    ajaxCallback: (data: PropertiesData, textStatus?: string, jqXHR?: JQueryXHR) => void): void;
}

export class OjDaoImpl implements TreeDao, ActionDao, StateDao, ConsoleDao, LoggerDao, PropertiesDao {

    constructor( readonly path: string = 'api') {
    }

    // Tree

    makeNodeInfoRequest(nodeIds: string, ajaxCallback: AjaxCallback, eventSeq: number): void {

        $.get(this.path + '/nodeInfo', 'nodeIds=' + nodeIds + '&eventSeq=' + eventSeq,
            ajaxCallback);
    }

    iconSrcUrl(icon: string): string {
        return this.path + '/icon/' + icon;
    }

    // Actions

    actionsFor(nodeId: number, ajaxCallback: JQuery.jqXHR.DoneCallback): JQueryXHR {

        return $.get(this.path + '/actionsFor/' + nodeId,
            ajaxCallback);
    }

    dialogFor(nodeId: number, actionName: string, ajaxCallback: JQuery.jqXHR.DoneCallback): JQueryXHR {
        return $.get(this.path + '/dialogFor/' +  nodeId +  '/' + actionName, ajaxCallback);
    }

    executeAction(nodeId: number, actionName: string,
                  statusCallback: (data: ActionStatus, textStatus?: string, jqXHR?: JQueryXHR) => any
    ): JQueryXHR {

        return $.get(this.path + '/action/' +  nodeId +  '/' + actionName, statusCallback);
    }

    formAction(nodeId: number, actionName: string,
               form$: JQuery,
               statusCallback: (data: ActionStatus, textStatus?: string, jqXHR?: JQueryXHR) => any
    ): JQueryXHR {

        var url = this.path + '/formAction/' +  nodeId +  '/' + actionName;

        var formData = new FormData(<HTMLFormElement> form$[0]);

        return $.ajax({
            type: "POST",
            url: url,
            data: formData,
            processData: false,
            contentType: false,
            success: statusCallback
        });
    }

    // State

    fetchState(nodeId: number, ajaxCallback: AjaxCallback): void {

        $.get(this.path + '/state/' + nodeId,
            ajaxCallback);
    }

    // Console

    fetchConsoleLines(nodeId: number, logSeq: number, ajaxCallback: AjaxCallback): void {

        $.get(this.path + '/consoleLines/' + nodeId, 'logSeq=' + logSeq,
            ajaxCallback);
    }

    // Logger

    fetchLogLines(nodeId: number, logSeq: number, ajaxCallback: AjaxCallback) {

        $.get(this.path + '/logLines/' + nodeId, 'logSeq=' + logSeq,
            ajaxCallback);
    }

    fetchProperties(nodeId: number, ajaxCallback: AjaxCallback): void {

        $.get(this.path + '/properties/' + nodeId,
            ajaxCallback);
    }
}