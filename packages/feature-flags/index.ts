import { analytics } from '@repo/analytics/posthog/server';
import { auth } from '@repo/auth/server';
import { flag } from 'flags/next';
import { createFlag } from './lib/create-flag';

export const showBetaFeature = createFlag('showBetaFeature');

/**
 * Like `createFlag`, but evaluates for signed-out traffic too (e.g. the public
 * home page). When there is no authenticated user we fall back to PostHog's
 * anonymous distinct id so rollout percentages stay stable per visitor instead
 * of defaulting everyone to `false`.
 */
const createPublicFlag = (key: string) =>
  flag({
    key,
    defaultValue: false,
    async decide({ cookies }) {
      const { userId } = await auth();

      const distinctId = userId ?? getAnonymousDistinctId(cookies);

      if (!distinctId) {
        return this.defaultValue as boolean;
      }

      const isEnabled = await analytics.isFeatureEnabled(key, distinctId);

      return isEnabled ?? (this.defaultValue as boolean);
    },
  });

// PostHog stores the visitor's distinct id in a `ph_<key>_posthog` cookie as a
// JSON blob. Reading it lets anonymous flag evaluation match what the browser
// reports, so rollouts/experiments are consistent for signed-out users.
const getAnonymousDistinctId = (cookies: {
  getAll: () => { name: string; value: string }[];
}): string | undefined => {
  const phCookie = cookies
    .getAll()
    .find((cookie) => /^ph_.+_posthog$/.test(cookie.name));

  if (!phCookie?.value) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(phCookie.value) as { distinct_id?: unknown };
    return typeof parsed.distinct_id === 'string'
      ? parsed.distinct_id
      : undefined;
  } catch {
    return undefined;
  }
};

export const webDemoInteractiveEnabled = createPublicFlag(
  'web_demo_interactive_enabled'
);
export const webDemoLaneDragEnabled = createPublicFlag(
  'web_demo_lane_drag_enabled'
);
