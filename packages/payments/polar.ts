import 'server-only';
import { Polar } from '@polar-sh/sdk';
import { keys, polarServer } from './keys';

let client: Polar | undefined;

/**
 * Lazy so that a missing POLAR_API_SERVER surfaces at the call site that needs
 * it, not as an import-time crash in whatever route happened to pull this in.
 * Server mode used to come from NODE_ENV here while the routes read
 * POLAR_API_SERVER, which meant this client could talk to a different Polar
 * account than the checkout the seller just completed.
 */
export const polar = (): Polar => {
  if (!client) {
    client = new Polar({
      accessToken: keys().POLAR_ACCESS_TOKEN,
      server: polarServer(),
    });
  }

  return client;
};

export type { Polar } from '@polar-sh/sdk';
