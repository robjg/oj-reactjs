
export interface FormBuilder<T> {

    renderTextField(textField: TextField): T;

    renderSingleTypeSelection(singleTypeSelection: SingleTypeSelection): T;

    renderFieldGroup(fieldGroup: FieldGroup): T;
}

export interface FormItem {

    accept<T>(formBuilder: FormBuilder<T>): T;
}

interface DesignProperty extends FormItem {

}

class FormItemGroup {

    readonly items: Array<FormItem> = new Array();

    addItem(item: FormItem): FormItemGroup {
        this.items.push(item);
        return this;
    }

}

export class TextField implements DesignProperty {

    readonly property: string;

    readonly title: string;

    value?: string;

    constructor(property: string, title?: string) {
        this.property = property
        this.title = title ? title : property;
    }

    accept<T>(formBuilder: FormBuilder<T>): T {
        return formBuilder.renderTextField(this);
    }

}

export class DesignInstance extends FormItemGroup {

    readonly element: string;

    constructor(element: string) {
        super();
        this.element = element;
    }

}

export class SingleTypeSelection implements DesignProperty {

    readonly title: string

    readonly designFactory: TypeDesignFactory;

    private _instance?: DesignInstance;

    constructor(readonly property: string,
        readonly options: string[],
        designFactory: TypeDesignFactory,
        title?: string,
        instance?: DesignInstance) {

        this.designFactory = designFactory;
        this.title = title ? title : property;
        this._instance = instance;
    }

    get instance() {
        return this._instance;
    }

    change(element: string): void {
        if (element) {
            this._instance = this.designFactory.createDesign(new ElementOnly(element));
        }
        else {
            this._instance = undefined;
        }
    }

    accept<T>(formBuilder: FormBuilder<T>): T {

        return formBuilder.renderSingleTypeSelection(this);
    }

}

export class FieldGroup extends FormItemGroup implements FormItem {

    constructor(readonly title?: string) {
        super();
    }

    accept<T>(formBuilder: FormBuilder<T>): T {

        return formBuilder.renderFieldGroup(this);
    }
}


export class MainForm extends FormItemGroup {

    constructor(readonly instance: DesignInstance,
        readonly saveFn: (instance: DesignInstance) => void) {
        super();
    }

    save(): void {
        this.saveFn(this.instance);
    }
}

export enum ArooaType {
    Component,
    Value
}




interface Configuration {

    readonly element: string;

    getTextValue(property: string): string | undefined;

    getChild(property: string): Configuration | undefined;
}

class ElementOnly implements Configuration {

    readonly element: string;

    constructor(element: string) {
        this.element = element;
    }

    getTextValue(property: string): string | undefined {
        return undefined;
    }

    getChild(property: string): Configuration | undefined {
        return undefined;
    }

}

interface TypeDesignFactory {

    createDesign(configuration: Configuration): DesignInstance;
}

class TypeDesignFactoriesCache implements TypeDesignFactory {

    private readonly factoryByElement: Map<string, TypeDesignFactory> = new Map();

    constructor(private readonly dataSource: (element: string) => any) {

    }

    createDesign(configuration: Configuration): DesignInstance {

        const { element } = configuration;

        if (!element) {
            throw Error(`No element in ${configuration}`)
        }

        let factory = this.factoryByElement.get(element)

        if (!factory) {
            factory = this.dataSource(element)
            if (factory) {
                this.factoryByElement.set(element, factory);
            }
            else {
                throw Error(`No factory for element ${element} `)
            }
        }

        return factory.createDesign(configuration);
    }

}


export interface DesignFactory {

    createDesign(configuration: Configuration, arooaType: ArooaType): DesignInstance;
}

type FormItemFactory = (configuration: Configuration) => FormItem;


export class CachingDesignFactory implements DesignFactory {

    private readonly componentCache: TypeDesignFactoriesCache;

    private readonly valueCache: TypeDesignFactoriesCache;

    constructor(dataSource: (element: string, arooaType: ArooaType) => any) {

        this.componentCache = new TypeDesignFactoriesCache(
            (element) => this.designFactoryFrom(ArooaType.Component, element, dataSource));

        this.valueCache = new TypeDesignFactoriesCache(
            (element) => this.designFactoryFrom(ArooaType.Value, element, dataSource));

    }

    createDesign(configuration: Configuration, arooaType: ArooaType): DesignInstance {

        switch (arooaType) {
            case ArooaType.Component:
                return this.componentCache.createDesign(configuration)
            default:
                return this.valueCache.createDesign(configuration)
        }
    }

    formItemFactoryFrom(definition: any): FormItemFactory {

        let type: string = definition['@element'];
        if (!type) {
            throw new Error("No type.");
        }

        switch (type) {

            case 'design:field':
                {
                    const property: string = definition['property'];
                    const title: string = definition['title'];

                    return (configuration: Configuration) => {
                        const textField = new TextField(property, title ? title : property);
                        textField.value = configuration.getTextValue(property);
                        return textField;
                    }
                }
            case 'design:simple':
                {
                    const property: string = definition['property'];
                    const options: string[] = definition['options'];
                    const title: string = definition['title'];
                    const arooaType: ArooaType = definition['arooaType'];

                    const childFactory = arooaType === ArooaType.Component ?
                        this.componentCache : this.valueCache;

                    return (configuration: Configuration) => {

                        const childInstanceConfConf = configuration.getChild(property);
                        var childInstance;
                        if (childInstanceConfConf) {
                            childInstance = this.createDesign(childInstanceConfConf, arooaType);
                        }

                        const formItem = new SingleTypeSelection(property,
                            options,
                            childFactory,
                            title ? title : property,
                            childInstance
                        );

                        return formItem;
                    }
                }
            case 'design:group':
                {
                    const title = definition['title'];

                    let children: FormItemFactory[] = [];
                    if (definition['items']) {

                        const items: any[] = definition['items'];
                        children = items.map(this.formItemFactoryFrom);
                    }


                    return (configuration: Configuration) => {
                        const fieldGroup = new FieldGroup(title)
                        children.forEach(child => fieldGroup.addItem(child(configuration)));
                        return fieldGroup;
                    }
                }
            case 'design:tabs':
            case 'design:indexed':
            case 'design:mapped':
            default: 'design:variable'
                throw new Error(`Unknown Form Item ${type}.`);
        }
    }

    private designFactoryFrom(arooaType: ArooaType, element: string,
        dataSource: (element: string, arooa: ArooaType) => any): TypeDesignFactory {
        const definition = dataSource(element, arooaType);
        if (definition) {
            return this.createDesignFactory(arooaType, definition);
        }
        else {
            throw Error(`No design for ${arooaType} ${element}`);
        }
    }

    private createDesignFactory(arooaType: ArooaType, definition: any): TypeDesignFactory {

        const element: string = definition['element'];

        const itemDefs = definition['form']['items'] as Array<any>;

        var formItemFactories: Array<FormItemFactory> = [];
        if (itemDefs) {
            formItemFactories = itemDefs.map(e => this.formItemFactoryFrom(e));
        }

        return {
            createDesign(configuration: Configuration): DesignInstance {

                const instance = new DesignInstance(element);

                formItemFactories.forEach(factory => instance.addItem(factory(configuration)));

                return instance;
            }
        };
    }
}

export function configurationFromAny(obj: any): Configuration {

    const element: string = obj['@element'];
    if (!element) {
        throw new Error("No element in " + obj);
    }

    return {

        element: element,

        getTextValue: (property: string): string | undefined => {

            return obj[property];
        },

        getChild: (property: string): Configuration | undefined => {

            const child: any = obj[property];

            if (child) {
                return configurationFromAny(child);
            }
            else {
                return undefined;
            }
        }
    }
}

export function parse(instance: DesignInstance): any {

    const configuration: any = { '@element': instance.element };

    class ParseBuilder implements FormBuilder<void> {

        renderTextField(textField: TextField): void {
            if (textField.value) {
                configuration[textField.property] = textField.value;
            }
        }

        renderSingleTypeSelection(singleTypeSelection: SingleTypeSelection): void {
            if (singleTypeSelection.instance) {
                configuration[singleTypeSelection.property] =
                    parse(singleTypeSelection.instance);
            }
        }

        renderFieldGroup(fieldGroup: FieldGroup): void {
            fieldGroup.items.forEach(e => e.accept(this));
        }

    }

    instance.items.forEach(item => item.accept(new ParseBuilder()));

    return configuration;
}

export interface DesignDataSource {

    designFor(element: string, arooaType: ArooaType): any;

    configurationFor(componentId: string): any;

    save(componentId: string, configuration: any): void;
}


export class DesignModel {

    private readonly factories: DesignFactory;

    constructor(readonly dataSource: DesignDataSource) {
        this.factories = new CachingDesignFactory(
            (element: string, arooaType: ArooaType) => dataSource.designFor(element, arooaType));
    }

    createForm(componentId: string): MainForm {

        const configuration: any = this.dataSource.configurationFor(componentId);

        const designInstance = this.factories.createDesign(
            configurationFromAny(configuration), ArooaType.Component);

        return new MainForm(designInstance,
            (instance) => this.dataSource.save(componentId, parse(instance)));
    }
}