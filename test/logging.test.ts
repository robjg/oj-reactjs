import { mock } from 'jest-mock-extended';

import { LogAppender, Logger, LoggerFactory, LogLevel } from '../src/logging';

class Foo {}

test("Log To Custom Appender", () => {

    const appender: LogAppender = mock<LogAppender>();
    Object.defineProperty(appender, 'name', { value : "TestAppender" });

    LoggerFactory.configuration.addAppender(appender)
            .setRoot( { appender: "TestAppender" })
            .setLogger("Foo", { level: LogLevel.INFO });

    const logger: Logger = LoggerFactory.getLogger(Foo);   

    logger.info("Some Stuff");

    expect(appender.append).toBeCalled();
})