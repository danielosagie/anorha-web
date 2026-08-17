'use client';

import { useOrganizationList } from '@clerk/nextjs';
import { Spinner } from '@repo/design-system/components/ui/spinner';
import { usePathname, useRouter } from 'next/navigation';
import { type ReactNode, useEffect } from 'react';

type OrgGuardProps = {
  readonly children: ReactNode;
};

/**
 * Ensures the user has at least one organization, redirecting to /onboarding if
 * they do not.
 *
 * The membership answer has three states, not two. Treating "we have not been
 * told yet" as "there are none" is what made every deep link bounce: on a cold
 * load Clerk flips the hook's top-level `isLoaded` to true before the paginated
 * membership request comes back, so for a tick the list looked empty, this
 * guard redirected to /onboarding, and /onboarding's server component saw a real
 * organization and redirected to "/". Pasting any URL landed you on the
 * dashboard.
 *
 * So: `pending` waits, `none` redirects, `resolved` renders. A failed request is
 * deliberately `resolved` rather than `none` — an error is not an answer, and
 * AppLayout already does this check on the server where it is authoritative.
 * The client guard is the fallback, so it errs towards showing the page.
 */
type MembershipStatus = 'pending' | 'resolved' | 'none';

export function OrgGuard({ children }: OrgGuardProps) {
  const { userMemberships, isLoaded } = useOrganizationList({
    userMemberships: {
      infinite: true,
    },
  });
  const pathname = usePathname();
  const router = useRouter();

  // `isLoading` is Clerk's own "request in flight and nothing fetched yet",
  // which is exactly the pending signal `isLoaded` alone does not give.
  let status: MembershipStatus;
  if (!isLoaded || !userMemberships || userMemberships.isLoading) {
    status = 'pending';
  } else if (userMemberships.isError) {
    status = 'resolved';
  } else if ((userMemberships.data?.length ?? 0) > 0) {
    status = 'resolved';
  } else {
    status = 'none';
  }

  // Onboarding and partner acceptance are reachable without an organization.
  const isPublicPath = Boolean(
    pathname?.includes('/onboarding') || pathname?.includes('/partner/accept')
  );

  useEffect(() => {
    if (status !== 'none' || isPublicPath) {
      return;
    }

    router.replace('/onboarding');
  }, [status, isPublicPath, router]);

  // Pending shows a loader rather than a redirect. So does a resolved-empty
  // answer, for the frame between deciding to redirect and arriving.
  if (status === 'pending' || (status === 'none' && !isPublicPath)) {
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
