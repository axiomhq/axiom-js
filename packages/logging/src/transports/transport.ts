export interface Transport {
  log: (logs: any[]) => Promise<void> | void;
  flush: () => Promise<void> | void;
}
