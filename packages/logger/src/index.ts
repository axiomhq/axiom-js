import { LOG_LEVEL, LogLevel } from './levels';
import { Logger } from './logger';
import { AxiomTransport } from './transports/axiom';
import { ConsoleTransport } from './transports/console';

export { Logger, LoggerConfig } from './logger'
export { LogEvent } from './event'
export { LogLevel } from './levels'

export function getDefaultLogger(): Logger {
    const level = LogLevel[LOG_LEVEL as keyof typeof LogLevel];
    const env = process.env.NODE_ENV
    const transport = env === 'production' ? new AxiomTransport({
        token: process.env.AXIOM_TOKEN || '',
        axiomUrl: process.env.AXIOM_URL || 'https://api.axiom.co',
        dataset: process.env.AXIOM_DATASET || '',
    }) : new ConsoleTransport();

    return new Logger({
        logLevel: level,
        autoFlush: false,
        transformers: [],
        transport: transport,
    });
}
