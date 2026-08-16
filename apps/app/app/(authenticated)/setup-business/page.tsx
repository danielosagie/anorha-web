import { auth } from '@repo/auth/server';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { PageWrapper } from '../components/page-wrapper';
import { SetupBusinessClient } from './setup-business-client';

export const metadata: Metadata = {
  title: 'Business address | Anorha',
  description: 'The address used for shipping, returns, and channel locations.',
};

export default async function SetupBusinessPage() {
  // The same resolution the settings business panel uses for this endpoint:
  // Clerk's active organization, read on the server. The old client-side read
  // of /api/organizations/active fetched a route that does not exist.
  const { orgId, userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  if (!orgId) {
    return (
      <PageWrapper
        description="Used for shipping, returns, and channel locations."
        title="Business address"
      >
        <div className="rounded-[1.125rem] border bg-card p-5 font-medium text-muted-foreground text-sm">
          Select an organization to set a business address.
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      description="Used for shipping, returns, and channel locations."
      title="Business address"
    >
      <SetupBusinessClient orgId={orgId} />
    </PageWrapper>
  );
}
