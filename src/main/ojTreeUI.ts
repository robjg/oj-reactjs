import { IconProvider, NodeInfo } from "./ojDao";
import { TreeChangeListener, TreeSelectionListener, TreeSelectionEvent } from "./ojTreeModel";
import { TreeController } from "./ojTreeController";

/**
 * Creates The Oddjob Tree UI Component. This component is a Selection Listener and a
 * Tree Change Listener and must be added as a listener to a Model to receive the
 * structure to display.
 *
 */
export class OjTreeUI implements TreeChangeListener, TreeSelectionListener {

	private ojTreeController: TreeController;

	private iconProvider: IconProvider;

	private idPrefix: string;

	private label: (node: NodeInfo) => JQuery<any>;

    /**
     * Constructor.
     *
     * @param ojTreeController
     * @param iconProvider
     * @param idPrefix
     */
	constructor(ojTreeController: TreeController, iconProvider: IconProvider, idPrefix: string = 'ojNode') {

        if (ojTreeController.isSelectEnabled()) {
            this.label = function(node: NodeInfo): JQuery<any> {
                return $('<a>' + node.name + '</a>').click(function() {
                    ojTreeController.select(node.nodeId);
                });
            }
        }
        else {
            this.label = function(node: NodeInfo): JQuery<any> {
                return $(document.createTextNode(node.name));
            }
        }

        this.ojTreeController = ojTreeController;
        this.iconProvider = iconProvider;
        this.idPrefix = idPrefix;
    }

	private expandImage(nodeId: number): JQuery {
		return $('<img>').attr(
				{ class: 'toggle',
				  src: 'gfx/plus.png',
				  alt: 'expand'
				}
			).click((): void => {
				this.ojTreeController.expandNode(nodeId);
			}
		);
	}
	
	private collapseImage(nodeId: number): JQuery {
		return $('<img>').attr(
				{ class: 'toggle',
				  src: 'gfx/minus.png', 
				  alt: 'collapse' 
				}
			).click((): void => {
				this.ojTreeController.collapseNode(nodeId)
			}
		);
	}
	
	private iconImage(iconName: string): JQuery {
		
		return $('<img>').attr(
				{ class: 'icon',
				  src: this.iconProvider.iconSrcUrl(iconName),
				  alt: iconName 
				}
		);
	}

	private changeToggleImageToExpand(li$: JQuery, nodeId: number): void {
		
		li$.find('>img.toggle').replaceWith(
            this.expandImage(nodeId));
	}
	
	private changeToggleImageToCollapse(li$: JQuery, nodeId: number): void {
		
		let img$: JQuery = li$.find('>img.toggle');
		
		if (img$.length === 0) {
			li$.prepend(this.expandImage(nodeId));
		}
		else {
			img$.replaceWith(
                this.collapseImage(nodeId));
		}
	}
	
	private static removeToggleImage(li$: JQuery): void {
		
		li$.children('img.toggle').remove();
	}
	
	private changeIconImage(li$: JQuery, iconName: string): void {
		
		li$.children('img.icon').replaceWith(
            this.iconImage(iconName));
	}
	
	private nodeIdSelector(nodeId: string): string {
		return '#' + this.idPrefix  + nodeId;
	}
	
	private htmlForNode(node: NodeInfo): JQuery {
		
		let li$: JQuery = $('<li>').attr('id', 'ojNode' + node.nodeId);
		
		if (node.children !== undefined && node.children.length > 0) {
			li$.append(this.expandImage(node.nodeId));
		}
		
		if (node.icon !== undefined) {
			li$.append(this.iconImage(node.icon));
		}
		
		li$.append(this.label(node));
		
	    li$.append('<ul>');
	    
	    return li$;
	}	
	
	private insertChildFirst(parent$: JQuery, node: NodeInfo): void {
		
		parent$.find('>ul').prepend(this.htmlForNode(node));
	}

    private insertChild(parent$: JQuery, index: number, node: NodeInfo): void {
		
	    parent$.find('>ul>li:nth-child('+ index +')'
				).after(this.htmlForNode(node));
	}

    private appendChild(parent$: JQuery, node: NodeInfo) {
		
		parent$.find('>ul'
				).append(this.htmlForNode(node));
	}

    treeInitialised = (event: {rootNode: NodeInfo}): void => {
			
        var node = event.rootNode;

        this.insertChildFirst($(this.nodeIdSelector('Root')), node);
    };
		
    /*
     * Create the DOM for a node and make it a child of the
     * given parent at the given index.
     */
    nodeInserted = (event: {parentId: number, index: number, node: NodeInfo}): void => {

        let parentId: number = event.parentId;
        let index: number = event.index;
        let node: NodeInfo = event.node;

        var parent$ = $(this.nodeIdSelector(parentId.toString()));

        if (parent$.children('ul li').length == 0) {
            this.changeToggleImageToCollapse(parent$, parentId)
        }

        if(index === 0) {
            this.insertChildFirst(parent$, node);
        }
        else {
            this.insertChild(parent$, index, node);
        }
    };

    nodeRemoved = (event: {nodeId: number}): void => {

        let nodeId: string = event.nodeId.toString();

        let node$: JQuery = $(this.nodeIdSelector(nodeId));

        let parent$: JQuery = node$.parent('ul').parent('li');

        node$.remove();

        if (parent$.find('>ul>li').length == 0) {
            OjTreeUI.removeToggleImage(parent$)
        }
    };

    nodeExpanded = (event: {parentId: number, nodeList: NodeInfo[]}): void => {

        let parentId: number = event.parentId;
        let nodeList: NodeInfo[] = event.nodeList;

        let parent$: JQuery = $(this.nodeIdSelector(parentId.toString()));

        for (var i = 0; i < nodeList.length; ++i) {
            this.appendChild(parent$, nodeList[i]);
        }

        this.changeToggleImageToCollapse(parent$, parentId)
    };

    nodeCollapsed = (event: {parentId: number}): void => {

        let parentId: number = event.parentId;

        let parent$: JQuery = $(this.nodeIdSelector(parentId.toString()));

        parent$.find('>ul>li').remove();

        this.changeToggleImageToExpand(parent$, parentId);
    };
		
    nodeUpdated = (event: {node: NodeInfo}): void => {

        let node: NodeInfo = event.node;

        let li$: JQuery = $(this.nodeIdSelector(node.nodeId.toString()));

        if (node.children !== undefined) {

            if (node.children.length > 0) {
                if (li$.find('ul>li').length === 0) {
                    li$.prepend(this.expandImage(node.nodeId));
                }
            }
            else {
                OjTreeUI.removeToggleImage(li$);
            }
        }

        if (node.icon !== undefined) {
            this.changeIconImage(li$, node.icon);
        }

        // Todo: Change text.
    };
		
    selectionChanged = (event: TreeSelectionEvent): void => {

        let fromNodeId: number = event.fromNodeId;
        let toNodeId: number = event.toNodeId;

        if (fromNodeId !== undefined) {
            $(this.nodeIdSelector(fromNodeId.toString()) + ">a").removeAttr(
            'class');
        }

        if (toNodeId !== undefined) {
            $(this.nodeIdSelector(toNodeId.toString()) + ">a").attr(
                    'class', 'selected');
        }
    };

}
