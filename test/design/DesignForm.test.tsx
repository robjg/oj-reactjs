import React from 'react'
import { render, fireEvent, waitFor, Matcher } from '@testing-library/react'

import { DesignForm } from '../../src/design/designForm'
import { DesignModel, FactoryDesignModel, ArooaType, parse } from '../../src/design/design';

const designDefinitions = require('./data/FruitDesigns.json');
const snackConfiguration = require('./data/FruitConfiguration.json');
const mealsConfiguration = require('./data/MealConfiguration.json');

const notesDesigns = require('./data/NotesDesigns.json');
const notesConfiguration = require('./data/NotesConfiguration.json');

import { LocalDataSource } from './LocalDataSource';

test('Test Render Text Field', () => {
   
    const dataSource: LocalDataSource = new LocalDataSource();
    const designModel: DesignModel = new FactoryDesignModel("foo", dataSource);
        
    dataSource.addDesignDefinitions(designDefinitions);
    dataSource.save("foo", snackConfiguration);

    const result = render(<DesignForm designModel={designModel} hideForm={()=>{}} />);

    expect(result).toMatchSnapshot();    

    const descriptionInput = result.getByLabelText("Description");

    fireEvent.change(descriptionInput, { target: { value: "An Afternoon Snack"} });

    const expand = result.getByTestId("df_fruit_expand");

    fireEvent.click(expand);

    const tasteInput = result.getByLabelText("Taste");

    fireEvent.change(tasteInput, { target: { value: "Tangy"} });

    expect(result).toMatchSnapshot();    

    const form = result.getByTestId("design-form");

    fireEvent.submit(form);

    const after: any = dataSource.configurationFor("foo");

    expect(after['description']).toBe('An Afternoon Snack');
    expect(after['fruit']['taste']).toBe('Tangy');
});

test('Test Render Design Instance', async () => {

    const dataSource: LocalDataSource = new LocalDataSource();
    const designModel: DesignModel = new FactoryDesignModel("foo", dataSource);

    dataSource.addDesignDefinitions(designDefinitions);
    dataSource.save("foo", snackConfiguration);

    const result = render(<DesignForm designModel={designModel} hideForm={()=>{}} />);

    const fruitSelection = result.getByTestId("df_fruit_select");

    fireEvent.change(fruitSelection, { target: { value: "orange"} });

    const expand = result.getByTestId("df_fruit_expand");

    fireEvent.click(expand);

    await waitFor( () => result.getByLabelText("Seedless"));

    const seedlessInput = result.getByLabelText("Seedless");

    fireEvent.change(seedlessInput, { target: { value: "true"} });

    expect(result).toMatchSnapshot();    

    const form = result.getByTestId("design-form");

    fireEvent.submit(form);

    const after: any = dataSource.configurationFor("foo");

    expect(after['fruit']['@element']).toBe('orange');
    expect(after['fruit']['seedless']).toBe('true');
})

test('Test Render Indexed', async () => {

    const dataSource: LocalDataSource = new LocalDataSource();
    const designModel: DesignModel = new FactoryDesignModel("foo", dataSource);

    dataSource.addDesignDefinitions(notesDesigns);
    dataSource.save("foo", notesConfiguration);

    const result = render(<DesignForm designModel={designModel} hideForm={()=>{}} />);

    expect(result).toMatchSnapshot();    

    const row1Selection = result.getByTestId("df_notes_row0_select");

    fireEvent.change(row1Selection, { target: { value: "value"} });

    await waitFor(() => result.getByTestId("df_notes_row0_expand"));
    
    const row1Expand = result.getByTestId("df_notes_row0_expand");

    fireEvent.click(row1Expand)

    const valueInput = result.getByTestId("df_notes_row0_detail_value");
  
    fireEvent.change(valueInput, { target: { value: "Some Foo"} });

    expect(result).toMatchSnapshot();    

    const form = result.getByTestId("design-form");

    fireEvent.submit(form);

    const after: any = dataSource.configurationFor("foo");

    expect(after['@element']).toBe('notes');
    expect(after['notes'][0]['@element']).toBe('value');
    expect(after['notes'][0]['value']).toBe('Some Foo');
    expect(after['notes'][1]['@element']).toBe('note');
    expect(after['notes'][1]['text']).toBe('Mainly fruit');
})
