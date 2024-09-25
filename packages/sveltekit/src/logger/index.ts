export enum LogLevel {
    TRACE = 1,
    DEBUG = 5,
    INFO = 9,
    WARN = 13,
    ERROR = 17,
    FATAL = 21,
    OFF = 100,
}

export interface AxiomLogger {
    debug: (message: string, args: { [key: string]: any }) => Promise<void>;
    info: (message: string, args: { [key: string]: any }) => Promise<void>;
    warn: (message: string, args: { [key: string]: any }) => Promise<void>;
    error: (message: string, args: { [key: string]: any }) => Promise<void>;
    with: (args: { [key: string]: any }) => AxiomLogger;
}

