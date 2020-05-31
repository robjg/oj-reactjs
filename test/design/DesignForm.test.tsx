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

    expect(result).toMatchSnapshot();    

    const descriptionInput = result.getByLabelText("Description");

    fireEvent.change(descriptionInput, { target: { value: "An Afternoon Snack"} });

    const tasteInput = result.getByLabelText("Taste");

    fireEvent.change(tasteInput, { target: { value: "Tangy"} });

    expect(result).toMatchSnapshot();    

    const after: any = parse(designInstance);

    expect(after['description']).toBe('An Afternoon Snack');
    expect(after['fruit']['taste']).toBe('Tangy');
});

test('Test Render Design Instance', () => {

    const factories: CachingDesignFactory = new CachingDesignFactory();
    factories.addDesignDefinitions(designDefinitions);

    const designInstance = factories.createDesign(configurationFromAny(configuration),
        ArooaType.Component);
    

    const result = render(<DesignForm designInstance={ designInstance} />);

    const fruitSelection = result.getByLabelText("Fruit");

    fireEvent.change(fruitSelection, { target: { value: "orange"} });

    const seedlessInput = result.getByLabelText("Seedless");

    fireEvent.change(seedlessInput, { target: { value: "true"} });

    expect(result).toMatchSnapshot();    

    const after: any = parse(designInstance);

    expect(after['fruit']['@element']).toBe('orange');
    expect(after['fruit']['seedless']).toBe('true');
})