import React, { ReactNode, useState } from 'react'
import { render, fireEvent, within, getByText } from '@testing-library/react'
import '@testing-library/jest-dom/extend-expect'

import { KeyedInstanceRow, InstanceRow } from '../../src/design/designForm'
import { DesignInstance, TextField } from '../../src/design/design';

function createFactory(): Map<string, DesignInstance> {

    const factory: Map<string, DesignInstance> = new Map();

    const apple = new DesignInstance('apple');
    apple.addItem(new TextField("colour"));

    factory.set('apple', apple);

    const orange = new DesignInstance('orange');
    orange.addItem(new TextField("seedless"));

    factory.set('orange', orange);

    return factory;
}

function SomeProperty(props: any) {

    const factory: Map<string, DesignInstance> = createFactory();

    const [instance, setInstance] = useState(factory.get('apple'));

    const changeTheInstance = (selected: string) => {
        setInstance(factory.get(selected));
    }

    const factoryKeys: string[] = Array.from(factory.keys());

    return <div>
        <p>The instance is {instance?.element}</p>
                <InstanceRow
                    instance={instance}
                    options={factoryKeys}
                    changeTheInstance={changeTheInstance}
                    idPrefix="foo" />
    </div>
}

test('Test Render Some Property', () => {

    const result = render(<SomeProperty />);

    expect(result).toMatchSnapshot();

    const expand = result.getByTestId("foo_expand");

    fireEvent.click(expand);

    expect(result).toMatchSnapshot();

     expect(result.getByTestId("foo_detail_colour")).toBeInTheDocument();

    const select = result.getByTestId("foo_select");

    fireEvent.change(select, { target: { value: "orange" } });

    expect(result).toMatchSnapshot();

    expect(result.getByText("The instance is orange")).toBeInTheDocument();
})

function SomeKeyedProperty(props: any) {

    const factory: Map<string, DesignInstance> = createFactory();

    const [instance, setInstance] = useState(factory.get('apple'));
    const [theKey, setTheKey] = useState('fruit');

    const changeTheKey = (theKey: string) => {
        setTheKey(theKey)
    }

    const changeTheInstance = (selected: string) => {
        setInstance(factory.get(selected));
    }

    const factoryKeys: string[] = Array.from(factory.keys());

    return <div>
        <p>Key is {theKey} and the instance is {instance?.element}</p>
                <KeyedInstanceRow
                    theKey={theKey}
                    instance={instance}
                    options={factoryKeys}
                    changeTheKey={changeTheKey}
                    changeTheInstance={changeTheInstance}
                    idPrefix="foo" />
    </div>
}

test('Test Render Some Key Property', () => {

    const result = render(<SomeKeyedProperty />);

    expect(result).toMatchSnapshot();

    const expand = result.getByTestId("foo_expand");

    fireEvent.click(expand);

    expect(result).toMatchSnapshot();

    expect(result.getByTestId("foo_detail_colour")).toBeInTheDocument();

    const select = result.getByTestId("foo_select");

    fireEvent.change(select, { target: { value: "orange" } });

    const key = result.getByTestId("foo_key");

    fireEvent.change(key, { target: { value: "snack" } })

    expect(result).toMatchSnapshot();

    expect(result.getByText("Key is snack and the instance is orange")).toBeInTheDocument();
})

