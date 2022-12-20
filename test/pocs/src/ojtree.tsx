import React from 'react';
import ReactDOM from 'react-dom';
import { NavigatorClipboard } from '../../../src/clipboard';
import { TreeSelectionEvent, TreeSelectionModel } from '../../../src/main/ojTreeModel';
import { ojActions } from '../../../src/menu/ojactions';
import { ojRemoteSession } from '../../../src/remote/ojremotes';
import { RemoteConnection, RemoteSession } from '../../../src/remote/remote';
import { TreeSelectionBridge } from '../../../src/tree/bridge';
import { NodeFactory, SessionNodeFactory } from '../../../src/tree/model';
import { TreeRoot } from '../../../src/tree/view';
import { LoggerFactory } from '../../../src//logging';

type OjRootState = {
    messages: string[]
}

type OjRootProps = {

    remote: RemoteConnection;
}

export class OjRoot extends React.Component<OjRootProps, OjRootState> {

    private readonly bridge: TreeSelectionModel;

    private readonly nodeFactory: NodeFactory;

    constructor(props: OjRootProps) {
        super(props);

        const session: RemoteSession = ojRemoteSession(props.remote);

        const nodeFactory = new SessionNodeFactory(session, 
            { actionFactories: ojActions(),
                clipboard: new NavigatorClipboard() 
            });

        this.bridge = new TreeSelectionBridge(nodeFactory);

        this.nodeFactory = nodeFactory;

        this.state = {
            messages: []
        }
    }

    componentDidMount() {

        this.bridge.addSelectionListener({
            selectionChanged: (event: TreeSelectionEvent): void => {
                this.state.messages.push(JSON.stringify(event));
                this.setState({
                    messages: this.state.messages
                })
            }
        })
    }

    render() {
        return <>
                <TreeRoot nodeFactory={this.nodeFactory} />
                <div>
                    {this.state.messages.map((e, i) => <p key={i}>{e}</p>)}
                </div>
                </>;
    }
}

LoggerFactory.config
.setLogger("RemoteNotifier", { level: 0 })
.setLogger("RemoteInvoker", { level: 0 });

RemoteConnection.fromHost('localhost:8080')
.then(remote => ReactDOM.render(
React.createElement(OjRoot,
    { remote: remote }, null),
document.getElementById('ojNodeRoot')));

