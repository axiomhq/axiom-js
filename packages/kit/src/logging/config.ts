import { Adapter } from './adapter';
import { Transport } from './transport';

export interface LoggerConfig {
  source: LoggingSource;
  transport: Transport;
  adapter: Adapter;
  logLevel?: string;
  args?: { [key: string]: any };
}

export enum LoggingSource {
  browser,
  lambda,
  edge,
  build,
}
