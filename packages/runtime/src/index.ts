declare global {
  var EdgeRuntime: string; // Edge runtime
  var WorkerGlobalScope: any; // Non-standard global only used on Cloudflare: https://developers.cloudflare.com/workers/runtime-apis/websockets
}

export const isWebWorker =
  typeof self !== 'undefined' &&
  typeof globalThis.WorkerGlobalScope !== 'undefined' &&
  self instanceof WorkerGlobalScope;
export const isBrowser = typeof window !== 'undefined' || isWebWorker;
export const isEdgeRuntime = globalThis.EdgeRuntime ? true : false;

export enum Runtime {
  WebWorker,
  Browser,
  EdgeRuntime,
  Node,
}

export function detectRuntime(): Runtime {
  if (isWebWorker) {
    return Runtime.WebWorker;
  } else if (isEdgeRuntime) {
    return Runtime.EdgeRuntime;
  } else if (isBrowser) {
    return Runtime.Browser;
  }

  return Runtime.Node;
}
