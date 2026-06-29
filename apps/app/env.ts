import { keys as analytics } from '@repo/analytics/keys';
import { keys as auth } from '@repo/auth/keys';
import { keys as collaboration } from '@repo/collaboration/keys';
import { keys as database } from '@repo/database/keys';
import { keys as email } from '@repo/email/keys';
import { keys as flags } from '@repo/feature-flags/keys';
import { keys as core } from '@repo/next-config/keys';
import { keys as notifications } from '@repo/notifications/keys';
import { keys as observability } from '@repo/observability/keys';
import { keys as security } from '@repo/security/keys';
import { keys as webhooks } from '@repo/webhooks/keys';
import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  extends: [
    auth(),
    analytics(),
    collaboration(),
    core(),
    database(),
    email(),
    flags(),
    notifications(),
    observability(),
    security(),
    webhooks(),
  ],
  server: {
    // Internal/ops plane: deny-by-default allowlist of Clerk user ids for /admin, plus the
    // external Langfuse dashboard URL to embed/link. Both optional — an unset ADMIN_USER_IDS
    // means the /admin route admits no one.
    ADMIN_USER_IDS: z.string().optional(),
    LANGFUSE_DASHBOARD_URL: z.string().url().optional(),
  },
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
    NEXT_PUBLIC_API_URL: z.string().optional(),
    NEXT_PUBLIC_TESTFLIGHT_URL: z.string().url().optional(),
    NEXT_PUBLIC_TESTFLIGHT_INVITE_CODE: z.string().optional(),
  },
  runtimeEnv: {
    ADMIN_USER_IDS: process.env.ADMIN_USER_IDS,
    LANGFUSE_DASHBOARD_URL: process.env.LANGFUSE_DASHBOARD_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_TESTFLIGHT_URL: process.env.NEXT_PUBLIC_TESTFLIGHT_URL,
    NEXT_PUBLIC_TESTFLIGHT_INVITE_CODE: process.env.NEXT_PUBLIC_TESTFLIGHT_INVITE_CODE,
  },
});
