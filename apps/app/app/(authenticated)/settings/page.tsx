import { auth, currentUser } from '@repo/auth/server';
import { redirect } from 'next/navigation';
import { PageWrapper } from '../components/page-wrapper';
import { SettingsClient } from './settings-client';

async function getBillingSummary() {
  const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  try {
    const res = await fetch(`${origin}/api/billing/summary`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      return null;
    }
    return await res.json();
  } catch {
    return null;
  }
}

type UpcomingInvoiceResponse = {
  upcoming: { due_date?: string } | null;
};

async function getUpcomingInvoice(): Promise<UpcomingInvoiceResponse> {
  const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  try {
    const res = await fetch(`${origin}/api/billing/upcoming`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      return { upcoming: null };
    }
    return (await res.json()) as UpcomingInvoiceResponse;
  } catch {
    return { upcoming: null };
  }
}

async function getPools(orgId: string) {
  const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  try {
    const res = await fetch(`${origin}/api/pools/org/${orgId}`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      return [] as Array<{ id: string; name: string; description?: string }>;
    }
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [] as Array<{ id: string; name: string; description?: string }>;
  }
}

export default async function SettingsPage() {
  const { orgId, orgRole } = await auth();
  const user = await currentUser();
  const isAdmin = orgRole === 'org:admin' || orgRole === 'org:owner';

  if (!user) {
    redirect('/sign-in');
  }

  if (!orgId) {
    return (
      <PageWrapper
        title="Settings"
        description="Account, business, channel, and notification preferences."
      >
        <div className="rounded-2xl border bg-card p-5 font-medium text-muted-foreground text-sm">
          Select an organization to manage settings.
        </div>
      </PageWrapper>
    );
  }

  const [summary, upcoming, pools] = await Promise.all([
    getBillingSummary(),
    getUpcomingInvoice(),
    getPools(orgId),
  ]);

  const subscription = summary?.subscription || null;
  const nextDue = upcoming?.upcoming?.due_date
    ? new Date(upcoming.upcoming.due_date)
    : null;

  return (
    <PageWrapper
      title="Settings"
      description="Account, business, channel, and notification preferences."
    >
      <SettingsClient
        orgId={orgId}
        isAdmin={isAdmin}
        userId={user.id}
        subscription={subscription}
        nextDue={nextDue}
        pools={pools}
      />
    </PageWrapper>
  );
}
