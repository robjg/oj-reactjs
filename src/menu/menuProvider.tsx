import React from 'react';
import ReactDOM from 'react-dom';

import { AvailableActions, Action } from './actions';

type MenuItemProps = {
    action: Action;
    onMenuSelected: () => void
};

class MenuItem extends React.Component<MenuItemProps, {}> {

    constructor(props: MenuItemProps) {
        super(props);
        this.doAction = this.doAction.bind(this);
    }

    doAction(event: React.FormEvent<HTMLButtonElement>) {
        this.props.onMenuSelected();
        this.props.action.action();
    }

    render() {
        return <button onClick={this.doAction}>{this.props.action.name}</button>
    }
}

type JobMenuProps = {
    actions: Action[];
    onMenuSelected: () => void
};

class JobMenu extends React.Component<JobMenuProps, { }> {

    render() {
        return <ul>
            {this.props.actions.map((action, index) =>
                <li key={index} className='menuItem'>
                    <MenuItem action={action} onMenuSelected={this.props.onMenuSelected} />
                </li>)
            }
        </ul>;
    }
}

export class MenuProvider {

    private lastId: number = -1;

    constructor(readonly availableActions: AvailableActions) {

    }

    menuClick(nodeId: number) {

        const menuMount: HTMLElement | null = document.getElementById('contextMenuMount');
        if (!menuMount) {
            throw Error("No #contextMenuMount element")
        }

        const self : MenuProvider = this;

        function unmount() {
            ReactDOM.unmountComponentAtNode(menuMount as HTMLElement)
            self.lastId = -1;
        }

        if (this.lastId == nodeId) {
            unmount();
        }
        else {
            this.lastId = nodeId;

            const actions : Action[] = this.availableActions.actionsFor(nodeId);

            ReactDOM.render(
                <JobMenu actions={actions} onMenuSelected={unmount}/>,
                menuMount
            );
        }
    }
}