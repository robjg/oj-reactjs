
interface RefreshEvent {

    oldInterval: number;

    newInterval: number;
}

interface RefreshListener {

    refreshChanged(refreshEvent: RefreshEvent): void;
}

export interface RefreshModel {

    setSteadyInterval(interval: number): void;

    getSteadyInterval(): number;

    getNextInterval(): number;

    addRefreshListener(listener: RefreshListener): void;

    reset(): void;
}

export class OjRefreshModel implements RefreshModel {

    private refreshListeners: RefreshListener[] = [];

    private lastInterval?: number;

    constructor(private steadyInterval: number = 5) {

    }

    private fireRefreshChanged(oldInterval: number, newInterval: number): void {
        let event: RefreshEvent = {
            oldInterval: oldInterval,
            newInterval: newInterval
        };

        for (let listener of this.refreshListeners) {
            listener.refreshChanged(event)
        }
    }

    setSteadyInterval = (interval : number) => {
        let oldInterval = this.steadyInterval;
        this.steadyInterval = interval;
        this.fireRefreshChanged(oldInterval, interval);
    };

    getSteadyInterval = (): number => {
        return this.steadyInterval;
    };

    getNextInterval = (): number => {
        if (this.lastInterval) {
            if (this.lastInterval > this.steadyInterval) {
                return this.steadyInterval;
            }
            else {
                return this.lastInterval++;
            }
        }
        return 1;
    };

    reset():void {
        this.lastInterval = 1;
    }

    addRefreshListener(listener:RefreshListener):void {
        if (!listener) {
            throw new Error("Refresh Listener undefined.");
        }
        this.refreshListeners.push(listener);
    }

}

export class OjRefreshUI implements RefreshListener {

    private fromUs?: boolean;

    constructor(private refreshModel: RefreshModel,
                private refreshId: string = 'refresh') {

        this.initVal();
        let submit: JQuery  = $('#' + this.refreshId + "Submit");
        submit.click(this.setInterval);
    }

    private setInterval = (): void => {

        if (!this.fromUs) {
            this.fromUs = true;
            let value = $('#' + this.refreshId).val();
            if ($.isNumeric(value)) {
                this.refreshModel.setSteadyInterval(value as number);
            }
            else {
                alert("Number required.")
                this.initVal();
            }
            this.fromUs = false;
        }
    }

    private initVal = (): void => {
        $('#' + this.refreshId)
            .val(this.refreshModel.getSteadyInterval());
    }

    refreshChanged(refreshEvent:RefreshEvent):void {
        if (!this.fromUs) {
            $('#' + this.refreshId).val(refreshEvent.newInterval);
        }
    }

}
