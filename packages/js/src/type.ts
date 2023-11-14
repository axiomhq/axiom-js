
export interface LogEvent {
    level: string;
    message: string;
    fields: any;
    _time: string; 
  }

export enum LogLevel {
    debug = 0,
    info = 1,
    warn = 2,
    error = 3,
    off = 100,
}

export type LoggerConfig = {
    args?: { [key: string]: any };
    logLevel?: LogLevel;
    autoFlush?: boolean;
    token: string 
    dataset: string | undefined;
  };