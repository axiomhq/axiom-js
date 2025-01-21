import { LogEvent } from '..';

export interface Transport {
  log: (logs: LogEvent[]) => Promise<void> | void;
  flush: () => Promise<void> | void;
}

export * from './axiom-js';
export * from './axiom-fetch';
export * from './console';
export * from './fetch';
export * from './proxy-transport';
