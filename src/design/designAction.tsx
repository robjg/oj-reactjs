
import React from 'react';
import ReactDOM from 'react-dom';
import { ActionFactory, ActionContext, Action, contextSearch } from '../menu/actions';
import { ConfigurationOwner } from '../remote/ojremotes';
import { ParserDesignModel } from './design';
import { DesignForm } from './designForm';
import { definedOrError } from '../main/util';

export class DesignActionFactory implements ActionFactory {

    async createAction(actionContext: ActionContext): Promise<Action | null> {
 
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
