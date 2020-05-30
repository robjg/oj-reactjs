import fs from 'fs';

import { CachingDesignFactory, ArooaType, configurationFromAny, DesignInstance, FormItem } from '../../src/design/design'


test('Test Form Item From Field', () => {

    var designFactory = new CachingDesignFactory();

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
    
    designFactory.addDesignDefinition(ArooaType.Value, designDefinition)

    const configuration = {
        '@element': 'apple',
        'colour' : 'red'
    };

    const result: DesignInstance = designFactory.createDesign(configurationFromAny(configuration),
        ArooaType.Value);

        
    expect(result.element).toBe('apple');

    const textField : any = result.items[0]; 

    expect(textField['title']).toBe('Colour');
    expect(textField['value']).toBe('red');

})

test('Design JSON from File', () => {

    const designDefinitions = JSON.parse(fs.readFileSync('test/design/data/FruitDesigns.json', 'utf8'));
    const configuration = JSON.parse(fs.readFileSync('test/design/data/FruitConfiguration.json', 'utf8'));

    const factories: CachingDesignFactory = new CachingDesignFactory();

    factories.addDesignDefinitions(designDefinitions);

    const designInstance: DesignInstance = factories.createDesign(
        configurationFromAny(configuration), ArooaType.Component);

    expect(designInstance.element).toBe('snack');
}) 

