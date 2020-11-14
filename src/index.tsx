
import './css/main.css';
import './css/global.css';
import './css/tree.css';
import './css/detail.css';
import './css/control.css';
import './css/form.css';
import './css/split-pane.css';

import { OjMain } from './main/ojMain';
import { RemoteSessionFactory, RemoteConnection } from './remote/remote';
import { ConfigurationOwnerHandler } from './remote/ojremotes';
import { DesignActionFactory } from './design/designAction';
import { ContextManager } from './menu/actions';
import { MenuProvider } from './menu/menu';

const menuProvider = new MenuProvider();    

const main = new OjMain({ 
    contextMenuProvider: (nodeId: number) : void => menuProvider.menuClick(nodeId)
});

const treeModel = main.ojTreeModel;

const remote = RemoteConnection.fromHost(location.host); 

const remoteSession = new RemoteSessionFactory(remote)
    .register(new ConfigurationOwnerHandler())
    .createRemoteSession();

const contextManager = new ContextManager(remoteSession,
    [ new DesignActionFactory() ]);

treeModel.addTreeChangeListener(contextManager);

menuProvider.availableActions = contextManager;

main.start();
