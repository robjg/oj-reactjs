import React from 'react';
import ReactDOM from 'react-dom';

import { sequentialForm } from './data/SequentialForm';
import { AvailableActions, Action, ActionContext } from '../../../src/menu/actions';
import { MenuProvider } from '../../../src/menu/menuProvider';
import { RemoteProxy } from '../../../src/remote/remote';
import { ConfigurationOwner } from '../../../src/remote/ojremotes'
import { DesignActionFactory } from '../../../src/design/designAction';


type ExampleMenuProps = {
    jobId: number,
    menuProvider: MenuProvider
}

class ExampleMenu extends React.Component<ExampleMenuProps> {

    constructor(props: ExampleMenuProps) {
        super(props);
    }

    render() {

        return <>
            <button onClick={() => this.props.menuProvider.menuClick(this.props.jobId)}>...</button>
            <div id='contextMenuMount' />
        </>
    }
}

const context1: ActionContext = {
    parent: null,
    proxy: new class implements RemoteProxy {
        remoteId: 1;
        isA(cntor: new (...args: any[]) => any): boolean {
            if (ConfigurationOwner == cntor) {
                return true;
            }
            else {
                return false;
            }
        }
        as<T>(cntor: new (...args: any[]) => T): T {
            if (cntor == ConfigurationOwner as unknown) {
                return new class extends ConfigurationOwner {
                    formFor(proxy: RemoteProxy): Promise<string> {
                        return Promise.resolve(JSON.stringify(sequentialForm));
                    }

                    blankForm(isComponent: boolean,
                        element: string,
                        propertyClass: string): Promise<string> {
                        throw new Error("Unimplemented");
                    }

                    replaceJson(proxy: RemoteProxy, json: string): void {
                        console.log(json);
                    }
                } as unknown as T;
            }

            else {
                return null as T;
            }
        }
        destroy(): void {}
    }
}

const context2: ActionContext = {
    parent: context1,
    proxy: new class implements RemoteProxy {
        remoteId: 2;
        isA(cntor: new (...args: any[]) => any): boolean {
            return false;
        }
        as<T>(cntor: new (...args: any[]) => T): T {
            return null as T;
        }
        destroy(): void {}
    }
}

class OurActions implements AvailableActions {

    actionsFor(nodeId: number): Promise<Action[]> {

        return Promise.resolve([
            new DesignActionFactory().createAction(context2)
        ]);
    }
}

const menuProvider = new MenuProvider();
menuProvider.availableActions = new OurActions();

ReactDOM.render(
    <ExampleMenu jobId={1} menuProvider={menuProvider} />,
    document.getElementById('root')
);


