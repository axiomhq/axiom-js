declare global {
  var EdgeRuntime: string;
}

export const isBrowser = () => typeof window !== 'undefined';
export const isVercel = () => process.env.AXIOM_INGEST_ENDPOINT || process.env.NEXT_PUBLIC_AXIOM_INGEST_ENDPOINT;
export const isNetlify = () => process.env.NETLIFY == 'true';
export const isEdge = () => typeof globalThis.EdgeRuntime != 'undefined' || process.env.NEXT_RUNTIME === 'edge';
export const isNode = () => false;
// features
export const enableLogDrain = process.env.ENABLE_AXIOM_LOG_DRAIN == 'true' ? true : false;

export function isLambdaHandler(param: any): boolean {
  const isFunction = typeof param == 'function';

  // Vercel defines EdgeRuntime for edge functions, but Netlify defines NEXT_RUNTIME = 'edge'
  return isFunction && typeof globalThis.EdgeRuntime === 'undefined' && process.env.NEXT_RUNTIME != 'edge';
}
