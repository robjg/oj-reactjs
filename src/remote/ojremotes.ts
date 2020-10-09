import  { JavaClass, javaClasses, RemoteObject } from './remote'

export enum StateFlag {
    READY = "READY",
    EXECUTING = "EXECUTING",
    STOPPABLE = "STOPPABLE",
    COMPLETE = "COMPLETE",
    INCOMPLETE = "INCOMPLETE",
    EXCEPTION = "EXCEPTION",
    DESTROYED = "DESTROYED"
}

export type State = {
    name: string;
    flags: StateFlag[];
}

export class StateData implements RemoteObject<StateData> {
    static readonly javaClass = javaClasses.register(
        StateData, "org.oddjob.jmx.handlers.StatefulHandlerFactory$StateData");

    constructor(readonly jobState: State,
        readonly date: Date, 
        readonly throwable: any) {}


    getJavaClass(): JavaClass<StateData> {
        return StateData.javaClass;
    }
}


javaClasses.register