import fs from 'fs';

import { DesignModel, FormBuilder, MainForm, TextField, SingleTypeSelection, FieldGroup, ArooaType } from '../../src/design/design'
import { LocalDataSource } from './LocalDataSource'

class StubFormBuilder implements FormBuilder<void> {
    renderForm(mainForm: MainForm): void {
        throw new Error("Method not implemented.");
    }
    renderTextField(textField: TextField): void {
        throw new Error("Method not implemented.");
    }
    renderSingleTypeSelection(singleTypeSelection: SingleTypeSelection): void {
        throw new Error("Method not implemented.");
    }
    renderFieldGroup(fieldGroup: FieldGroup): void {
        throw new Error("Method not implemented.");
    }
}
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

    const designModel : DesignModel = new DesignModel(dataSource);

    const form: MainForm = designModel.createForm("fruit");

    const result: any = form.instance;

    expect(result.element).toBe('apple');

    const textField : any = result.items[0]; 

    expect(textField['title']).toBe('Colour');
    expect(textField['value']).toBe('red');

})

test('Design JSON from File', () => {

    const designDefinitions = JSON.parse(fs.readFileSync('test/design/data/FruitDesigns.json', 'utf8'));
    const configuration = JSON.parse(fs.readFileSync('test/design/data/FruitConfiguration.json', 'utf8'));

    const dataSource: LocalDataSource = new LocalDataSource();

    dataSource.addDesignDefinitions(designDefinitions);
    dataSource.save("foo", configuration);

    const result: any = {};

    class OurBuilder extends StubFormBuilder {

        renderForm(mainForm: MainForm): void {
            result.element = mainForm.instance.element;
            result.items = mainForm.instance.items;
        }
    }

    expect(result.element).toBe('snack');
}) 

