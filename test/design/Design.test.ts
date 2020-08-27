import fs from 'fs';

import { DesignModel, FactoryDesignModel,  MainForm, ArooaType } from '../../src/design/design'
import { LocalDataSource } from './LocalDataSource'

test('Test Form Item From Field', () => {

    const dataSource: LocalDataSource = new LocalDataSource();

    const designDefinition = {
        '@element': 'design:design',
        'element': 'apple',
        'form': {
            'items': [
                {
                    '@element': 'design:field',
                    'property': 'colour',
                    'title': 'Colour'
                }
            ]
        }
    };
    
    dataSource.addDesignDefinition(ArooaType.Component, designDefinition)

    const configuration = {
        '@element': 'apple',
        'colour' : 'red'
    };

    dataSource.save("fruit", configuration);

    const designModel : DesignModel = new FactoryDesignModel("fruit", dataSource);

    const form: MainForm = designModel.createForm();

    const result: any = form.instance;

    expect(result.element).toBe('apple');

    const idField : any = result.items[0]; 

    expect(idField['title']).toBe('Id');

    const textField : any = result.items[1]; 

    expect(textField['title']).toBe('Colour');
    expect(textField['value']).toBe('red');
})

test('Design JSON from File', () => {

    const designDefinitions = JSON.parse(fs.readFileSync('test/design/data/FruitDesigns.json', 'utf8'));
    const configuration = JSON.parse(fs.readFileSync('test/design/data/FruitConfiguration.json', 'utf8'));

    const dataSource: LocalDataSource = new LocalDataSource();

    dataSource.addDesignDefinitions(designDefinitions);
    dataSource.save("foo", configuration);

    const designModel : DesignModel = new FactoryDesignModel("foo", dataSource);

    const form: MainForm = designModel.createForm();

    const result: any = form.instance;
    
    expect(result.element).toBe('snack');
    expect(result.items.length).toBe(3);
}) 

