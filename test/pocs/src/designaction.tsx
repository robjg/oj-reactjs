import React, { ReactNode } from 'react';
import ReactDOM from 'react-dom';

import { sequentialForm } from './data/SequentialForm';
import { Clipboard } from '../../../src/clipboard';
import { Action, ActionContext } from '../../../src/menu/actions';
import { JobMenu } from '../../../src/menu/menu';
import { RemoteProxy } from '../../../src/remote/remote';
import { ConfigurationOwner } from '../../../src/remote/ojremotes'
import { DesignActionFactory } from '../../../src/design/designAction';

class MockClipboard implements Clipboard {
    copy(text: string): Promise<void> {
        throw new Error("Unsupported");
    }

    paste(): Promise<string> {
        throw new Error("Unsupported");
    }
}

type ExampleMenuProps = {
    jobId: number;
    actionFetch: Action[]
}

type ExampleMenuState = {
    menuVisible: boolean;
    actions?: Action[]
}


class ExampleMenu extends React.Component<ExampleMenuProps, ExampleMenuState> {

    constructor(props: ExampleMenuProps) {
        super(props);

        this.state = {
            menuVisible: false
        }

        this.toggleMenu = this.toggleMenu.bind(this);
    }

    componentDidMount() {

        Promise.all(this.props.actionFetch).then(a => {
            this.setState({
                actions: a
            })
        })

    }

    toggleMenu(): void {
        this.setState({
            menuVisible: !this.state.menuVisible
        })
    }

    renderJobMenu(): ReactNode {

        if (this.state.menuVisible) {
            return <JobMenu actions={this.state.actions} onMenuSelected={this.toggleMenu} />
        }
        else {
            return <></>
        }
    }


    render() {

        return <>
            <button onClick={this.toggleMenu}>...</button>
            { this.renderJobMenu() }
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
        destroy(): void { }
    },
    clipboard: new MockClipboard()
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
        destroy(): void { }
    },
    clipboard: new MockClipboard()
}


const actionPromises: Action[] = [new DesignActionFactory().createAction(context2)];


ReactDOM.render(
    <ExampleMenu jobId={1} actionFetch={actionPromises} />,
    document.getElementById('root')
);


