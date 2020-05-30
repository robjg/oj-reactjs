import React from 'react';
import ReactDOM from 'react-dom';

import { DesignForm } from './design/designForm'
import * as design from './design/design';

const designDefinitions = require('../test/design/data/FruitDesigns.json');
const configuration = require('../test/design/data/FruitConfiguration.json');

const factories: design.CachingDesignFactory = new design.CachingDesignFactory();
factories.addDesignDefinitions(designDefinitions);

const designInstance = factories.createDesign(design.configurationFromAny(configuration),
  design.ArooaType.Component);


ReactDOM.render(
  <DesignForm designInstance={designInstance} />,
  document.getElementById('root')
);


