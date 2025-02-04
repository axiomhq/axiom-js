const crypto = globalThis.crypto ?? require('node:crypto').webcrypto;
const AsyncLocalStorage = globalThis.AsyncLocalStorage ?? require('node:async_hooks').AsyncLocalStorage;

export { crypto, AsyncLocalStorage };
