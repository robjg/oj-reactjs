import React from 'react';
import SplitPane from 'react-split-pane';
import { Tabs } from './detail/tabs';
import { NodeFactory } from './tree/model';
import { TreeRoot } from './tree/view';


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
        return <SplitPane split="vertical" minSize={50} defaultSize="50%">
            <div id="left-component">
                <div className="control">
                    <div className="action-set" id="ojJobActions">
                    </div>
                </div>
                <div id='ojNodeRoot' className='tree global-font'>
                    <ul>
                        <TreeRoot nodeFactory={this.props.nodeFactory} />
                    </ul>
                </div>
            </div>
            <Tabs />
        </SplitPane>
    }
}
