import { TreeModel } from "./ojTreeModel";
import { PollController } from "./PollController";

/**
 *
 */
export interface TreeController {

    expandNode(nodeId: number): void;

    collapseNode(nodeId: number): void;

    isSelectEnabled(): boolean;

    select(nodeId: number): void;
}

export class OjTreeController implements TreeController {

    private selectEnabled: boolean = true;

    constructor(private ojTreeModel: TreeModel,
            private ojPollController: PollController = {

                stopRefresh: function() {
                    return function() {};
                }
            }) {
    }

    expandNode(nodeId: number): void {

        var resume = this.ojPollController.stopRefresh();

        this.ojTreeModel.poll();

        this.ojTreeModel.expandNode(nodeId);

        resume();
    }

    collapseNode(nodeId: number): void {

        var resume = this.ojPollController.stopRefresh();

        this.ojTreeModel.collapseNode(nodeId);

        this.ojTreeModel.poll();

        resume();
    }

    isSelectEnabled(): boolean {
        return this.selectEnabled;
    }

    select(nodeId: number): void {

        var resume = this.ojPollController.stopRefresh();

        this.ojTreeModel.poll();

        this.ojTreeModel.select(nodeId);

        resume();
    }
}
