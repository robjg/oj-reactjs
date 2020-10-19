
import './css/main.css';
import './css/global.css';
import './css/tree.css';
import './css/detail.css';
import './css/control.css';
import './css/form.css';
import './css/split-pane.css';

import { OjMain } from './main/ojMain';
import { RemoteInvoker } from './remote/invoke';
import { RemoteSessionFactory } from './remote/remote';
import { ConfigurationOwnerHandler } from './remote/ojremotes';
import { DesignActionFactory } from './design/designAction';
import { ContextManager } from './menu/actions';
import { MenuProvider } from './menu/menuProvider';

const menuProvider = new MenuProvider();    

const main = new OjMain({ 
    contextMenuProvider: (nodeId: number) : void => menuProvider.menuClick(nodeId)
});

const treeModel = main.ojTreeModel;

const invoker = new RemoteInvoker(location.origin + '/invoke');

const remoteSession = new RemoteSessionFactory(invoker)
    .register(new ConfigurationOwnerHandler())
    .createRemoteSession();

const contextManager = new ContextManager(remoteSession,
    [ new DesignActionFactory() ]);

treeModel.addTreeChangeListener(contextManager);

menuProvider.availableActions = contextManager;

main.start();
