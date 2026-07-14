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

const AppLayout = async ({ children }: AppLayoutProperties) => {
  if (env.ARCJET_KEY) {
    await secure(['CATEGORY:PREVIEW']);
  }

  const user = await currentUser();
  const { redirectToSignIn, orgId, userId } = await auth();
  const betaFeature = await showBetaFeature();

  if (!user) {
    return redirectToSignIn();
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
        <SidebarProvider className="bg-background">
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
