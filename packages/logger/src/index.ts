import { LOG_LEVEL, LogLevel } from './levels';
import { Logger } from './logger';
import { ConsoleTransport } from './transports/console';

export { Logger, LoggerConfig } from './logger'
export { LogEvent } from './event'
export { LogLevel } from './levels'

export function getDefaultLogger(): Logger {
    const level = LogLevel[LOG_LEVEL as keyof typeof LogLevel];
    
    return new Logger({
        logLevel: level,
        autoFlush: true,
        transformers: [],
        transport: new ConsoleTransport(),
    });
}
