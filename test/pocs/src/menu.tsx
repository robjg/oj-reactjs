import React, { ReactNode } from 'react';
import ReactDOM from 'react-dom';

import { DesignForm } from '../../../src/design/designForm'
import * as design from '../../../src/design/design';

import { LocalDataSource } from '../../design/LocalDataSource';

import { designDefinitions } from './data/FruitDesigns';
import { configuration } from './data/MealConfiguration';
import { Action } from '../../../src/menu/actions';
import { JobMenu } from '../../../src/menu/menu';

/** 
 * Context Menu using old style DesignFactory Design Form. 
 * Main for menu.html.
*/

const factories: LocalDataSource = new LocalDataSource();
const designModel: design.DesignModel = new design.FactoryDesignModel("foo", factories);
factories.addDesignDefinitions(designDefinitions);
factories.save("foo", configuration);

type ExampleMenuProps = {
  jobId: number,
  actionsFetch: Promise<Action[]>
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

    this.props.actionsFetch.then(a => {
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

const ourActions: Promise<Action[]> = Promise.resolve([
  {
    name: "Log Config",
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
          hideForm={() => ReactDOM.unmountComponentAtNode(formDiv)} />,
        formDiv);
    }
  }
]);


ReactDOM.render(
  <ExampleMenu jobId={1} actionsFetch={ourActions} />,
  document.getElementById('root')
);


