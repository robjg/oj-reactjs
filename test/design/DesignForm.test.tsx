import React from 'react'
import { render, fireEvent } from '@testing-library/react'

import { DesignForm } from '../../src/design/designForm'
import { DesignInstance, TextField, SingleTypeSelection, CachingDesignFactory, configurationFromAny, ArooaType, parse } from '../../src/design/design';

const designDefinitions = require('./data/FruitDesigns.json');
const configuration = require('./data/FruitConfiguration.json');


test('Test Render Text Field', () => {
   
    const factories: CachingDesignFactory = new CachingDesignFactory();
    factories.addDesignDefinitions(designDefinitions);

    const designInstance = factories.createDesign(configurationFromAny(configuration),
        ArooaType.Component);
  
    const result = render(<DesignForm designInstance={ designInstance} />);

    const input = result.getByLabelText("Description");

//    result.debug();

    fireEvent.change(input, { target: { value: "An Afternoon Snack"} });

//    result.debug();

    const after: any = parse(designInstance);

    console.log(JSON.stringify(after));

    
});

test('Test Render Design Instance', () => {

    const factories: CachingDesignFactory = new CachingDesignFactory();
    factories.addDesignDefinitions(designDefinitions);

    const designInstance = factories.createDesign(configurationFromAny(configuration),
        ArooaType.Component);
    

    const result = render(<DesignForm designInstance={ designInstance} />);

    const input = result.getByLabelText("Description");


//    result.debug();
})