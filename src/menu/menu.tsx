import React from 'react';
import ReactDOM from 'react-dom';

import { AvailableActions, Action } from './actions';

type MenuItemProps = {
    action: Action;
    onMenuSelected: () => void
};

/**
 * Create a Menu Item Button for a Context Menu.
 */
class MenuItem extends React.Component<MenuItemProps, {}> {

    constructor(props: MenuItemProps) {
        super(props);
        this.doAction = this.doAction.bind(this);
    }

    doAction(event: React.FormEvent<HTMLButtonElement>) {
        this.props.onMenuSelected();
        this.props.action.perform();
    }

    render() {
        return <button className='btn' disabled={!this.props.action.isEnabled} onClick={this.doAction}>{this.props.action.name}</button>
    }
}

type JobMenuProps = {
    actions: Action[];
    onMenuSelected: () => void
};

/**
 * Generates Menu Buttons from an Array of {@link Action}s.
 */
export class JobMenu extends React.Component<JobMenuProps, {}> {

    render() {
        let actions = this.props.actions;
        if (actions.length == 0) {
            actions = [new NoopAction()];
        }

        return <ul className="contextMenu">
            {actions.map((action, index) =>
                <li key={index} className='menuItem'>
                    <MenuItem action={action} onMenuSelected={this.props.onMenuSelected} />
                </li>)
            }
        </ul>;
    }
}

class NoopAction implements Action {

    name: string = "No Options"

    isEnabled: boolean = false;

    perform() { }
}

/**
 * Provides a menu old style.
 */
export class MenuProvider {

    private lastId: number = -1;

    availableActions?: AvailableActions;

    menuClick(nodeId: number): void {

        const self: MenuProvider = this;

        const menuMount: HTMLElement | null = document.getElementById('contextMenuMount');
        if (!menuMount) {
            throw Error("No #contextMenuMount element")
        }

        function unmount() {
            ReactDOM.unmountComponentAtNode(menuMount as HTMLElement)
            self.lastId = -1;
        }

        if (self.lastId == nodeId) {
            unmount();
        }
        else {
            self.lastId = nodeId;

            let actions: Promise<Action[]> = self.availableActions ?
                self.availableActions.actionsFor(nodeId) :
                Promise.resolve([]);

            actions.then(acts => {
                ReactDOM.render(
                    <JobMenu actions={acts} onMenuSelected={unmount} />,
                    menuMount
                );
            })
        }
    }
}