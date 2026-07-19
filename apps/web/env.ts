import { keys as auth } from '@repo/auth/keys';
import { keys as email } from '@repo/email/keys';
import { keys as flags } from '@repo/feature-flags/keys';
import { keys as core } from '@repo/next-config/keys';
import { keys as observability } from '@repo/observability/keys';
import { keys as rateLimit } from '@repo/rate-limit/keys';
import { keys as security } from '@repo/security/keys';
import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  extends: [
    auth(),
    core(),
    email(),
    observability(),
    flags(),
    security(),
    rateLimit(),
  ],
  server: {
    CONVEX_URL: z
      .string()
      .url()
      .default('https://merry-buffalo-800.convex.cloud'),
    SUPABASE_URL: z.string().url().optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_ANORHA_EXTENSION_ID: z
      .string()
      .regex(/^[a-p]{32}$/)
      .optional(),
  },
  runtimeEnv: {
    CONVEX_URL: process.env.CONVEX_URL,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_ANORHA_EXTENSION_ID:
      process.env.NEXT_PUBLIC_ANORHA_EXTENSION_ID,
  },
});
