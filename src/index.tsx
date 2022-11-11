
import './css/main.css';
import './css/global.css';
import './css/tree.css';
import './css/detail.css';
import './css/control.css';
import './css/form.css';
import './css/split-pane.css';
import './css/menu.css';


import ReactDOM from 'react-dom/client';
import React from 'react';

import { OjMain } from './main/ojMain';
import { RemoteConnection } from './remote/remote';
import { ojRemoteSession } from './remote/ojremotes';
import { SessionNodeFactory } from './tree/model';
import { TreeSelectionBridge } from './tree/bridge';
import { ojActions } from './menu/ojactions';
import { NavigatorClipboard } from './clipboard';
import { App } from './app';

RemoteConnection.fromHost(location.host)
.then(remote => {

    const session = ojRemoteSession(remote);

    const nodeFactory = new SessionNodeFactory(session,
        { actionFactories: ojActions(),
            clipboard: new NavigatorClipboard() 
        });
    
    const bridge = new TreeSelectionBridge(nodeFactory);
    
    function start(): void {
        const main = new OjMain({
            treeSelectionModel: bridge
        });
    
        main.start();
    }
    
    const domContainer: HTMLElement | null = document.getElementById('app');
    if (!domContainer) {
        throw new Error('No id in dom called app');
    }

    const root = ReactDOM.createRoot(domContainer);

    root.render(
        React.createElement(App,
            { nodeFactory: nodeFactory,
            onStart: start }, null)
    );    
})



