import packageJson from './package.json';

export const Version = packageJson.version;

declare global {
  var WorkerGlobalScope: any;
}

export const isWebWorker =
  typeof self !== 'undefined' &&
  typeof globalThis.WorkerGlobalScope !== 'undefined' &&
  self instanceof WorkerGlobalScope;

export const isBrowser = typeof window !== 'undefined' || isWebWorker;
