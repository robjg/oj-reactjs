import React from 'react'
import { render, fireEvent } from '@testing-library/react'

import { DesignForm } from '../../src/design/designForm'
import { DesignModel, TextField, SingleTypeSelection, CachingDesignFactory, configurationFromAny, ArooaType, parse } from '../../src/design/design';

const designDefinitions = require('./data/FruitDesigns.json');
const configuration = require('./data/FruitConfiguration.json');

import { LocalDataSource } from './LocalDataSource';

test('Test Render Text Field', () => {
   
    const dataSource: LocalDataSource = new LocalDataSource();
    const designModel: DesignModel = new DesignModel(dataSource);
        
    dataSource.addDesignDefinitions(designDefinitions);
    dataSource.save("foo", configuration);

    const result = render(<DesignForm designModel={designModel} componentId="foo" hideForm={()=>{}} />);

    expect(result).toMatchSnapshot();    

    const descriptionInput = result.getByLabelText("Description");

    fireEvent.change(descriptionInput, { target: { value: "An Afternoon Snack"} });

    const tasteInput = result.getByLabelText("Taste");

    fireEvent.change(tasteInput, { target: { value: "Tangy"} });

    expect(result).toMatchSnapshot();    

    const okButton = result.getByText("OK");

    fireEvent.click(okButton);

    const after: any = dataSource.configurationFor("foo");

    expect(after['description']).toBe('An Afternoon Snack');
    expect(after['fruit']['taste']).toBe('Tangy');
});

test('Test Render Design Instance', () => {

    const dataSource: LocalDataSource = new LocalDataSource();
    const designModel: DesignModel = new DesignModel(dataSource);

    dataSource.addDesignDefinitions(designDefinitions);
    dataSource.save("foo", configuration);

    const result = render(<DesignForm designModel={designModel} componentId="foo" hideForm={()=>{}} />);

    const fruitSelection = result.getByLabelText("Fruit");

    fireEvent.change(fruitSelection, { target: { value: "orange"} });

    const seedlessInput = result.getByLabelText("Seedless");

    fireEvent.change(seedlessInput, { target: { value: "true"} });

    expect(result).toMatchSnapshot();    

    const okButton = result.getByText("OK");

    fireEvent.click(okButton);

    const after: any = dataSource.configurationFor("foo");

    expect(after['fruit']['@element']).toBe('orange');
    expect(after['fruit']['seedless']).toBe('true');
})