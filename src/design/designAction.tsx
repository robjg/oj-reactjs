
import React from 'react';
import ReactDOM from 'react-dom';
import { ActionFactory, ActionContext, Action, contextSearch } from '../menu/actions';
import { ConfigurationOwner, ConfigPoint } from '../remote/ojremotes';
import { AddJobForm as AddJobForm } from './addjob';
import { ParserDesignModel } from './design';
import { DesignForm } from './designForm';
import { definedOrError } from '../main/util';
import { JAVA_OBJECT } from '../remote/java';

export class DesignActionFactory implements ActionFactory {

    createAction(actionContext: ActionContext): Action | null {

        const configOwner: ConfigurationOwner | null = contextSearch(actionContext, ConfigurationOwner);

        if (configOwner == null) {
            return null;
        }

        return {

            name: "Design",

            isEnabled: true,

            perform: () => {

                configOwner.formFor(actionContext.proxy)
                    .then(formText => {
                        function hide() {
                            formDiv.style.display = 'none';
                            ReactDOM.unmountComponentAtNode(formDiv);
                        }

                        const designModel = new ParserDesignModel(
                            {
                                formConfiguration: JSON.parse(formText),
                                saveAction: (config: any) => {
                                    hide();
                                    configOwner.replaceJson(actionContext.proxy,
                                        JSON.stringify(config));
                                },
                                newForm: (element: string, isComponent: boolean, propertyClass: string) =>
                                    configOwner.blankForm(isComponent, element, propertyClass)
                            });

                        const formDiv = definedOrError(document.getElementById('ojForm'), "No form div.");

                        ReactDOM.render(
                            <DesignForm designModel={designModel}
                                hideForm={hide} />,
                            formDiv);

                        formDiv.style.display = 'block';
                    });
            }

        }
    }
}

export class AddJobActionFactory implements ActionFactory {

    createAction(actionContext: ActionContext): Action | null {

        const configOwner: ConfigurationOwner | null = contextSearch(actionContext, ConfigurationOwner);

        if (configOwner == null) {
            return null;
        }
        const proxy = actionContext.proxy;

        if (!proxy.isA(ConfigPoint)) {
            return null;
        }

        const dragPoint: ConfigPoint = proxy.as(ConfigPoint);

        function launchDesignForm(tag: string): void {

            configOwner?.blankForm(true, tag, JAVA_OBJECT.name)
                .then(formText => {

                    function hide() {
                        formDiv.style.display = 'none';
                        ReactDOM.unmountComponentAtNode(formDiv);
                    }

                    const designModel = new ParserDesignModel(
                        {
                            formConfiguration: JSON.parse(formText),
                            saveAction: (config: any) => {
                                hide();
                                dragPoint?.paste(-1, JSON.stringify(config));
                            },
                            newForm: (element: string, isComponent: boolean, propertyClass: string) =>
                                configOwner.blankForm(isComponent, element, propertyClass)
                        });

                    const formDiv = definedOrError(document.getElementById('ojForm'), "No form div.");

                    ReactDOM.render(
                        <DesignForm designModel={designModel}
                            hideForm={hide} />,
                        formDiv);

                    formDiv.style.display = 'block';
                });
        }

        class Impl implements Action {

            readonly name = "Add Job";

            get isEnabled(): boolean {
                return dragPoint.isPasteSupported;
            }

            perform(): void {

                dragPoint.possibleChildren()
                    .then(possibleChildren => {
                        function hide() {
                            formDiv.style.display = 'none';
                            ReactDOM.unmountComponentAtNode(formDiv);
                        }

                        const formDiv = definedOrError(document.getElementById('ojForm'), "No form div.");

                        ReactDOM.render(
                            <AddJobForm options={possibleChildren}
                                launchDesignForm={launchDesignForm}
                                hideForm={hide} />,
                            formDiv);

                        formDiv.style.display = 'block';
                    });
            }

        }

        return new Impl();
    }
}

