import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const keys = () =>
  createEnv({
    server: {
      POLAR_ACCESS_TOKEN: z.string().min(1),
      POLAR_WEBHOOK_SECRET: z.string().optional(),
      /**
       * Which Polar account the routes talk to. Deliberately has no default:
       * the two values bill different money, and guessing either one is silent.
       * Guessing 'sandbox' takes real card details and settles nothing;
       * guessing 'production' charges real cards from a dev box. Unset is
       * caught per request by `polarServer()` so a missing var is a loud 500 on
       * /api/polar/* rather than a boot failure for the whole app.
       */
      POLAR_API_SERVER: z.enum(['production', 'sandbox']).optional(),
    },
    runtimeEnv: {
      POLAR_ACCESS_TOKEN: process.env.POLAR_ACCESS_TOKEN,
      POLAR_WEBHOOK_SECRET: process.env.POLAR_WEBHOOK_SECRET,
      POLAR_API_SERVER: process.env.POLAR_API_SERVER,
    },
  });

export class PolarConfigError extends Error {}

/**
 * Single source of truth for the Polar server mode. Before this existed,
 * /api/polar/checkout defaulted to 'sandbox' and /api/polar/portal defaulted to
 * 'production' in the same app, so an unset var meant a seller checked out
 * against sandbox and then could never open the portal for that subscription.
 */
export const polarServer = (): 'production' | 'sandbox' => {
  const server = keys().POLAR_API_SERVER;

  if (!server) {
    throw new PolarConfigError(
      "POLAR_API_SERVER is not set. Expected 'production' or 'sandbox'."
    );
  }

  return server;
};
