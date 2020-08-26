
import fs from 'fs';

import { FormParser, DesignInstance, NewDesignFactory, ArooaType } from '../../src/design/design'

test("Sequential Form Example", () => {

    const formConfiguration = JSON.parse(fs.readFileSync('test/design/data/SequentialForm.json', 'utf8'));

    const designFactory: NewDesignFactory = {
        newDesign(element: string, arooaType: ArooaType) : DesignInstance {
            return new DesignInstance(element);
        }
    }

    const formParser = new FormParser(designFactory); 

    const instance: DesignInstance = formParser.parseFormDefinition(formConfiguration);

    expect(instance.element).toBe("sequential");
    expect(instance.items.length).toBe(4);
});