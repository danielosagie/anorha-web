import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Button } from '@repo/design-system/components/ui/button';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Separator } from '@repo/design-system/components/ui/separator';
import { ExternalLinkIcon, SettingsIcon, UsersIcon, Building2Icon, CreditCardIcon, LogOutIcon, NetworkIcon, MapIcon, BellIcon } from 'lucide-react';
import { auth, currentUser } from '@repo/auth/server';
import MemberPermissionsPage from '../team/components/MemberPermissionsPage';
import { OrgProfileClient } from './components/OrgProfileClient';
import { SignOutControl } from './components/SignOutControl';
import { NotificationSettings } from './components/NotificationSettings';

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
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      {/* Page Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Web Settings</h1>
          <p className="text-muted-foreground text-sm md:text-base">Organization-wide configuration. Admins/Owners only.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <a href="/billing">
              <CreditCardIcon className="w-4 h-4 mr-2" />
              Open Billing
            </a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href="/team">
              <UsersIcon className="w-4 h-4 mr-2" />
              Team Manager
            </a>
          </Button>
          <SignOutControl />
        </div>
      </div>

      {/* Organization 
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2Icon className="size-5" />
            Organization
          </CardTitle>
          <CardDescription>Manage name, billing email, timezone, and deletion.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border rounded-md overflow-hidden">
            <OrgProfileClient />
          </div>
        </CardContent>
      </Card>

      Team Management 
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UsersIcon className="size-5" />
            Team Management
          </CardTitle>
          <CardDescription>Invite, revoke, assign roles and pool access.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border rounded-md overflow-hidden">
            <OrgProfileClient />
          </div>
          <Separator />
          <div>
            <div className="text-sm text-muted-foreground mb-2">Fine-grained access by pool</div>
            <MemberPermissionsPage />
          </div>
        </CardContent>
      </Card>

       Integrations - Connected Platforms 
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <NetworkIcon className="size-5" />
            Integrations
          </CardTitle>
          <CardDescription>Connect Shopify, Square, and more.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild variant="default" size="sm">
            <a href="/import">
              <ExternalLinkIcon className="w-4 h-4 mr-2" />
              Add New Integration
            </a>
          </Button>
          To fully wire live connections (list/reconnect/disconnect), I will add /api/platform-connections proxy routes to the backend endpoints on your approval. 
        </CardContent>
      </Card>

      */}

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellIcon className="size-5" />
            Notifications
          </CardTitle>
          <CardDescription>Configure how you receive notifications for sync errors, low stock, and inventory reports.</CardDescription>
        </CardHeader>
        <CardContent>
          {user && (
            <NotificationSettings 
              orgId={orgId} 
              isAdmin={isAdmin}
              userId={user.id}
            />
          )}
        </CardContent>
      </Card>

      {/* Pools & Locations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapIcon className="size-5" />
            Pools & Locations
          </CardTitle>
          <CardDescription>Manage pools used for permissions and syncing.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm font-medium mb-2">Pools</div>
            <div className="grid gap-2">
              {pools.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <div className="font-medium">{p.name}</div>
                    {p.description && <div className="text-sm text-muted-foreground">{p.description}</div>}
                  </div>
                  <Badge variant="secondary">Active</Badge>
                </div>
              ))}
              {pools.length === 0 && (
                <div className="text-sm text-muted-foreground">No pools found.</div>
              )}
            </div>
          </div>
          {/* Locations listing requires platform-connections endpoints. I can wire this once the proxy routes are added. */}
        </CardContent>
      </Card>

      {/* Billing Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCardIcon className="size-5" />
            Billing
          </CardTitle>
          <CardDescription>Plan, usage, and next invoice.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Current Plan</div>
            <div className="font-medium">{subscription?.CurrentPlan || 'Growth'}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Status</div>
            <Badge variant={subscription?.Status === 'active' ? 'default' : 'secondary'}>
              {subscription?.Status || 'active'}
            </Badge>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Next Billing Date</div>
            <div className="font-medium">{nextDue ? nextDue.toLocaleDateString() : '—'}</div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <a href="/billing">
                <SettingsIcon className="w-4 h-4 mr-2" />
                Manage Billing
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
