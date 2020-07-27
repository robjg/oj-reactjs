
export interface FormBuilder<T> {

    renderTextField(textField: TextField): T;

    renderSingleTypeSelection(singleTypeSelection: SingleTypeSelection): T;

    renderFieldGroup(fieldGroup: FieldGroup): T;

    renderIndexedMultiType(indexedMultiType: IndexedMultiTypeTable): T;

    renderMappedMultiType(mappedMultiType: MappedMultiTypeTable): T;
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

    constructor(readonly element: string,
        readonly inlineable?: boolean) {
        super();
    }

}

export class SingleTypeSelection implements DesignProperty {

    private _instance?: DesignInstance;

    constructor(readonly property: string,
        readonly options: string[],
        readonly designFactory: TypeDesignFactory,
        readonly title?: string,
        instance?: DesignInstance) {

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

export class IndexedMultiTypeTable implements DesignProperty {

    private _instances: DesignInstance[] = []

    onChange?: (instaces: DesignInstance[]) => void;

    constructor(readonly property: string,
        readonly options: string[],
        readonly designFactory: TypeDesignFactory,
        readonly title?: string) {

    }

    get instances() {
        return this._instances;
    }

    add(instance: DesignInstance) {
        this._instances.push(instance);
    }

    change(index: number, element: string) {

        if (element) {
            const instance: DesignInstance = this.designFactory.createDesign(new ElementOnly(element));
            if (index > this._instances.length) {
                this._instances.push(instance);
            }
            else {
                this._instances[index] = instance;
            }
        }
        else {
            this._instances.splice(index, 1);
        }
        this.onChange && this.onChange(this._instances);
    }

    accept<T>(formBuilder: FormBuilder<T>): T {

        return formBuilder.renderIndexedMultiType(this);
    }

}

export class MappedMultiTypeTable implements DesignProperty {

    private _instances: { key: string | undefined, instance: DesignInstance | undefined }[] = [];

    onChange?: (instances: { key: string | undefined, instance: DesignInstance | undefined }[]) => void;

    pendingKey?: string;

    constructor(readonly property: string,
        readonly options: string[],
        readonly designFactory: TypeDesignFactory,
        readonly title?: string) {
    }

    get instances() {
        return this._instances;
    }

    add(key: string, instance: DesignInstance) {
        this._instances.push({ key: key, instance: instance });
    }

    changeTheKey(index: number, key: string) {

        if (index == this._instances.length) {
            this.pendingKey = key;
            console.log(key);
        }
        else {
            this._instances[index] = { key: key, instance: this._instances[index].instance };
            this.onChange && this.onChange(this._instances);
        }
    }

    changeTheInstance(index: number, element: string) {

        if (element) {
            const instance: DesignInstance = this.designFactory.createDesign(new ElementOnly(element));
            if (index == this._instances.length) {
                this._instances.push({ key: this.pendingKey, instance: instance });
                this.pendingKey = undefined;
            }
            else {
                this._instances[index] = { key: this._instances[index].key, instance: instance };
            }
        }
        else {
            this._instances.splice(index, 1);
            this.pendingKey = undefined;
        }
        this.onChange && this.onChange(this._instances);
    }

    accept<T>(formBuilder: FormBuilder<T>): T {

        return formBuilder.renderMappedMultiType(this);
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

    getChildArray(property: string): Configuration[] | undefined;
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

    getChildArray(property: string): Configuration[] | undefined {
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
                throw Error(`No factory for element ${element}`)
            }
        }

        return factory.createDesign(configuration);
    }

}

function elementDefinitionFrom(definition: any): {
    property: string;
    options: string[];
    title?: string;
    arooaType?: ArooaType;
} {

    const property: string = definition['property'];
    if (!property) {
        throw new Error(`No property in design definition ${JSON.stringify(definition)}`)
    }

    const options: string[] = definition['options'];
    if (!options) {
        throw new Error(`No options in design definition ${JSON.stringify(definition)}`)
    }
    const title: string = definition['title'];

    const arooaType: ArooaType | undefined = (<any>ArooaType)[definition['arooaType']];

    return {
        property: property,
        options: options,
        title: title,
        arooaType: arooaType
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

    createDesign(configuration: Configuration, arooaType?: ArooaType): DesignInstance {

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

            case 'design:text':
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
                    const { property, options, title, arooaType } = elementDefinitionFrom(definition);

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
            case 'design:tabs':
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
            case 'design:indexed':
                {
                    const { property, options, title, arooaType } = elementDefinitionFrom(definition);

                    const childFactory = arooaType === ArooaType.Component ?
                        this.componentCache : this.valueCache;

                    return (configuration: Configuration) => {

                        const formItem = new IndexedMultiTypeTable(property,
                            options,
                            childFactory,
                            title ? title : property);

                        const childInstanceConf = configuration.getChildArray(property);

                        if (childInstanceConf) {
                            childInstanceConf.forEach(e => {
                                const instance: DesignInstance = this.createDesign(e, arooaType);
                                formItem.add(instance);
                            })
                        }

                        return formItem;
                    }
                }
            case 'design:mapped':
                {
                    const { property, options, title, arooaType } = elementDefinitionFrom(definition);

                    const childFactory = arooaType === ArooaType.Component ?
                        this.componentCache : this.valueCache;

                    return (configuration: Configuration) => {

                        const formItem = new MappedMultiTypeTable(property,
                            options,
                            childFactory,
                            title ? title : property);

                        const childInstanceConf = configuration.getChildArray(property);

                        if (childInstanceConf) {
                            childInstanceConf.forEach(e => {
                                const instance: DesignInstance = this.createDesign(e, arooaType);
                                const key = e.getTextValue('@key');
                                if (!key) {
                                    throw new Error("No key");
                                }
                                formItem.add(key, instance);
                            })
                        }

                        return formItem;
                    }
                }
            case 'design:variable':
            default:
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

        if (arooaType == ArooaType.Component) {
            const idFactory: FormItemFactory =
                (configuration: Configuration) => {
                    const textField = new TextField("id", "Id");
                    textField.value = configuration.getTextValue("id");
                    return textField;
                };
            formItemFactories = [idFactory, ...formItemFactories];
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
        throw new Error(`No @element in ${JSON.stringify(obj)}`);
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
        },

        getChildArray: (property: string): Configuration[] | undefined => {

            const child = obj[property];

            if (!child) {
                return undefined;
            }

            if (!Array.isArray) {
                throw new Error(`${property} of ${JSON.stringify(obj)} is not an array`);
            }

            return child.map(configurationFromAny);
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

        renderIndexedMultiType(indexedMultiType: IndexedMultiTypeTable): void {
            const list: any[] = indexedMultiType.instances.map(parse);
            if (list.length > 0) {
                configuration[indexedMultiType.property] = list;
            }
        }

        renderMappedMultiType(mappedMultiType: MappedMultiTypeTable): void {
            const list: any[] = mappedMultiType.instances.map(
                (e: { key: string | undefined, instance: DesignInstance | undefined }) => {
                    if (e.key && e.instance) {
                        const obj: any = parse(e.instance);
                        obj['@key'] = e.key;
                        return obj;
                    }
                    else {
                        return undefined;
                    }
                })
                .filter(e => e);

            if (list.length > 0) {
                configuration[mappedMultiType.property] = list;
            }
        }
    }

    instance.items.forEach(item => item.accept(new ParseBuilder()));

    return configuration;
}

export interface DesignDataSource {

    designFor(element: string, arooaType: ArooaType): Promise<any>;

    configurationFor(componentId: string): Promise<any>;

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