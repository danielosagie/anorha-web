'use client';

import { useOrganizationList } from '@clerk/nextjs';
import { Spinner } from '@repo/design-system/components/ui/spinner';
import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useEffect } from 'react';

type OrgGuardProps = {
  readonly children: ReactNode;
};

/**
 * Ensures the user has at least one organization.
 * Redirects to /onboarding if they don't have any orgs.
 * Skips check if already on /onboarding or /partner/accept paths.
 */
export function OrgGuard({ children }: OrgGuardProps) {
  const { userMemberships, isLoaded } = useOrganizationList({
    userMemberships: {
      infinite: true,
    },
  });
  const pathname = usePathname();
  const router = useRouter();

  const membershipsData = userMemberships?.data;
  const hasOrgs = membershipsData && membershipsData.length > 0;

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    // Skip check for onboarding page and partner accept
    if (
      pathname?.includes('/onboarding') ||
      pathname?.includes('/partner/accept')
    ) {
      return;
    }

    // If user has no orgs, redirect to onboarding
    if (!hasOrgs) {
      router.replace('/onboarding');
    }
  }, [isLoaded, hasOrgs, pathname, router]);

  // While loading, show a focused loader to prevent layout shift
  if (!isLoaded) {
    return (
      <div
        className="flex h-screen items-center justify-center bg-background"
        aria-label="Loading workspace"
      >
        <Spinner className="size-7 text-accent-foreground" />
      </div>
    );
  }

  // If no orgs and not on onboarding/partner paths, redirect
  // This is a safety fallback for the client side, though the server in AppLayout handles most of this now.
  const isPublicPath =
    pathname?.includes('/onboarding') || pathname?.includes('/partner/accept');
  if (!hasOrgs && !isPublicPath) {
    return (
      <div
        className="flex h-screen items-center justify-center bg-background"
        aria-label="Loading workspace"
      >
        <Spinner className="size-7 text-accent-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
