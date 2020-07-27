/**
 *
 */

import { OjDaoImpl } from "./ojDao";
import { OjForm } from "./ojForm";
import { OjJobActions } from "./ojJobActions";
import { OjLogger } from "./ojLogger";
import { OjProperties } from "./ojProperties";
import { OjState } from "./ojState";
import { TreeModel, OjTreeModel } from "./ojTreeModel";
import { TreeController, OjTreeController } from "./ojTreeController";
import { OjTabsModel } from "./ojTabsModel";
import { OjTreeUI, ContextMenuProvider } from "./ojTreeUI";
import { RefreshModel, OjRefreshModel, OjRefreshUI } from "./refresh";
import { Pollable, PollController, PollResume } from "./PollController";
import { OjDetailTabsUI } from "./ojTabsUI";

export class OjMain {

	private initialised: boolean = false;
	
	private intervalRef?: NodeJS.Timeout;
	
	private refreshModel: RefreshModel;

    private ojTreeModel: TreeModel;

    private ojLog: Pollable;

    private ojConsole: Pollable;

    private pollController: PollController = {

        stopRefresh: (): PollResume => {

            if (this.intervalRef !== undefined) {
                clearInterval(this.intervalRef);
                this.intervalRef = undefined;

                return (): void => {

                    this.start();
                }
            }
            else {
                return function() {

                }
            }
        }
    };

    constructor(options?: { 
            idPrefix?: string;
            contextMenuProvider?: ContextMenuProvider
    }) {

        let ojDao = new OjDaoImpl();

        this.ojTreeModel = new OjTreeModel(ojDao);

        let ojTreeController: TreeController = new OjTreeController(this.ojTreeModel, this.pollController);

        let ojTreeUI = new OjTreeUI(ojTreeController, ojDao, options);

        this.ojTreeModel.addTreeChangeListener(ojTreeUI);
        this.ojTreeModel.addSelectionListener(ojTreeUI);

        let ojForm = new OjForm();

        let ojActions = new OjJobActions(ojDao, ojForm);
        this.ojTreeModel.addSelectionListener(ojActions);

        let tabsModel = new OjTabsModel("state");
        let tabsUI = new OjDetailTabsUI(tabsModel);
        tabsModel.addTabSelectionListener(tabsUI);

        let ojState = new OjState(ojDao, { selected: true });

        tabsModel.addTabSelectionListener(ojState);
        this.ojTreeModel.addSelectionListener(ojState);

        let ojConsole = new OjLogger({
            fetchLogLines: function(nodeId, logSeq, ajaxCallback) {
                ojDao.fetchConsoleLines(nodeId, logSeq, ajaxCallback);
            }
        }, 'console');

        tabsModel.addTabSelectionListener(ojConsole);
        this.ojTreeModel.addSelectionListener(ojConsole);

        this.ojConsole = ojConsole;

        let ojLog = new OjLogger(ojDao);

        tabsModel.addTabSelectionListener(ojLog);
        this.ojTreeModel.addSelectionListener(ojLog);

        this.ojLog = ojLog;

        let ojProperties = new OjProperties(ojDao);

        tabsModel.addTabSelectionListener(ojProperties);
        this.ojTreeModel.addSelectionListener(ojProperties);

        this.refreshModel = new OjRefreshModel();
        let refreshUI: OjRefreshUI = new OjRefreshUI(this.refreshModel);
        this.refreshModel.addRefreshListener(refreshUI);
        this.refreshModel.addRefreshListener(
            { refreshChanged: (e) => this.start() });

        ojActions.addActionListener(
            { actionPerformed: (e) => {
                this.refreshModel.reset();
                this.doRestart()
            }
        });
    }

    private doPoll() {

        this.ojTreeModel.poll();
        this.ojLog.poll();
        this.ojConsole.poll();
    }

    private doRestart = (): void => {
        this.pollController.stopRefresh();

        let interval = this.refreshModel.getNextInterval();
        if (interval > 0) {
            this.intervalRef = setInterval(this.poll, interval * 1000);
        }
    };

    public start = () => {
        if (!this.initialised) {
            this.ojTreeModel.init();
            this.initialised = true;
        }
        this.doRestart();
    };

    public stop = () => {
        this.pollController.stopRefresh();
    };

    public poll = () => {
        if (!this.initialised) {
            throw "ojMain not initialised.";
        }

        var resume = this.pollController.stopRefresh();

        this.doPoll();

        resume();
    }

}
