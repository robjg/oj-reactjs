import React from 'react';
import { RemoteNotifier, Notification, NotificationListener, NotificationType } from '../../../src/remote/notify';
import { JavaClass, javaClasses } from '../../../src/remote/remote';

import { StateData  } from '../../../src/remote/ojremotes';

StateData.javaClass;

type NotifierState = {

    remoteId: string;
    name: string;
    type: string;
    result: string;
}

type NotifierProps = {

    notifier: RemoteNotifier;
}

export class NotifierForm extends React.Component<NotifierProps, NotifierState> {

    constructor(props: NotifierProps) {
        super(props);
        this.state = {
            remoteId: '',
            name: '',
            type: '',
            result: '',
        };

        this.handleChangeRemoteId = this.handleChangeRemoteId.bind(this);
        this.handleChangeName = this.handleChangeName.bind(this);
        this.handleChangeType = this.handleChangeType.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleChangeRemoteId(event: React.FormEvent<HTMLInputElement>) {
        this.setState({ remoteId: event.currentTarget.value });
    }

    handleChangeName(event: React.FormEvent<HTMLInputElement>) {
        this.setState({ name: event.currentTarget.value });
    }

    handleChangeType(event: React.FormEvent<HTMLInputElement>) {
        this.setState({ type: event.currentTarget.value });
    }

    handleSubmit(event: React.FormEvent<HTMLFormElement>): void {
        event.preventDefault();

        const remoteId = parseInt(this.state.remoteId);

        if (remoteId == NaN) {
            alert(`Remote Id ${this.state.remoteId} is not a number`);
            return;
        }

        if (!this.state.name!) {
            alert("No Name");
            return;
        }

        if (!this.state.type!) {
            alert("No Type");
            return;
        }

        const javaClass: JavaClass<any> = javaClasses.forName(this.state.type);

        if (!javaClasses) {
            throw new Error("No Java Class for " + this.state.type);
        }

        const notificationType : NotificationType<any> = 
            new NotificationType(this.state.name, javaClass);

        const form = this;
        
        const listener = class implements NotificationListener<unknown> {

            handleNotification(notification: Notification<any>): void {

                form.setState({
                    result: JSON.stringify(notification.data || '') });
            }
        }

        this.props.notifier.addNotificationListener(remoteId, notificationType, new listener) 

    }

    render() {
        return (
            <>
                <form onSubmit={this.handleSubmit}>
                    <ul>
                        <li>
                            <label>Remote Id
            <input type="text" value={this.state.remoteId} onChange={this.handleChangeRemoteId} />
                            </label>
                        </li>
                        <li>
                            <label>Notification Name
            <input type="text" value={this.state.name} onChange={this.handleChangeName} />
                            </label>

                        </li>
                        <li>
                            <label>Data Type
            <input type="text" value={this.state.type} onChange={this.handleChangeType} />
                            </label>
                        </li>
                    </ul>

                    <input type="submit" value="OK" />
                </form>
                <div>
                    {this.state.result}
                </div>
            </>);
    }

}
