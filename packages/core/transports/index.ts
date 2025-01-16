import { LogEvent } from '..';

export interface Transport {
  log: (logs: LogEvent[]) => Promise<void> | void;
  flush: () => Promise<void> | void;
}

export * from './console';
export * from './axiom-js';
export * from './axiom-fetch';
export * from './proxy-transport';
