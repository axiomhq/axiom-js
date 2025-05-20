const crypto = {
  /**
   * Try to use the native **crypto** library through globalThis.crypto,
   * if it's not present, use a less cryptographically secure internal function.
   *
   * This is meant to remove any reference to **node:crypto**, as it causes Vercel deployments to fail
   */
  randomUUID: () => {
    if (globalThis.crypto) {
      return globalThis.crypto.randomUUID();
    }
    return generateUUIDv4();
  },
};

function generateUUIDv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const rand = Math.random() * 16 | 0;
    const value = char === 'x' ? rand : (rand & 0x3) | 0x8;
    return value.toString(16);
  });
}


const AsyncLocalStorage = globalThis.AsyncLocalStorage ?? require('node:async_hooks').AsyncLocalStorage;

export { crypto, AsyncLocalStorage };
