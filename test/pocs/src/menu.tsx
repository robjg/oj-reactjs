import React from 'react';
import ReactDOM from 'react-dom';

import { DesignForm } from '../../../src/design/designForm'
import * as design from '../../../src/design/design';

import { LocalDataSource } from '../../design/LocalDataSource';

import { designDefinitions } from './data/FruitDesigns';
import { configuration } from './data/MealConfiguration';
import { AvailableActions, Action } from '../../../src/menu/actions';
import { MenuProvider } from '../../../src/menu/menuProvider';

const factories: LocalDataSource = new LocalDataSource();
const designModel: design.DesignModel = new design.FactoryDesignModel("foo", factories);
factories.addDesignDefinitions(designDefinitions);
factories.save("foo", configuration);

type ExampleMenuProps = {
  jobId: number, 
  menuProvider: MenuProvider 
}

class ExampleMenu extends React.Component< ExampleMenuProps> {

  constructor(props: ExampleMenuProps) {
    super(props);
  }

  render() {

    return <>
      <button onClick={() => this.props.menuProvider.menuClick(this.props.jobId)}>...</button>
      <div id='contextMenuMount'/>
    </>
  }
}

class OurActions implements AvailableActions {

  actionsFor(nodeId: number) : Promise<Action[]> {

    return Promise.resolve([
      { name: "Log Config",
        isEnabled: true,
        perform: () => {
          console.log(factories.configurationFor("foo"));
        }
      },
      {
        name: "Design",
        isEnabled: true,
        perform: () => {
          const formDiv = document.getElementById('form');
          if (!formDiv) {
            throw new Error("No form div.");
          }
          ReactDOM.render(
            <DesignForm designModel={designModel} 
                hideForm={()=> ReactDOM.unmountComponentAtNode(formDiv)}/>,
              formDiv);
        }
      }
    ]);
  }
}

const menuProvider = new MenuProvider();
menuProvider.availableActions = new OurActions();

ReactDOM.render(
  <ExampleMenu jobId={1} menuProvider={menuProvider}/>,
  document.getElementById('root')
);


