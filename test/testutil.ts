import { ResolvePlugin } from "webpack";


export class Latch {

    readonly promise: Promise<void>

    private resolve: (() => any) | null;
    
    constructor(private _count: number = 1) {

        this.resolve = null;
        this.promise = new Promise(resolve => {
            this.resolve = resolve;
        })
        if (!this.resolve) {
            throw new Error("Resolve expected during promise construction."); 
        }
    }

    get count() {
        return this._count;
    }

    countDown():void  {
        if (!this.resolve) {
            throw new Error("Compiler need this even though we checked in constructor."); 
        }
        if (--this._count == 0) {
            this.resolve();
        }
    }
}


export class Phaser {

    private releaseCount: number = 0;

    private promises: Promise<void>[] = [];

    private resolvers: (() => any)[] = [];

    next(): Promise<void> {
        const promise: Promise<any> = new Promise(resolve => {
            this.resolvers.push(resolve)
        });
        this.promises.push(promise);
        return promise;
    }


    release(): void {
        if (this.releaseCount > this.resolvers.length) {
            throw new Error("Phaser is out of step as phase " + 
            this.releaseCount + " not started yet.");
        }
        this.resolvers[this.releaseCount++]();
    }
}