
import './css/main.css';
import './css/global.css';
import './css/tree.css';
import './css/detail.css';
import './css/control.css';
import './css/form.css';
import './css/split-pane.css';

import { OjMain } from './main/ojMain';
import { RemoteSessionFactory, RemoteConnection } from './remote/remote';
import { ConfigurationOwnerHandler, ojRemoteSession } from './remote/ojremotes';
import { DesignActionFactory } from './design/designAction';
import { ContextManager } from './menu/actions';
import { MenuProvider } from './menu/menu';
import ReactDOM from 'react-dom';
import React from 'react';
import { SessionNodeFactory } from './tree/model';
import { TreeRoot } from './tree/view';
import { TreeSelectionBridge } from './tree/bridge';

const remote = RemoteConnection.fromHost(location.host);

const session = ojRemoteSession(remote);

const nodeFactory = new SessionNodeFactory(session,
    [new DesignActionFactory()]);

const bridge = new TreeSelectionBridge(nodeFactory);


const main = new OjMain({
    treeSelectionModel: bridge
});


ReactDOM.render(
    React.createElement(TreeRoot,
        { nodeFactory: nodeFactory }, null),
    document.getElementById('ojNodeRoot')
);


main.start();
