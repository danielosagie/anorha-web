import { env } from '@/env';
import { auth, clerkClient, currentUser } from '@repo/auth/server';
import { SidebarProvider } from '@repo/design-system/components/ui/sidebar';
import { showBetaFeature } from '@repo/feature-flags';
import { NotificationsProvider } from '@repo/notifications/components/provider';
import { secure } from '@repo/security';
import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { OrgGuard } from './components/org-guard';
import { PostHogIdentifier } from './components/posthog-identifier';
import { GlobalSidebar } from './components/sidebar';

type AppLayoutProperties = {
  readonly children: ReactNode;
};

// Arcjet reports a denial by throwing. Thrown from a layout, that renders the Next
// error page, so the whole workspace answered every crawler with a 500 instead of a
// page. Receipt: Vercel runtime error group "Error: No bots allowed", route "/", 15
// occurrences, last 2026-08-16. Verified live: Googlebot user agent got 500 on "/",
// "/connections" and "/orders" while a Chrome user agent got the normal 307 to
// sign-in. The workspace is already behind Clerk, so a denial only needs to stop the
// request, never to crash it.
const isDeniedByArcjet = async (): Promise<boolean> => {
  if (!env.ARCJET_KEY) {
    return false;
  }

  try {
    await secure(['CATEGORY:PREVIEW']);
    return false;
  } catch {
    return true;
  }
};

const AccessNotice = () => (
  <main className="flex min-h-svh flex-col items-center justify-center gap-2 p-6 text-center">
    <h1 className="font-semibold text-lg">Access blocked</h1>
    <p className="text-muted-foreground text-sm">
      This request was not allowed. Sign in from a browser to continue.
    </p>
  </main>
);

const AppLayout = async ({ children }: AppLayoutProperties) => {
  const user = await currentUser();
  const { redirectToSignIn, orgId, userId } = await auth();
  const betaFeature = await showBetaFeature();

  // Anonymous visitors, including crawlers, get the ordinary sign-in redirect. The
  // bot rule then applies to signed-in sessions only, which keeps a denied request
  // from bouncing between here and a sign-in page it is already authenticated for.
  if (!user) {
    return redirectToSignIn();
  }

  if (await isDeniedByArcjet()) {
    return <AccessNotice />;
  }

  // Pre-emptive server-side check to fix "flashing" navigation
  // If user is logged in but has no active org, check if they have ANY memberships
  if (!orgId && userId) {
    const client = await clerkClient();
    const memberships = await client.users.getOrganizationMembershipList({
      userId,
    });

    if (memberships.data.length === 0) {
      redirect('/onboarding');
    }
  }

  return (
    <NotificationsProvider userId={user.id}>
      <OrgGuard>
        <SidebarProvider>
          <GlobalSidebar>
            {betaFeature && (
              <div className="mx-4 mt-4 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-3 text-center font-semibold text-accent-foreground text-sm md:mx-8 lg:mx-10">
                A new beta feature is ready to try.
              </div>
            )}
            {children}
          </GlobalSidebar>
          <PostHogIdentifier />
        </SidebarProvider>
      </OrgGuard>
    </NotificationsProvider>
  );
};

export default AppLayout;
