import 'server-only';
import { PostHog } from 'posthog-node';
import { keys } from '../keys';

const env = keys();
const posthogKey = env.NEXT_PUBLIC_POSTHOG_KEY;
const posthogHost = env.NEXT_PUBLIC_POSTHOG_HOST;

export const analytics = posthogKey && posthogHost
  ? new PostHog(posthogKey, {
      host: posthogHost,

      // Don't batch events and flush immediately - we're running in a serverless environment
      flushAt: 1,
      flushInterval: 0,
    })
  : ({
      capture: () => console.warn('[PostHog] Disabled - missing API key or host'),
      flush: () => Promise.resolve(),
    } as any);
