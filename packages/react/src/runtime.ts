
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
    Browser = 'browser',
    WebWorker = 'webworker',
    Edge = 'edge',
    Node = 'node',
}

export function resolveRuntime(): Runtime {
    if (isWebWorker) {
        return Runtime.WebWorker;
    }
    if (isBrowser) {
        return Runtime.Browser;
    }
    if (isEdgeRuntime) {
        return Runtime.Edge;
    }
    return Runtime.Node;
}

export const currentRuntime = resolveRuntime();
