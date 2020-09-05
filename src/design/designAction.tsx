
import React from 'react';
import ReactDOM from 'react-dom';
import { ActionFactory, ActionContext, Action, contextSearch } from '../menu/actions';
import { ConfigurationOwner } from '../remote/remote';
import { DesignModel, ParserDesignModel } from './design';
import { DesignForm } from './designForm';
import { definedOrError } from '../main/util';

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
                        const designModel = new ParserDesignModel(
                            {
                                formConfiguration: JSON.parse(formText),
                                saveAction: (config: any) => { 
                                    console.log("Save TBD."); 
                                },
                                newForm: (element: string, isComponent: boolean, propertyClass: string) =>
                                    configOwner.blankForm(isComponent, element, propertyClass)
                            });

                        const formDiv = definedOrError(document.getElementById('ojForm'), "No form div.");
                        function hide() {
                            formDiv.style.display = 'block';
                            ReactDOM.unmountComponentAtNode(formDiv);
                        }

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
