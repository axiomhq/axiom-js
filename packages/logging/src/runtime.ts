export const Version = __PACKAGE_VERSION__;

declare global {
  const __PACKAGE_VERSION__: string;
  var WorkerGlobalScope: any;
  var EdgeRuntime: any;
}

export const isWebWorker =
  typeof self !== 'undefined' &&
  typeof globalThis.WorkerGlobalScope !== 'undefined' &&
  self instanceof WorkerGlobalScope;

export const isBrowser = typeof window !== 'undefined' || isWebWorker;
export const isEdgeRuntime = globalThis.EdgeRuntime ? true : false;
