'use client';

import { type ReactNode, useEffect, useState } from 'react';
import { GoogleAnalytics } from './google';
import { keys } from './keys';
import { PostHogProvider } from './posthog/client';
import { VercelAnalytics } from './vercel';

type AnalyticsProviderProps = {
  readonly children: ReactNode;
};

const { NEXT_PUBLIC_GA_MEASUREMENT_ID } = keys();

function useBrowserPathname(): string | null {
  const [pathname, setPathname] = useState<string | null>(null);

  useEffect(() => {
    const update = () => setPathname(window.location.pathname);
    const pushState = window.history.pushState;
    const replaceState = window.history.replaceState;
    const patchedPushState: History['pushState'] = function (
      this: History,
      ...args
    ) {
      pushState.apply(this, args);
      update();
    };
    const patchedReplaceState: History['replaceState'] = function (
      this: History,
      ...args
    ) {
      replaceState.apply(this, args);
      update();
    };

    window.history.pushState = patchedPushState;
    window.history.replaceState = patchedReplaceState;
    window.addEventListener('popstate', update);
    update();

    return () => {
      if (window.history.pushState === patchedPushState) {
        window.history.pushState = pushState;
      }
      if (window.history.replaceState === patchedReplaceState) {
        window.history.replaceState = replaceState;
      }
      window.removeEventListener('popstate', update);
    };
  }, []);

  return pathname;
}

export const AnalyticsProvider = ({ children }: AnalyticsProviderProps) => {
  const pathname = useBrowserPathname();
  const segments = pathname?.split('/').filter(Boolean) ?? [];
  const isIntakePath = segments.at(-2) === 'x';

  if (!pathname || isIntakePath) {
    return children;
  }

  return (
    <PostHogProvider>
      {children}
      <VercelAnalytics />
      {NEXT_PUBLIC_GA_MEASUREMENT_ID && (
        <GoogleAnalytics gaId={NEXT_PUBLIC_GA_MEASUREMENT_ID} />
      )}
    </PostHogProvider>
  );
};
