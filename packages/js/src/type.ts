import { Axiom } from "./client";



export interface LoggerConfig {
  dataset: string;
  client: Axiom;
  args?: { [key: string]: any };
  logLevel?: LogLevel;
  autoFlush?: boolean;
}


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