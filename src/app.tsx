import React from 'react';
import { Tabs } from './detail/tabs';
import { NodeFactory } from './tree/model';
import { TreeRoot } from './tree/view';
import Split from "react-split";

type LeftPaneProps = {

    nodeFactory: NodeFactory;

}


class LeftPane extends React.Component<LeftPaneProps> {

    constructor(props: LeftPaneProps) {
        super(props);
    }

    render() {
        return <div id="left-component">
            <div id='ojNodeRoot' className='tree global-font'>
                <ul>
                    <TreeRoot nodeFactory={this.props.nodeFactory} />
                </ul>
            </div>
        </div>
    }

}


class RightPane extends React.Component {

    render() {
        return <div id="right-component">
            <Tabs />
        </div>
    }
}

export type AppProps = {

    nodeFactory: NodeFactory;

    onStart?: () => void;
}

export class App extends React.Component<AppProps> {

    constructor(props: AppProps) {
        super(props);
    }

    componentDidMount() {
        this.props.onStart?.();
    }

    render() {
        return <div>
            <div className="control">
                <div className="action-set" id="ojJobActions">
                </div>
            </div>
            <Split id='split-pane' className="split-control" sizes={[50, 50]}>
                <LeftPane nodeFactory={this.props.nodeFactory} />
                <RightPane />
            </Split>
        </div>
    }
}
