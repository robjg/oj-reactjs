
import fs from 'fs';

import { FormParser, DesignInstance, IndexedMultiTypeTable, FieldGroup } from '../../src/design/design'

test("Sequential Form Example", () => {

    const formConfiguration = JSON.parse(fs.readFileSync('test/design/data/SequentialForm.json', 'utf8'));

    const newForm = (element: string, isComponent: boolean) =>
    ({
        "@element": "forms:mainForm"
    })

    const formParser = new FormParser(newForm); 

    const instance: DesignInstance = formParser.parseFormDefinition(formConfiguration);

    expect(instance.element).toBe("sequential");
    expect(instance.items.length).toBe(4);

    const item3 = instance.items[3];
    expect(item3).toBeInstanceOf(FieldGroup);

    const fieldGroup: FieldGroup = item3 as FieldGroup;

    expect(fieldGroup.items.length).toBe(1);

    const item3_1 = fieldGroup.items[0];

    expect(item3_1).toBeInstanceOf(IndexedMultiTypeTable);

    const indexedItems : IndexedMultiTypeTable = item3_1 as IndexedMultiTypeTable;

    const instance1: DesignInstance = indexedItems.instances[0];

    expect(instance1.element).toBe("echo");

    const options: string[] = indexedItems.options;

    expect(options).toEqual(expect.arrayContaining(['is', 'bean', 'echo']));
});
