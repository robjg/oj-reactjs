import React from 'react';
import * as design from './design';
import { render } from '@testing-library/react';

function Field(props: { 
    formItem: design.FormItem;
    formBuilder: CompFormBuilder;
}) {

    const TheField = props.formItem.accept(props.formBuilder);

    return <TheField />
}

function FieldGroup(props: { 
    formItems: design.FormItem[];
    formBuilder: CompFormBuilder;
 }) {

    return (
        <ul className="oj-form-group">
            {
                props.formItems.map((item, index) =>
                    <Field key={index} formItem={item} formBuilder={props.formBuilder}/>)
            }
        </ul>
    )
}

class CompFormBuilder implements design.FormBuilder<React.ComponentClass<any, any>> {

    readonly level: number;

    constructor(level: number = 0) {
        this.level = level;
    }

    private fieldId(property: string): string {
        return `df_${property}_${this.level}`;
    }

    renderTextField(textField: design.TextField): React.ComponentClass<any, any> {

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
                    <li>
                        <label htmlFor={fieldId}>{title}</label>
                        <input type="text" id={fieldId} value={this.state.value || ''}
                            onChange={this.handleChange} />
                    </li>
                );
            }
        };
    }

    renderSingleTypeSelection(singleTypeSelection: design.SingleTypeSelection): React.ComponentClass<any, any> {

        const fieldId = this.fieldId(singleTypeSelection.property);
        const title = singleTypeSelection.title;

        const level = this.level;

        return class extends React.Component<{}, any> {

            constructor(props: {}) {
                super(props);

                this.state = { selection: singleTypeSelection.instance?.element }
                this.handleChange = this.handleChange.bind(this);
            }

            handleChange(event: React.FormEvent<HTMLSelectElement>): void {
                const value = event.currentTarget.value;
                singleTypeSelection.change(value);
                this.setState({ selection: singleTypeSelection.instance?.element })
            }

            render() {

                let childForm;

                if (singleTypeSelection.instance) {
                    childForm = <InternalForm designInstance={singleTypeSelection.instance}
                        level={level + 1}/>
                }

                return (
                    <li>
                        <label htmlFor={fieldId}>{title}</label>
                        <select id={fieldId}
                            value={this.state.selection}
                            onChange={this.handleChange}>
                            {
                                singleTypeSelection.options.map(
                                    e => <option key={e} value={e}>{e}</option>)
                            }
                        </select>
                        { childForm }
                    </li>
                );
            }
        }
    }

    renderFieldGroup(fieldGroup: design.FieldGroup): React.ComponentClass<any, any> {

        const formBuilder = new CompFormBuilder(this.level + 1);

        return class extends React.Component<any, any> {

            render() {
                return (
                    <FieldGroup formItems={fieldGroup.items} formBuilder={formBuilder}/>
                );
            }
        };
    }
}

type DesignFormProps = {
    designInstance: design.DesignInstance;
    level?: number;
}

class InternalForm extends React.Component<DesignFormProps> {

    formBuilder: CompFormBuilder;

    constructor(props: DesignFormProps) {
        super(props);
        this.formBuilder = new CompFormBuilder(props.level ? props.level : 0);
    }

    render(): React.ReactNode {

        return (

            <div className="oj-design-form">
                <h4 className="oj-design-form-title">{this.props.designInstance.element}</h4>
                <FieldGroup formItems={this.props.designInstance.items} 
                        formBuilder={this.formBuilder}/>
            </div>
        )
    }

}

export class DesignForm extends React.Component<DesignFormProps> {

    constructor(props: DesignFormProps) {
        super(props);
    }

    render(): React.ReactNode {

        return (
            <div className="oj-design-form-main">
                <form>
                    <InternalForm designInstance={this.props.designInstance}/>
                </form>
            </div>
        )
    }

}

