import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const keys = () =>
  createEnv({
    server: {
      STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
      STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_').optional(),
      POLAR_ACCESS_TOKEN: z.string().min(1),
      POLAR_WEBHOOK_SECRET: z.string().optional(),
      POLAR_SUCCESS_URL: z.string().url(),
    },
    runtimeEnv: {
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
      POLAR_ACCESS_TOKEN: process.env.POLAR_ACCESS_TOKEN,
      POLAR_WEBHOOK_SECRET: process.env.POLAR_WEBHOOK_SECRET,
      POLAR_SUCCESS_URL: process.env.POLAR_SUCCESS_URL,
    },
  });
