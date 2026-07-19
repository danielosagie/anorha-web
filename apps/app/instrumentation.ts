import { initializeSentry } from '@repo/observability/instrumentation';

// Node 25 exposes a localStorage global on the server when the runtime is
// started with --localstorage-file (Next injects it). When the file path is
// invalid the global exists but its methods are broken, so any dependency
// guarding with `typeof localStorage !== 'undefined'` crashes during SSR.
// Remove the broken global so those guards fall back to server behavior.
const brokenLocalStorage = () => {
  try {
    const store = (globalThis as { localStorage?: Storage }).localStorage;
    if (!store) {
      return false;
    }
    if (
      typeof store.getItem !== 'function' ||
      typeof store.setItem !== 'function'
    ) {
      return true;
    }
    store.setItem('__probe__', '1');
    store.getItem('__probe__');
    store.removeItem('__probe__');
    return false;
  } catch {
    return true;
  }
};

if (typeof window === 'undefined' && brokenLocalStorage()) {
  try {
    (globalThis as unknown as { localStorage?: unknown }).localStorage =
      undefined;
  } catch {
    Reflect.deleteProperty(globalThis, 'localStorage');
  }
}

export const register = initializeSentry();
