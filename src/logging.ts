
export enum LogLevel {
    DEBUG,
    INFO,
    WARN,
    ERROR
}

export interface Logger {

    name: string;

    level: LogLevel;

    debug(message: string): void;

    info(message: string): void;

    warn(message: string): void;

    error(message: string): void;
}

export class LogEvent {
    constructor(
        readonly logger: string,
        readonly level: LogLevel,
        readonly message: string) {
    }
}

export interface LogAppender {

    readonly name: string;

    append(event: LogEvent): void;
}

export type LoggerConfiguration = {

    [index: string]: any;

    level?: LogLevel;

    appender?: string;
}

export interface LoggingConfiguration {

    addAppender(appender: LogAppender): LoggingConfiguration;

    setRoot(config: LoggerConfiguration): LoggingConfiguration;

    setLogger(name: string, config: LoggerConfiguration): LoggingConfiguration;
}

class ConsoleAppender implements LogAppender {

    static readonly NAME = "console";

    readonly name = ConsoleAppender.NAME;

    append(event: LogEvent): void {

        switch (event.level) {
            case LogLevel.DEBUG:
                console.log("DEBUG: " + event.message);
                break;
            case LogLevel.INFO:
                console.log("INFO: " + event.message);
                break;
            case LogLevel.WARN:
                console.warn("WARN: " + event.message);
                break;
            case LogLevel.ERROR:
                console.error("ERROR: " + event.message);
                break;
            default:
        }
    }

}

class DefaultConfiguration implements LoggingConfiguration {

    private root: LoggerConfiguration = {
        level: LogLevel.WARN
    }

    private readonly loggerConfigs: Map<string, LoggerConfiguration> = new Map();

    private readonly appenders: Map<string, LogAppender> = new Map();

    constructor() {
        this.addAppender(new ConsoleAppender());
    }

    addAppender(appender: LogAppender): LoggingConfiguration {
        this.appenders.set(appender.name, appender);
        return this;
    }

    setRoot(config: LoggerConfiguration): LoggingConfiguration {

        for (const prop in config) {
            this.root[prop] = config[prop];
        }

        return this;
    }

    setLogger(name: string, config: LoggerConfiguration): LoggingConfiguration {

        this.loggerConfigs.set(name, config);
        return this;
    }

    getAppender(loggerName: string): LogAppender {

        const appenderName = this.loggerConfigs.get(loggerName)?.appender || this.root.appender;
        let appender: LogAppender | undefined;
        if (appenderName) {
            appender = this.appenders.get(appenderName);
        }
        if (appender) {
            return appender;
        }
        else {
            return new ConsoleAppender();
        }
    }

    getLevel(loggerName: string): LogLevel {

        return this.loggerConfigs.get(loggerName)?.level ||
            this.root.level || LogLevel.WARN;
    }
}

class MultiAppender implements LogAppender {

    readonly name = MultiAppender.name;

    constructor(private readonly appenders: LogAppender[]) {

    }

    append(event: LogEvent): void {
        this.appenders.forEach(e => e.append(event));
    }
}

export interface LoggerFactory {

}

export class LoggerFactory {

    static configuration: DefaultConfiguration = new DefaultConfiguration()

    static loggers: Map<string, Logger> = new Map();

    static getLogger(name: string | (new (...args: any) => any)): Logger {

        if (typeof name != 'string') {
            name = name.name;
        }

        const logger = this.loggers.get(name);

        if (logger) {
            return logger;
        }

        const appender: LogAppender = this.configuration.getAppender(name);

        const level: LogLevel = this.configuration.getLevel(name);

        const newLogger = new DefaultLogger(name, level, appender);

        this.loggers.set(name, newLogger);

        return newLogger;
    }
}


class DefaultLogger implements Logger {

    constructor(readonly name: string,
        public level: LogLevel,
        private readonly appender: LogAppender) {

    }

    debug(message: string): void {
        if (LogLevel.DEBUG >= this.level) {
            this.appender.append(new LogEvent(this.name, LogLevel.DEBUG, message));
        }
    }

    info(message: string): void {
        if (LogLevel.INFO >= this.level) {
            this.appender.append(new LogEvent(this.name, LogLevel.INFO, message));
        }
    }

    warn(message: string): void {
        if (LogLevel.WARN >= this.level) {
            this.appender.append(new LogEvent(this.name, LogLevel.WARN, message));
        }
    }

    error(message: string): void {
        if (LogLevel.ERROR >= this.level) {
            this.appender.append(new LogEvent(this.name, LogLevel.ERROR, message));
        }
    }

}