
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

export function resolveRuntime() {
    if (isWebWorker) {
        return 'webworker';
    } else if (isEdgeRuntime) {
        return 'edge';
    } else if (typeof window !== 'undefined') {
        return 'browser';
    } else {
        return 'node';
    }
}

export const runtime = resolveRuntime()