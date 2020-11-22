
import './css/main.css';
import './css/global.css';
import './css/tree.css';
import './css/detail.css';
import './css/control.css';
import './css/form.css';
import './css/split-pane.css';

import ReactDOM from 'react-dom';
import React from 'react';

import { OjMain } from './main/ojMain';
import { RemoteConnection } from './remote/remote';
import { ojRemoteSession } from './remote/ojremotes';
import { SessionNodeFactory } from './tree/model';
import { TreeRoot } from './tree/view';
import { TreeSelectionBridge } from './tree/bridge';
import { ojActions } from './menu/ojactions';

const remote = RemoteConnection.fromHost(location.host);

const session = ojRemoteSession(remote);

const nodeFactory = new SessionNodeFactory(session, ojActions());

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
