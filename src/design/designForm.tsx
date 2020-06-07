import React from 'react';
import { DesignInstance, FormItem, FormBuilder, TextField, SingleTypeSelection, IndexedMultiTypeTable, FieldGroup, MappedMultiTypeTable, DesignModel } from './design';

import { render, fireEvent, Matcher } from '@testing-library/react'

const TESTING: boolean = typeof test === 'function' ? true : false;

function when<T, U>(t: T, fn: (t: T) => U): U | undefined {
    if (t) {
        return fn(t);
    }
    else {
        return undefined;
    }
}

function whenTesting<T>(fn: () => T): T | undefined {
    return TESTING ? fn() : undefined;
}

function Field(props: {
    formItem: FormItem;
    formBuilder: CompFormBuilder;
}) {

    const TheField = props.formItem.accept(props.formBuilder);

    return <li>
        <TheField />
    </li>
}

function FormGroup(props: {
    formItems: FormItem[];
    formBuilder: CompFormBuilder;
}) {

    return (
        <ul className="oj-form-group">
            {
                props.formItems.map((item, index) =>
                    <Field key={index} formItem={item} formBuilder={props.formBuilder} />)
            }
        </ul>
    )
}

type InstanceButtonProps = {
    handleChange: (expanded: boolean) => void;
    expanded: boolean;
    instance?: DesignInstance;
    idPrefix: string;
}

class InstanceButton extends React.Component<InstanceButtonProps, {}> {

    render() {

        const buttonTestId = whenTesting(() => this.props.idPrefix + "_expand");


        if (this.props.instance) {
            if (this.props.expanded) {
                return (<button type="button"
                    onClick={(e) => this.props.handleChange(false)}
                    data-testid={buttonTestId}>-</button>)
            }
            else {
                return (<button type="button"
                    onClick={(e) => this.props.handleChange(true)}
                    data-testid={buttonTestId}>+</button>)
            }
        }
        else {
            return null;
        }

    }
}

type InstanceDetailProps = {
    instance?: DesignInstance;
    idPrefix: string;
}

class InstanceDetail extends React.Component<InstanceDetailProps, {}> {

    render() {
        if (this.props.instance) {
            return <InternalForm designInstance={this.props.instance}
                idPrefix={this.props.idPrefix + "_detail"} />
        }
        else {
            return null;
        }
    }
}

type InstanceSelectionProps = {
    selected?: string;
    options: string[];
    changeFn: (value: string) => void;
    idPrefix: string;
}

class InstanceSelection extends React.Component<InstanceSelectionProps, {}> {

    constructor(props: InstanceSelectionProps) {
        super(props);
        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(event: React.FormEvent<HTMLSelectElement>): void {
        this.props.changeFn(event.currentTarget.value);
    }

    render() {

        const selectTestId = whenTesting(() => this.props.idPrefix + "_select");

        const options: string[] = ['', ...this.props.options];

        return (
            <>
                <select
                    value={this.props.selected}
                    onChange={this.handleChange}
                    data-testid={selectTestId}>
                    {
                        options.map(
                            e => <option key={e} value={e}>{e}</option>)
                    }
                </select>
            </>
        );
    }
}

type KeyFieldProps = {
    theKey?: string;
    changeFn: (key: string) => void;
    idPrefix: string;
}

class KeyField extends React.Component<KeyFieldProps, {}> {

    constructor(props: KeyFieldProps) {
        super(props);

        this.handleChange = this.handleChange.bind(this);
    }

    handleChange(event: React.FormEvent<HTMLInputElement>): void {
        this.props.changeFn(event.currentTarget.value);
    }

    render() {

        const keyTestId =
            whenTesting(() => this.props.idPrefix + "_key");

        return (
            <>
                <input type="text" value={this.props.theKey}
                    onChange={this.handleChange}
                    data-testid={keyTestId} />
            </>
        );
    }
}

type KeyedInstanceRowProps = {
    theKey?: string;
    instance?: DesignInstance;
    options: string[];
    changeTheKey: (key: string) => void;
    changeTheInstance: (value: string) => void;
    idPrefix: string;
}

export class KeyedInstanceRow extends React.Component<KeyedInstanceRowProps, { expanded: boolean }> {

    constructor(props: KeyedInstanceRowProps) {
        super(props);
        this.state = { expanded: false };
        this.expand = this.expand.bind(this);
    }

    expand(expand: boolean): void {
        this.setState({ expanded: expand });
    }

    render() {
        return (
            <>
                <div className="oj-design-row">
                    <span className="oj-design-key">
                        <KeyField
                            theKey={this.props.theKey}
                            changeFn={this.props.changeTheKey}
                            idPrefix={this.props.idPrefix} />
                    </span>
                    <span className="oj-design-select">
                        <InstanceSelection
                            changeFn={this.props.changeTheInstance}
                            idPrefix={this.props.idPrefix}
                            options={this.props.options}
                            selected={this.props.instance?.element} />
                    </span>
                    <span className="oj-design-expand">
                        <InstanceButton
                            expanded={this.state.expanded}
                            instance={this.props.instance}
                            handleChange={this.expand}
                            idPrefix={this.props.idPrefix} />
                    </span>
                </div>
                <div className="oj-design-detail">
                    <InstanceDetail
                        instance={this.state.expanded ? this.props.instance : undefined}
                        idPrefix={this.props.idPrefix} />
                </div>
            </>
        );
    }
}

type InstanceRowProps = {
    instance?: DesignInstance;
    options: string[];
    changeTheInstance: (value: string) => void;
    idPrefix: string;
}

export class InstanceRow extends React.Component<InstanceRowProps, { expanded: boolean }> {

    constructor(props: KeyedInstanceRowProps) {
        super(props);
        this.state = { expanded: false };
        this.expand = this.expand.bind(this);
    }

    expand(expand: boolean): void {
        this.setState({ expanded: expand });
    }

    render() {
        return (
            <>
                <div className="oj-design-row">
                    <span className="oj-design-select">
                        <InstanceSelection
                            changeFn={this.props.changeTheInstance}
                            idPrefix={this.props.idPrefix}
                            options={this.props.options}
                            selected={this.props.instance?.element} />
                    </span>
                    <span className="oj-design-expand">
                        <InstanceButton
                            expanded={this.state.expanded}
                            instance={this.props.instance}
                            handleChange={this.expand}
                            idPrefix={this.props.idPrefix} />
                    </span>
                </div>
                <div className="oj-design-detail">
                    <InstanceDetail
                        instance={this.state.expanded ? this.props.instance : undefined}
                        idPrefix={this.props.idPrefix} />
                </div>
            </>
        );
    }
}

class CompFormBuilder implements FormBuilder<React.ComponentClass<any, any>> {

    constructor(readonly idPrefix: string) {
    }

    private fieldId(property: string): string {
        return `${this.idPrefix}_${property}`;
    }

    renderTextField(textField: TextField): React.ComponentClass<any, any> {

        const { title, property } = textField;
        const fieldId: string = this.fieldId(property);

        return class extends React.Component<any, any> {

            constructor(props: {}) {
                super(props);

                this.state = { value: textField.value }
                this.handleChange = this.handleChange.bind(this);
            }

            handleChange(event: React.FormEvent<HTMLInputElement>): void {
                const value = event.currentTarget.value;
                textField.value = value;
                this.setState({ value: textField.value });
            }

            render() {
                return (
                    <label>{title}
                        <input type="text" value={this.state.value || ''}
                            onChange={this.handleChange}
                            data-testid={whenTesting(() => fieldId)} />
                    </label>
                );
            }
        };
    }

    renderSingleTypeSelection(singleTypeSelection: SingleTypeSelection): React.ComponentClass<any, any> {

        const fieldId = this.fieldId(singleTypeSelection.property);
        const title = singleTypeSelection.title;

        return class extends React.Component<{}, any> {

            constructor(props: {}) {
                super(props);

                this.state = { selection: singleTypeSelection.instance?.element }
                this.handleChange = this.handleChange.bind(this);
            }

            handleChange(value: string): void {
                singleTypeSelection.change(value);
                this.setState({ selection: singleTypeSelection.instance?.element })
            }

            render() {

                let childForm;

                if (singleTypeSelection.instance) {
                    childForm = <InternalForm designInstance={singleTypeSelection.instance}
                        idPrefix={fieldId} />
                }

                return (
                    <label >{title}
                        <InstanceRow
                            instance={singleTypeSelection.instance}
                            options={singleTypeSelection.options}
                            changeTheInstance={this.handleChange}
                            idPrefix={fieldId} />
                    </label>
                );
            }
        }
    }

    renderFieldGroup(fieldGroup: FieldGroup): React.ComponentClass<any, any> {

        const formBuilder = new CompFormBuilder(this.idPrefix + 1);

        return class extends React.Component<any, any> {

            render() {
                return (
                    <FormGroup formItems={fieldGroup.items} formBuilder={formBuilder} />
                );
            }
        };
    }

    renderIndexedMultiType(indexedMultiType: IndexedMultiTypeTable): React.ComponentClass<any, any> {

        const fieldId = this.fieldId(indexedMultiType.property);

        const title = indexedMultiType.title;

        return class extends React.Component<any, { rows: DesignInstance[] }> {

            constructor(props: any) {
                super(props);
                this.state = { rows: indexedMultiType.instances };
                indexedMultiType.onChange = (instances) => this.setState({ rows: instances });
            }

            render() {

                return (
                    <div className="oj-design-form-table">
                        <div className="oj-design-form-table-title">{title}</div>
                        <ul>
                            {
                                this.state.rows.map(
                                    (e, i) =>
                                        <li key={i}>
                                            <InstanceRow

                                                instance={e}
                                                options={indexedMultiType.options}
                                                changeTheInstance={value => indexedMultiType.change(i, value)}
                                                idPrefix={fieldId + "_row" + i} />
                                        </li>)
                            }
                            <li key={indexedMultiType.instances.length}>
                                <InstanceRow

                                    changeTheInstance={value =>
                                        indexedMultiType.change(indexedMultiType.instances.length, value)}
                                    options={indexedMultiType.options}
                                    idPrefix={fieldId + "_xRow"} />
                            </li>
                        </ul>
                    </div>
                )
            }
        };
    }

    renderMappedMultiType(mappedMultiType: MappedMultiTypeTable): React.ComponentClass<any, any> {

        const fieldId = this.fieldId(mappedMultiType.property);

        const title = mappedMultiType.title;

        return class extends React.Component<any,
            { rows: { key: string | undefined, instance: DesignInstance | undefined }[] }> {

            constructor(props: any) {
                super(props);
                this.state = { rows: mappedMultiType.instances };
                mappedMultiType.onChange = (rows: { key: string | undefined, instance: DesignInstance | undefined }[]) =>
                    this.setState({ rows: rows });
            }

            render() {
                return (
                    <div className="oj-design-form-table">
                        <div className="oj-design-form-table-title">{title}</div>
                        <ul>
                            {
                                this.state.rows.map(
                                    (e, i) =>
                                        <li key={i}>
                                            <KeyedInstanceRow
                                                theKey={e.key}
                                                instance={e.instance}
                                                options={mappedMultiType.options}
                                                changeTheKey={k => mappedMultiType.changeTheKey(i, k)}
                                                changeTheInstance={v => mappedMultiType.changeTheInstance(i, v)}
                                                idPrefix={fieldId + "_row" + i} />
                                        </li>)
                            }
                            <li key={mappedMultiType.instances.length}>
                                <KeyedInstanceRow
                                    options={mappedMultiType.options}
                                    changeTheKey={k => mappedMultiType.changeTheKey(mappedMultiType.instances.length, k)}
                                    changeTheInstance={v => mappedMultiType.changeTheInstance(mappedMultiType.instances.length, v)}
                                    idPrefix={fieldId + "_xRow"} />
                            </li>
                        </ul>
                    </div>
                )
            }
        };
    }
}

type InternalFormProps = {
    designInstance: DesignInstance;
    idPrefix: string;
}

class InternalForm extends React.Component<InternalFormProps> {

    formBuilder: CompFormBuilder;

    constructor(props: InternalFormProps) {
        super(props);
        this.formBuilder = new CompFormBuilder(props.idPrefix);
    }

    render(): React.ReactNode {

        return (
            <div className="oj-design-internal-form">
                <FormGroup formItems={this.props.designInstance.items}
                    formBuilder={this.formBuilder} />
            </div>
        )
    }
}

type DesignFormProps = {
    designModel: DesignModel;
    componentId: string;
    hideForm: () => void;
}

export class DesignForm extends React.Component<DesignFormProps> {

    constructor(props: DesignFormProps) {
        super(props);
    }

    render(): React.ReactNode {

        const formBuilder = new CompFormBuilder("df");

        const mainForm = this.props.designModel.createForm(this.props.componentId);

        function saveFn(e: React.FormEvent<HTMLFormElement>): void {
            e.preventDefault();
            mainForm.save()
        }

        return (
            <div className="oj-design-form-main">
                <form data-testid="design-form" onReset={this.props.hideForm} onSubmit={saveFn}>
                    <div className="oj-design-form">
                        <h4 className="oj-design-form-title">{mainForm.instance.element}</h4>
                        <FormGroup formItems={mainForm.instance.items}
                            formBuilder={formBuilder} />
                    </div>
                    <button type="submit">OK</button>
                    <button type="reset">Cancel</button>
                </form>
            </div>
        )
    }
}

