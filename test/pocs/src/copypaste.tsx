
import React from 'react';
import ReactDOM from 'react-dom';
import { Clipboard, NavigatorClipboard } from '../../../src/clipboard';
import { AddJobActionFactory } from '../../../src/design/designAction';
import { Action, ActionContext, ActionFactories, ActionFactory, ActionSet } from '../../../src/menu/actions';
import { JobMenu } from '../../../src/menu/menu';
import { CopyActionFactory, CutActionFactory, PasteActionFactory } from '../../../src/menu/ojactions';
import { ojRemoteSession } from '../../../src/remote/ojremotes';
import { RemoteProxy, RemoteConnection, RemoteSession } from '../../../src/remote/remote';

class ParentActionContext implements ActionContext {

    parent = null;

    constructor(readonly proxy: RemoteProxy) { }

    readonly clipboard = new NavigatorClipboard();

    indexOf(childContext: ActionContext): number | undefined {
        return undefined;
    }

}

class ChildActionContext implements ActionContext {

    readonly clipboard: Clipboard;

    constructor(readonly parent: ActionContext, readonly proxy: RemoteProxy) {
        this.clipboard = parent.clipboard;
    }

    indexOf(childContext: ActionContext): number | undefined {
        return undefined;
    }
}

type clipboardComponentProps = {
    remote: RemoteConnection;

    actionFactories: ActionFactory[]
}

type ClipboardComponentState = {

    actions: ActionSet | null;

    output: string;
}

class ClipboardComponent extends React.Component<clipboardComponentProps, ClipboardComponentState> {

    private readonly session: RemoteSession;;

    constructor(props: clipboardComponentProps) {
        super(props);

        this.session = ojRemoteSession(props.remote)

        this.state = {
            actions: null,
            output: ''
        }
    }

    componentDidMount() {

        const root: Promise<RemoteProxy> = this.session.getOrCreate(1);

        const child: Promise<RemoteProxy> = this.session.getOrCreate(2);

        root.then(async r => {
            const c = await child;

            const context = new ChildActionContext(new ParentActionContext(r), c);

            const actions: ActionSet = await new ActionFactories(this.props.actionFactories)
                .actionsFor(context);

            this.setState({
                actions: actions
            });
        });
    }

    render() {

        if (this.state.actions) {
            return (
                <div>
                    <div>
                        <JobMenu actions={this.state.actions.actions} onMenuSelected={() => { }} />
                    </div>
                    <div>
                        <h1>: {this.state.output}</h1>

                    </div>
                </div>
            );
        }
        else {
            return <h1>No clipboard</h1>;
        }
    }
}

export function start() {

    const factories: ActionFactory[] = [
        new CutActionFactory(),
        new CopyActionFactory(),
        new PasteActionFactory(),
        new AddJobActionFactory()
    ];

    RemoteConnection.fromHost('localhost:8080')
        .then(remote => ReactDOM.render(
            <ClipboardComponent remote={remote} actionFactories={factories} />,
            document.getElementById('root'))
        )
}
