import { NodeInfo, TreeDao, MakeNodeInfoRequestData } from "./ojDao";

/**
 * Define callbacks for when a tree is changed.
 */
export interface TreeChangeListener {

	treeInitialised(event: { rootNode: NodeInfo }): void;

	nodeInserted(event: { parentId: number, index: number, node: NodeInfo }): void;

	nodeRemoved(event: { nodeId: number }): void;

    /**
     * Called when user expands node.
     *
     * @param event
     */
	nodeExpanded(event: { parentId: number, nodeList: NodeInfo[] }): void;

    /**
     * Called when user collapses node
     *
     * @param event
     */
	nodeCollapsed(event: { parentId: number }): void;

	nodeUpdated(event: { node: NodeInfo }): void;
}

export interface TreeSelectionEvent {

	fromNodeId?: number;

	toNodeId: number;
}

/**
 * Define callback for when selection is changed.
 */
export interface TreeSelectionListener {

    /**
     * Called when a user selects node.
     *
     * @param event
     */
	selectionChanged: (event: TreeSelectionEvent) => void;
}

export interface TreeModel {

	init(): void;

	expandNode(nodeId: number): void;

	collapseNode(nodeId: number): void;

	poll(): void;

	select(nodeId: number): void;

	addSelectionListener(listener: TreeSelectionListener): void;

	addTreeChangeListener(listener: TreeChangeListener): void;
}

interface NodeData {
	pending: boolean;
	expanded: boolean;
	node: NodeInfo;
}

type CompareNodeListCallbacks = {
	inserted: (nodeId: number, index: number) => void;
	deleted: (nodeId: number, index: number) => void;
};


export class OjTreeModel implements TreeModel {

	readonly startingNodeId: string = '1';

	private nodeDataById: {
		[nodeId: number]: NodeData;
	} = {};

	private lastSeq: number = -1;

	private pendingLeastSeq?: number;

	private selectedNodeId?: number;

	private selectionListeners: TreeSelectionListener[] = [];

	private changeListeners: TreeChangeListener[] = [];

	constructor(readonly ojTreeDao: TreeDao) {

	}

	private fireSelectionChanged(fromNodeId: number | undefined, toNodeId: number): void {
		let event: TreeSelectionEvent = {
			fromNodeId: fromNodeId,
			toNodeId: toNodeId
		};

		for (var i = 0; i < this.selectionListeners.length; ++i) {
			this.selectionListeners[i].selectionChanged(event);
		}
	}

	private fireTreeInitialised(node: NodeInfo): void {

		const event = {
			rootNode: node
		};

		for (var i = 0; i < this.changeListeners.length; ++i) {
			this.changeListeners[i].treeInitialised(event);
		}
	}

	private fireNodeInserted(parentId: number, index: number, node: NodeInfo): void {

		const event = {
			parentId: parentId,
			index: index,
			node: node
		};

		for (var i = 0; i < this.changeListeners.length; ++i) {
			var callback = this.changeListeners[i].nodeInserted(event);
		}
	}

	private fireNodeRemoved(nodeId: number): void {

		const event = {
			nodeId: nodeId
		};

		for (var i = 0; i < this.changeListeners.length; ++i) {
			var callback = this.changeListeners[i].nodeRemoved(event);
		}
	}

	private fireNodeExpanded(parentId: number, nodeArray: NodeInfo[]): void {

		const event = {
			parentId: parentId,
			nodeList: nodeArray
		};

		for (var i = 0; i < this.changeListeners.length; ++i) {
			this.changeListeners[i].nodeExpanded(event);
		}
	}

	private fireNodeCollapsed(parentId: number): void {

		const event = {
			parentId: parentId
		};

		for (var i = 0; i < this.changeListeners.length; ++i) {
			var callback = this.changeListeners[i].nodeCollapsed(event);
		}
	}

	private fireNodeUpdated(node: NodeInfo): void {
		var event = {
			node: node
		};

		for (var i = 0; i < this.changeListeners.length; ++i) {
			var callback = this.changeListeners[i].nodeUpdated(event)
		}
	}

	private compareNodeList(nodes1: number[], nodes2: number[],
		callbacks: CompareNodeListCallbacks) {

		var lastI = 0, insertPoint = 0;

		for (var j = 0; j < nodes2.length; ++j) {

			var found = false;

			for (var i = lastI; i < nodes1.length; ++i) {

				if (nodes2[j] == nodes1[i]) {

					for (; lastI < i; ++lastI) {
						callbacks.deleted(nodes1[lastI], insertPoint);
					}
					++lastI;
					++insertPoint;
					found = true;
					break;
				}
			}

			if (!found) {
				callbacks.inserted(nodes2[j], insertPoint++);
			}
		}

		for (var i = lastI; i < nodes1.length; ++i) {
			callbacks.deleted(nodes1[i], insertPoint);
		}
	}

	private nodeDataFor(nodeId: number): NodeData {

		let nodeData: NodeData = this.nodeDataById[nodeId];
		if (nodeData === undefined) {
			throw "No node data for node id [" + nodeId + "]"
		}
		return nodeData;
	}

	private whenNodeDataFor = (nodeId: number, then: (nodeData: NodeData) => any): any => {

		let nodeData: NodeData = this.nodeDataById[nodeId];

		if (nodeData !== undefined) {
			return then(nodeData);
		}
	}

	private updateNodeStateExpanded(nodeId: number, expanded: boolean): void {

		let nodeData: NodeData = this.nodeDataFor(nodeId);
		nodeData.expanded = expanded;
	}

	private createNodeStates(nodes: NodeInfo[], pending: boolean = false): void {

		for (var i = 0; i < nodes.length; ++i) {
			this.createNodeState(nodes[i], pending);
		}
	}

	private createNodeState(node: NodeInfo, pending: boolean = false): void {

		var nodeData = {
			expanded: false,
			pending: pending,
			node: node
		};

		this.nodeDataById[node.nodeId] = nodeData;
	}

	private updateNodeState(update: { nodeId: number, children: number[], name: string, icon: string }) {

		var nodeData = this.nodeDataFor(update.nodeId);
		var existing = nodeData.node;

		if (update.children) {
			existing.children = update.children;
		}
		if (update.name) {
			existing.name = update.name;
		}
		if (update.icon) {
			existing.icon = update.icon;
		}
	}

	private childrenRequest(intArray: number[]): string {

		let childrenStr: string = "";
		for (var i = 0; i < intArray.length; ++i) {
			if (i > 0) {
				childrenStr = childrenStr + ",";
			}
			childrenStr = childrenStr + intArray[i];
		}
		return childrenStr;
	}

	private updatePendingSeq(eventSeq: number): void {

		if (this.pendingLeastSeq === undefined) {
			this.pendingLeastSeq = eventSeq
		}
		else if (eventSeq < this.pendingLeastSeq) {
			this.pendingLeastSeq = eventSeq;
		}
	}

	private rootNodeCallback = (data: MakeNodeInfoRequestData): void => {

		let rootNode: NodeInfo = data.nodeInfo[0];

		this.fireTreeInitialised(rootNode);

		this.createNodeState(rootNode, false);

		this.lastSeq = data.eventSeq;
	}

	private provideExpandCallback = (parentId: number): (data: MakeNodeInfoRequestData) => void => {

		return (data: MakeNodeInfoRequestData): void => {

			let nodeArray: NodeInfo[] = data.nodeInfo

			this.fireNodeExpanded(parentId, nodeArray);

			this.updateNodeStateExpanded(parentId, true);

			this.createNodeStates(nodeArray, true);
			this.updatePendingSeq(data.eventSeq);
		};
	}

	private recursiveCollapse(nodeId: number): void {

		this.whenNodeDataFor(nodeId,
			(nodeData: NodeData): void => {

				if (!nodeData.expanded) {
					return;
				}

				let node: NodeInfo = nodeData.node;

				let childNodeIds: number[] = node.children;

				for (var i = 0; i < childNodeIds.length; ++i) {
					let childNodeId: number = childNodeIds[i];
					this.recursiveCollapse(childNodeId);

					delete this.nodeDataById[childNodeId];
				}

				this.fireNodeCollapsed(nodeId);

				nodeData.expanded = false;
			});
	}

	private insertNode(parentId: number, index: number, node: NodeInfo): void {

		this.createNodeState(node, true);

		this.fireNodeInserted(parentId, index, node);
	}

	private provideInsertedNodesCallback = (childThings: {
		nodeActions: ((nodeInfo: NodeInfo) => number)[];
	}): (data: MakeNodeInfoRequestData) => void => {

		return (data: MakeNodeInfoRequestData): void => {

			let nodeInfo: NodeInfo[] = data.nodeInfo;

			let j: number = 0;

			let nodeActions: ((nodeInfo: NodeInfo) => number)[]
				= childThings.nodeActions;

			for (var i = 0; i < nodeActions.length; ++i) {

				j = j + nodeActions[i](nodeInfo[j]);
			}

			this.updatePendingSeq(data.eventSeq);
		}
	}

	private updateNode(node: NodeInfo,
		childThings: {
			insertedNodeIds: number[];
			nodeActions: ((nodeInfo: NodeInfo) => number)[];
		}) {

		const self = this;

		const nodeData: NodeData = this.nodeDataFor(node.nodeId);

		const newChildren: number[] = node.children;

		if (nodeData.expanded && newChildren !== undefined) {

			const oldChildren = nodeData.node.children;

			this.compareNodeList(oldChildren, newChildren,
				{
					inserted: (nodeId: number, index: number): void => {
						childThings.insertedNodeIds.push(nodeId);
						childThings.nodeActions.push((childNode: NodeInfo): number => {
							self.insertNode(node.nodeId, index, childNode);
							return 1;
						});
					},
					deleted: function (nodeId, index) {
						childThings.nodeActions.push((childNode: NodeInfo): number => {
							self.recursiveCollapse(nodeId);
							delete self.nodeDataById[nodeId];
							self.fireNodeRemoved(nodeId);
							return 0;
						});
					}
				});
		}

		this.fireNodeUpdated(node);
		this.updateNodeState(node);
	}

	private pollCallback = (data: MakeNodeInfoRequestData): void => {

		const childThings: {
			nodeActions: ((nodeInfo?: NodeInfo) => number)[];
			insertedNodeIds: number[];
		} = {
			nodeActions: [],
			insertedNodeIds: []
		};

		const nodeInfo: NodeInfo[] = data.nodeInfo;

		for (var i = 0; i < nodeInfo.length; ++i) {

			const node: NodeInfo = nodeInfo[i];

			this.updateNode(node, childThings);
		}

		if (this.pendingLeastSeq === undefined) {
			this.lastSeq = data.eventSeq;
		}
		else {
			for (var property in this.nodeDataById) {
				if (this.nodeDataById.hasOwnProperty(property)) {
					this.nodeDataById[property].pending = false;
				}
			}
			this.lastSeq = this.pendingLeastSeq;
			this.pendingLeastSeq = undefined;
		}

		if (childThings.insertedNodeIds.length > 0) {

			this.ojTreeDao.makeNodeInfoRequest(
				this.childrenRequest(childThings.insertedNodeIds),
				this.provideInsertedNodesCallback(childThings), -1);
		}
		else {
			var nodeActions = childThings.nodeActions;
			for (var i = 0; i < nodeActions.length; ++i) {
				nodeActions[i]();
			}
		}
	}


	init(): void {

		this.ojTreeDao.makeNodeInfoRequest(this.startingNodeId, this.rootNodeCallback, -1);
	}

	expandNode(nodeId: number): void {

		var nodeData = this.whenNodeDataFor(nodeId, (nodeData: NodeData): void => {

			let node: NodeInfo = nodeData.node;
			var childNodes = this.childrenRequest(node.children);

			this.ojTreeDao.makeNodeInfoRequest(childNodes,
				this.provideExpandCallback(nodeId), -1);
		})
	}

	collapseNode(nodeId: number): void {

		this.recursiveCollapse(nodeId);
	}

	poll(): void {

		var nonePendingNodeIds = [];

		for (var property in this.nodeDataById) {
			if (this.nodeDataById.hasOwnProperty(property)) {
				var nodeData = this.nodeDataById[property];
				if (nodeData.pending === false) {
					nonePendingNodeIds.push(nodeData.node.nodeId);
				}
			}
		}

		this.ojTreeDao.makeNodeInfoRequest(this.childrenRequest(nonePendingNodeIds),
			this.pollCallback, this.lastSeq);
	}

	select(nodeId: number): void {

		if (nodeId != this.selectedNodeId) {
			this.fireSelectionChanged(this.selectedNodeId, nodeId)
			this.selectedNodeId = nodeId;
		}
	}

	addSelectionListener(listener: TreeSelectionListener): void {
		if (!listener) {
			throw new Error("TreeSelectionListener undefined.");
		}
		this.selectionListeners.push(listener);
	}

	addTreeChangeListener(listener: TreeChangeListener): void {
		if (!listener) {
			throw new Error("TreeChangeListener undefined.");
		}
		this.changeListeners.push(listener);
	}
}
