
export interface Logger {

    debug(message: String): void;

    info(message: String): void;

    warn(message: String): void;

    error(message: String): void;
}

class ConsoleLogger implements Logger {

    debug(message: String): void {
        console.log("DEBUG: " + message);
    }

    info(message: String): void {
        console.log("INFO: " + message);
    }

    warn(message: String): void {
        console.log("WARN: " + message);
    }

    error(message: String): void {
        console.log("ERROR: " + message);
    }

}

export class Logger {

    static getLogger(): Logger {
        return new ConsoleLogger();
    }
}