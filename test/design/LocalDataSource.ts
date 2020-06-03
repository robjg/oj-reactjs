import { ArooaType, DesignDataSource } from '../../src/design/design'

export class LocalDataSource implements DesignDataSource {

    private readonly componentCache: Map<string, any> = new Map();

    private readonly valueCache: Map<string, any> = new Map();

    private readonly configurations: Map<string, any> = new Map();

    designFor(element: string, arooaType: ArooaType): any {
        switch(arooaType) {
            case ArooaType.Component:
                return this.componentCache.get(element);
            case ArooaType.Value:
                return this.valueCache.get(element);
            default:
                throw new Error(`Unknown type ${arooaType}`);
        }
    }

    configurationFor(componentId: string): any {
        return this.configurations.get(componentId);
    }

    addDesignDefinition(arooaType: ArooaType, definition: any): void {

        const element: string = definition['element'];

        switch (arooaType) {
            case ArooaType.Component:
                this.componentCache.set(element, definition);
                break;
            case ArooaType.Value:
                this.valueCache.set(element, definition);
                break;
            default:
                throw new Error(`Unknown type ${arooaType}`);
        }
    }

    addDesignDefinitions(definitions: any) {

        const components: Array<any> = definitions['components'];
        const values: Array<any> = definitions['values'];

        if (components) {
            components.forEach(def => {
                this.addDesignDefinition(ArooaType.Component, def);
            });
        }

        if (values) {
            values.forEach(def => {
                this.addDesignDefinition(ArooaType.Value, def);
            });
        }
    }

    save(componentId: string, configuration: any) {

        this.configurations.set(componentId, configuration);
    }
}

