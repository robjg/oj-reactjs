
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
        readonly newDesign: NewTypeDesignFactory,
        readonly title?: string,
        instance?: DesignInstance) {

        this._instance = instance;
    }

    get instance() {
        return this._instance;
    }

    async change(element: string): Promise<DesignInstance | undefined> {

        const promise: Promise<DesignInstance | undefined> = 
            element ? 
            this.newDesign(element) : 
            Promise.resolve(undefined);

        const instance = await promise;
        return this._instance = instance;
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
        readonly newDesign: NewTypeDesignFactory,
        readonly title?: string) {

    }

    get instances() {
        return this._instances;
    }

    add(instance: DesignInstance) {
        this._instances.push(instance);
    }

    change(index: number, element: string) {

        let promise: Promise<DesignInstance | undefined> = 
            element ?
            this.newDesign(element) : 
            Promise.resolve(undefined);

        promise.then(instance => {
            if (instance) {
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
        })            
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
        readonly newDesign: NewTypeDesignFactory,
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

        let promise: Promise<DesignInstance | undefined > = 
            element ?
            this.newDesign(element) :
            Promise.resolve(undefined);

        promise.then( instance => {
            if (instance) {
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
    
        });
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

    getTextOr(property: string, whenMissing: () => string): string;

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

    getTextOr(property: string, whenMissing: () => string): string {
        return whenMissing();
    }

    getChild(property: string): Configuration | undefined {
        return undefined;
    }

    getChildArray(property: string): Configuration[] | undefined {
        return undefined;
    }
}

export type NewTypeDesignFactory = (element: string) => Promise<DesignInstance>;

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

export type NewDesignFactory =
    (element: string, arooaType: ArooaType) => DesignInstance;

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

    private newDesignFactory(arooaType: ArooaType | undefined): NewTypeDesignFactory {

        return (element: string) => {
            const instance: DesignInstance =
                (arooaType === ArooaType.Component ?
                    this.componentCache : this.valueCache).createDesign(new ElementOnly(element));
            return Promise.resolve(instance);
        };
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

                    return (configuration: Configuration) => {

                        const childInstanceConfConf = configuration.getChild(property);
                        var childInstance;
                        if (childInstanceConfConf) {
                            childInstance = this.createDesign(childInstanceConfConf, arooaType);
                        }

                        const formItem = new SingleTypeSelection(property,
                            options,
                            this.newDesignFactory(arooaType),
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

                    return (configuration: Configuration) => {

                        const formItem = new IndexedMultiTypeTable(property,
                            options,
                            this.newDesignFactory(arooaType),
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
                            this.newDesignFactory(arooaType),
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

        getTextOr: (property: string, whenMissing: () => string): string => {

            return obj[property] || whenMissing();
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

            let child = obj[property];

            if (!child) {
                return undefined;
            }

            if (!Array.isArray(child)) {
                child = [child];
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


export interface DesignModel {

    createForm(): MainForm;
}

/**
 * Version that uses a Design Factory.
 */
export class FactoryDesignModel implements DesignModel {

    private readonly factories: DesignFactory;

    constructor(readonly componentId: string, readonly dataSource: DesignDataSource) {
        this.factories = new CachingDesignFactory(
            (element: string, arooaType: ArooaType) => dataSource.designFor(element, arooaType));
    }

    createForm(): MainForm {

        const configuration: any = this.dataSource.configurationFor(this.componentId);

        const designInstance = this.factories.createDesign(
            configurationFromAny(configuration), ArooaType.Component);

        return new MainForm(designInstance,
            (instance) => this.dataSource.save(this.componentId, parse(instance)));
    }
}

export type NewFormLookup = (element: string, isComponent: boolean) => Promise<any>;

/**
 * 
 */
export class FormParser {

    constructor(readonly designFactory: NewFormLookup) {
    }

    parseFormDefinition(definition: any): DesignInstance {
        return this.createDesign(configurationFromAny(definition));
    }

    createDesign(configuration: Configuration): DesignInstance {

        if (configuration.element != 'forms:form') {
            throw new Error(`forms:form expected not ${configuration.element}`);
        }

        const element = configuration.getTextValue('element');
        if (!element) {
            throw new Error(`Element is missing`);
        }

        const instance = new DesignInstance(element);

        const formItems = configuration.getChildArray('formItems');

        if (formItems) {
            formItems.forEach(itemConfig => {
                const formItem: FormItem = this.formItemFrom(itemConfig);
                instance.addItem(formItem);
            })
        }

        return instance;
    }

    typeDesignFactory(arooaType: ArooaType): NewTypeDesignFactory {
        return (element: string) => {
            return this.designFactory(element, arooaType == ArooaType.Component)
            .then(definition => {
                const configuration = parse(definition);

                return this.createDesign(configuration);
            })
        }
    }

    formItemFrom(configuration: Configuration): FormItem {

        const type: string = configuration.element;

        switch (type) {

            case 'forms:text':
                {
                    const property: string = configuration.getTextOr('property',
                        () => { throw new Error("Property is missing.") });
                    const title: string | undefined = configuration.getTextValue('title');

                    const textField = new TextField(property, title ? title : property);
                    textField.value = configuration.getTextValue('value');
                    return textField;
                }
            case 'forms:text-area':
                {
                    const title: string | undefined = configuration.getTextValue('title');

                    const textField = new TextField("@text", title ? title : "Text");
                    textField.value = configuration.getTextValue('value');
                    return textField;
                }
            case 'forms:single':
                {
                    const property: string = configuration.getTextOr('property',
                        () => { throw new Error("Property is missing.") });

                    const options: string[] = configuration.getTextOr('property',
                        () => { throw new Error("Options are missing.") })
                        .split(',');

                    const title: string | undefined = configuration.getTextValue('title');

                    const arooaType = configuration.getTextValue('component') ? ArooaType.Component : ArooaType.Value;

                    const childInstanceConfConf = configuration.getChild('value');

                    let childInstance;
                    if (childInstanceConfConf) {
                        childInstance = this.createDesign(childInstanceConfConf);
                    } else {
                        childInstance = undefined;
                    }

                    const formItem = new SingleTypeSelection(property,
                        options,
                        this.typeDesignFactory(arooaType),
                        title ? title : property,
                        childInstance
                    );

                    return formItem;

                }
            case 'forms:group':
            case 'forms:tabs':
            case 'forms:radio':
                {
                    const title: string | undefined = configuration.getTextValue('title');

                    let children: FormItem[] = [];

                    const items: Configuration[] | undefined = configuration.getChildArray('formItems');

                    if (items) {
                        children = items.map(e => this.formItemFrom(e));
                    }

                    const fieldGroup = new FieldGroup(title)

                    children.forEach(child => fieldGroup.addItem(child));

                    return fieldGroup;
                }
            case 'forms:indexed':
                {
                    const property: string = configuration.getTextOr('property',
                        () => { throw new Error("Property is missing.") });

                    const options: string[] = configuration.getTextOr('options',
                        () => { throw new Error("Options are missing.") })
                        .split(',');

                    const title: string | undefined = configuration.getTextValue('title');

                    const arooaType = configuration.getTextValue('component') ? ArooaType.Component : ArooaType.Value;

                    const formItem = new IndexedMultiTypeTable(property,
                        options,
                        this.typeDesignFactory(arooaType),
                        title ? title : property);

                    const childInstanceConf = configuration.getChildArray('value');

                    if (childInstanceConf) {
                        childInstanceConf.forEach(e => {
                            const instance: DesignInstance = this.createDesign(e);
                            formItem.add(instance);
                        })
                    }

                    return formItem;
                }
            case 'forms:mapped':
                {
                    const property: string = configuration.getTextOr('property',
                        () => { throw new Error("Property is missing.") });

                    const options: string[] = configuration.getTextOr('options',
                        () => { throw new Error("Options are missing.") })
                        .split(',');

                    const title: string | undefined = configuration.getTextValue('title');

                    const arooaType = configuration.getTextValue('component') ? ArooaType.Component : ArooaType.Value;

                    const formItem = new MappedMultiTypeTable(property,
                        options,
                        this.typeDesignFactory(arooaType),
                        title ? title : property);

                    const childInstanceConf = configuration.getChildArray(property);

                    if (childInstanceConf) {
                        childInstanceConf.forEach(e => {
                            const instance: DesignInstance = this.createDesign(e);
                            const key = e.getTextValue('@key');
                            if (!key) {
                                throw new Error("No key");
                            }
                            formItem.add(key, instance);
                        })
                    }

                    return formItem;
                }
            case 'forms:variable':
            default:
                throw new Error(`Unknown Form Item ${type}.`);
        }
    }
}


/**
 * Version that uses a Design Factory.
 */
export class ParserDesignModel implements DesignModel {

    constructor(readonly model: {
        formConfiguration: any,
        saveAction: (configuration: any) => void
        newForm: (element: string, isComponent: boolean) => any;
    }) {
    }

    createForm(): MainForm {

        const formParser: FormParser = new FormParser(
            this.model.newForm);

        const designInstance = formParser.parseFormDefinition(
            this.model.formConfiguration);

        return new MainForm(designInstance,
            instance => this.model.saveAction(parse(instance)));
    }
}