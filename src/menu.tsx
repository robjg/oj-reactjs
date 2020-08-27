import React from 'react';
import ReactDOM from 'react-dom';

import { DesignForm } from './design/designForm'
import * as design from './design/design';

import { LocalDataSource } from '../test/design/LocalDataSource';

const designDefinitions = require('../test/design/data/FruitDesigns.json');
const configuration = require('../test/design/data/FruitConfiguration.json');

const factories: LocalDataSource = new LocalDataSource();
const designModel: design.DesignModel = new design.FactoryDesignModel("foo", factories);
factories.addDesignDefinitions(designDefinitions);
factories.save("foo", configuration);

class JobMenu extends React.Component<{ jobId: string }, { show: boolean }> {

  constructor(props: { jobId: string }) {
    super(props);
    this.state = { show: false };
    this.toggle = this.toggle.bind(this);
  }

  toggle(event: React.FormEvent<HTMLButtonElement>) {
    this.setState({ show: !this.state.show })
  }

  options() {
    const formDiv : HTMLElement | null = document.getElementById('form');
    if (!formDiv) {
      throw Error("No form div")
    }
    
    return <ul>
      <li><button onClick={(e) => {
        this.setState({ show: false });
        console.log(factories.configurationFor("foo"));
      }}>Foo</button></li>
      <li><button onClick={(e) => {
        this.setState({ show: false });
        ReactDOM.render(
          <DesignForm designModel={designModel} 
              hideForm={()=> ReactDOM.unmountComponentAtNode(formDiv)}/>,
          formDiv
        );
      }}>Design</button ></li>
    </ul>
  }

  render() {

    return <>
      <button onClick={this.toggle}>...</button>
      {this.state.show && this.options()}
    </>
  }
}



ReactDOM.render(
  <JobMenu jobId="1" />,
  document.getElementById('root')
);


