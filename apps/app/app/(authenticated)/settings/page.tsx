import { auth, currentUser } from '@repo/auth/server';
import { SettingsClient } from './settings-client';
import { PageWrapper } from '../components/page-wrapper';

async function getBillingSummary() {
  const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  try {
    const res = await fetch(`${origin}/api/billing/summary`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function getUpcomingInvoice() {
  const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  try {
    const res = await fetch(`${origin}/api/billing/upcoming`, { cache: 'no-store' });
    if (!res.ok) return { upcoming: null } as any;
    return await res.json();
  } catch {
    return { upcoming: null } as any;
  }
}

async function getPools(orgId: string) {
  const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  try {
    const res = await fetch(`${origin}/api/pools/org/${orgId}`, { cache: 'no-store' });
    if (!res.ok) return [] as Array<{ id: string; name: string; description?: string }>;
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

  if (!orgId) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm md:text-base">Select an organization to manage settings.</p>
      </div>
    );
  }

  const [summary, upcoming, pools] = await Promise.all([
    getBillingSummary(),
    getUpcomingInvoice(),
    getPools(orgId),
  ]);

  const subscription = summary?.subscription || null;
  const nextDue = upcoming?.upcoming?.due_date ? new Date(upcoming.upcoming.due_date) : null;

  return (
     <div className="flex flex-1 flex-col p-2 min-h-[100vh]" style={{ backgroundColor: '#FEF4DD' }}>
      
      <PageWrapper 
        title="Settings"
        description="Manage your account settings and set e-mail preferences."
      >
        <SettingsClient 
          orgId={orgId}
          isAdmin={isAdmin}
          userId={user!.id}
          subscription={subscription}
          nextDue={nextDue}
          pools={pools}
        />
      </PageWrapper>
    </div>
  );
}