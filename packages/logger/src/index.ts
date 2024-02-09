import { LogLevel } from './levels';
import { Logger } from './logger';
import { ConsoleTransport } from './transports/console';

export { Logger, LoggerConfig } from './logger'
export { LogEvent } from './event'
export { LogLevel } from './levels'

export function getDefaultLogger(): Logger {
    return new Logger({
        logLevel: LogLevel.debug,
        autoFlush: true,
        transformers: [],
        transport: new ConsoleTransport(),
    });
}
