import { initializeSentry } from '@repo/observability/instrumentation';

// Workaround for Node 25: localStorage is an empty proxy without getItem when
// --localstorage-file is not set. This makes libraries that check for
// localStorage fail. We neutralize it so they get undefined and can guard.
// https://github.com/nodejs/node/issues/60303
if (
  typeof globalThis !== 'undefined' &&
  globalThis.localStorage &&
  typeof globalThis.localStorage.getItem !== 'function'
) {
  (globalThis as unknown as { localStorage?: unknown }).localStorage = undefined;
}

export const register = initializeSentry();
