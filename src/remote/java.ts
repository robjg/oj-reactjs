export interface JavaClass<T> {

    name: string;

    arrayOf(): JavaClass<T[]>;

}

export class JavaClassImpl<T> implements JavaClass<T> {

    constructor(readonly name: string) {

    }

    arrayOf(): JavaClass<T[]> {
        return new JavaClassArray<T>("[L" + name + ";");
    }
}

class JavaPrimativeClass<P> implements JavaClass<P> {

    constructor(readonly name: string, readonly symbol: string) {

    }

    arrayOf(): JavaClass<P[]> {
        return new JavaClassArray<P>("[" + this.symbol);
    }
}

class JavaClassArray<A> implements JavaClass<A[]> {

    constructor(readonly name: string) {

    }

    arrayOf(): JavaClass<A[]> {
        return new JavaClassArray<A>("[" + this.name);
    }
}



class JavaClasses {

    readonly registry = new Map<new (...args: any[]) => any, JavaClass<any>>();

    readonly byName = new Map<string, JavaClass<any>>();

    register<T>(cntor: { new(...args: any[]): T }, className: string): JavaClass<T> {
        const javaClass = new JavaClassImpl<T>(className)
        if (this.registry.has(cntor)) {
            throw new Error("Already registered " + cntor  + " for " + className);
        }
        this.registry.set(cntor, javaClass);
        this.byName.set(className, javaClass);
        return javaClass;
    }

    registerClass<T>(javaClass: JavaClass<T>) {
        this.byName.set(javaClass.name, javaClass);
        return javaClass;
    }

    forType<T>(cntor: { new(...args: any[]): T }): JavaClass<T> {
        let maybe = this.registry.get(cntor);
        if (maybe) {
            return maybe
        }
        else {
            throw new Error("No Java class registered for " + cntor);
        }
    }

    forName(className: string): JavaClass<any> {
        let maybe = this.byName.get(className);
        if (maybe) {
            return maybe
        }
        else {
            throw new Error("No Java class registered for " + className);
        }
    }

    isKnown(className: string): boolean {
        return this.byName.get(className) != undefined;
    }

    is<T>(className: string, cntor: { new(...args: any[]): T }): boolean {
        return className === this.registry.get(cntor)?.name;
    }
}

export const javaClasses = new JavaClasses();


export const JAVA_OBJECT = javaClasses.registerClass(new JavaClassImpl<any>("java.lang.Object"));
export const JAVA_STRING = javaClasses.registerClass(new JavaClassImpl<string>("java.lang.String"));

export const JAVA_BYTE = javaClasses.registerClass(new JavaPrimativeClass<number>("byte", "B"));
export const JAVA_CHAR = javaClasses.registerClass(new JavaPrimativeClass<number>("char", "C")); 
export const JAVA_INT = javaClasses.registerClass(new JavaPrimativeClass<number>("int", "I"));
export const JAVA_DOUBLE = javaClasses.registerClass(new JavaPrimativeClass<number>("double", "D"));
export const JAVA_FLOAT = javaClasses.registerClass(new JavaPrimativeClass<number>("float", "F"));
export const JAVA_LONG = javaClasses.registerClass(new JavaPrimativeClass<number>("long", "J"));
export const JAVA_BOOLEAN = javaClasses.registerClass(new JavaPrimativeClass<boolean>("boolean", "Z"));
export const JAVA_SHORT = javaClasses.registerClass(new JavaPrimativeClass<boolean>("short", "S"));

export const JAVA_VOID = javaClasses.registerClass(new JavaClassImpl("void"));

export interface JavaObject<T extends JavaObject<T>> {

    getJavaClass(): JavaClass<T>;
}
