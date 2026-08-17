'use client';

import { useAuth, useOrganization, useUser } from '@clerk/nextjs';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Button } from '@repo/design-system/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/design-system/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/design-system/components/ui/dropdown-menu';
import { cn } from '@repo/design-system/lib/utils';
import {
  Loader2,
  Mail,
  MoreVertical,
  Settings,
  UserPlus,
  Users,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { PageWrapper } from '../components/page-wrapper';
import {
  InviteMemberDialog,
  type InvitePool,
  type InviteRole,
} from './components/invite-member-dialog';

// Lazy load heavy components
const PoolsAndPartnersClient = dynamic(
  () => import('./components/PoolsAndPartnersClient'),
  {
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Loading pools...</span>
      </div>
    ),
    ssr: false,
  }
);

type Tab = 'members' | 'pools';

// Roles mapping
const ROLES = {
  'org:admin': 'Admin',
  'org:member': 'Member',
};

// Same base and path shape PoolsAndPartnersClient uses on this screen.
const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'
).replace(/\/$/, '');

/**
 * The backend owns invitations, not Clerk's client SDK: it creates the same
 * Clerk invitation AND parks the pool assignment in OrgMemberInvites, which the
 * organizationMembership.created webhook drains onto the new membership.
 * Inviting through Clerk directly skips that row, so the member joins with no
 * pools and sees nothing.
 */
async function postInvite(
  token: string,
  orgId: string,
  input: { email: string; role: InviteRole; assignedPoolIds: string[] }
): Promise<void> {
  const isMember = input.role === 'org:member';
  const response = await fetch(
    `${API_BASE}/api/organizations/${orgId}/invitations`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: input.email,
        role: isMember ? 'member' : 'admin',
        // Admins see every pool, so the backend ignores any list for them.
        assignedPoolIds: isMember ? input.assignedPoolIds : undefined,
      }),
    }
  );

  if (response.ok) {
    return;
  }

  // The endpoint names its own failures (already a member, pool not in this
  // org, no pool selected). Passing that text through beats a generic message.
  const payload = await response.json().catch(() => null);
  const message =
    payload && typeof payload === 'object' && 'message' in payload
      ? (payload as { message?: string | string[] }).message
      : null;

  throw new Error(
    (Array.isArray(message) ? message[0] : message) ||
      `Failed to send invitation (${response.status})`
  );
}

export default function TeamPage() {
  const { organization, isLoaded, memberships, invitations } = useOrganization({
    memberships: {
      infinite: true,
      keepPreviousData: true,
    },
    invitations: {
      infinite: true,
      keepPreviousData: true,
    },
  });
  const { user } = useUser();
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('members');
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const orgId = organization?.id;

  // Check if current user is admin
  const isAdmin =
    memberships?.data?.find((m) => m.publicUserData.userId === user?.id)
      ?.role === 'org:admin';

  // Same data path PoolsAndPartnersClient uses. That component is lazy-mounted
  // under the Pools tab, so its pools never reach the invite dialog.
  const loadPools = useCallback(async (): Promise<InvitePool[]> => {
    if (!orgId) {
      return [];
    }
    const token = await getToken();
    const response = await fetch(`${API_BASE}/api/pools/org/${orgId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      throw new Error(`Failed to load pools (${response.status})`);
    }
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }, [getToken, orgId]);

  const sendInvite = useCallback(
    async (input: {
      email: string;
      role: InviteRole;
      assignedPoolIds: string[];
    }) => {
      if (!orgId) {
        throw new Error('No organization selected');
      }
      const token = await getToken();
      if (!token) {
        throw new Error('Your session expired. Sign in again.');
      }
      await postInvite(token, orgId, input);
    },
    [getToken, orgId]
  );

  const handleInvited = useCallback(
    (email: string) => {
      toast.success(`Invitation sent to ${email}`);
      // Clerk's hook revalidated itself when it owned the call. The backend
      // creates the invitation now, so ask for the refresh explicitly.
      invitations?.revalidate?.();
    },
    [invitations]
  );

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    try {
      await organization?.removeMember(userId);
      toast.success('Member removed');
    } catch (e: any) {
      toast.error('Failed to remove member');
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    try {
      const invite = invitations?.data?.find((i) => i.id === inviteId);
      await invite?.revoke();
      toast.success('Invitation revoked');
    } catch (e) {
      toast.error('Failed to revoke invitation');
    }
  };

  if (!isLoaded || !organization) {
    return (
      <PageWrapper
        title="Team"
        description="People and partners with access to your workspace."
      >
        <div
          className="flex min-h-64 items-center justify-center"
          aria-label="Loading team"
        >
          <Loader2 className="size-7 animate-spin text-accent-foreground" />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title="Team"
      description="People and partners with access to your workspace."
    >
      <div className="flex max-w-6xl flex-col gap-6">
        {/* Page Header Area */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="font-bold text-[0.6875rem] text-muted-foreground uppercase tracking-[0.1em]">
              Workspace
            </p>
            <h2 className="mt-1 font-extrabold text-xl tracking-[-0.02em]">
              {organization.name}
            </h2>
          </div>

          <div className="flex items-center self-start rounded-2xl bg-muted/70 p-1.5 md:self-auto">
            <button
              onClick={() => setActiveTab('members')}
              className={cn(
                'flex min-h-10 items-center gap-2 rounded-xl px-4 py-2 font-semibold text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                activeTab === 'members'
                  ? 'bg-card text-accent-foreground shadow-xs'
                  : 'text-muted-foreground hover:bg-card/70 hover:text-foreground'
              )}
            >
              <Users className="size-4" />
              Members
            </button>
            <button
              onClick={() => setActiveTab('pools')}
              className={cn(
                'flex min-h-10 items-center gap-2 rounded-xl px-4 py-2 font-semibold text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring',
                activeTab === 'pools'
                  ? 'bg-card text-accent-foreground shadow-xs'
                  : 'text-muted-foreground hover:bg-card/70 hover:text-foreground'
              )}
            >
              <Settings className="size-4" />
              Pools & Partners
            </button>
          </div>
        </div>

        {/* TAB CONTENT */}

        {activeTab === 'members' && (
          <div className="flex flex-col gap-6">
            {/* Members List Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between border-b pb-5">
                <div>
                  <CardTitle className="text-xl">Active Members</CardTitle>
                  <CardDescription>
                    People with access to this organization.
                  </CardDescription>
                </div>
                {isAdmin && (
                  <Button
                    onClick={() => setIsInviteOpen(true)}
                    className="h-11 px-4"
                  >
                    <UserPlus data-icon="inline-start" />
                    Invite member
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                  {memberships?.data?.map((mem) => (
                    <div
                      key={mem.id}
                      className="flex min-h-20 items-center justify-between gap-4 p-4 transition-colors hover:bg-muted/45 md:px-5"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative size-10 overflow-hidden rounded-full border bg-muted">
                          <Image
                            src={mem.publicUserData.imageUrl}
                            alt={mem.publicUserData.identifier}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              {mem.publicUserData.firstName}{' '}
                              {mem.publicUserData.lastName}
                            </span>
                            {mem.publicUserData.userId === user?.id && (
                              <Badge
                                variant="secondary"
                                className="h-5 px-1.5 text-[10px]"
                              >
                                You
                              </Badge>
                            )}
                          </div>
                          <div className="font-medium text-muted-foreground text-sm">
                            {mem.publicUserData.identifier}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="mr-4 hidden flex-col items-end md:flex">
                          <Badge
                            variant="outline"
                            className={cn(
                              'font-semibold text-[10px] uppercase tracking-wider',
                              mem.role === 'org:admin'
                                ? 'border-amber-200 bg-amber-50 text-amber-700'
                                : 'border-blue-200 bg-blue-50 text-blue-700'
                            )}
                          >
                            {ROLES[mem.role as keyof typeof ROLES] || mem.role}
                          </Badge>
                          <span className="mt-1 text-muted-foreground text-xs">
                            Joined{' '}
                            {new Date(mem.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Only admins can manage others, but not themselves here for safety (usually handled by specialized settings) */}
                        {isAdmin && mem.publicUserData.userId !== user?.id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <MoreVertical className="text-muted-foreground" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="cursor-pointer text-red-600 focus:text-red-600"
                                onClick={() =>
                                  handleRemoveMember(mem.publicUserData.userId!)
                                }
                              >
                                Remove Member
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Pending Invites Section */}
            {invitations?.data && invitations.data.length > 0 && (
              <Card className="border-warning/25">
                <CardHeader className="border-b pb-5">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Mail className="size-4 text-warning" />
                    Pending invitations
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-100">
                    {invitations.data.map((inv) => (
                      <div
                        key={inv.id}
                        className="flex items-center justify-between p-4"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex size-10 items-center justify-center rounded-xl bg-warning/10 text-warning">
                            <Mail className="size-5" />
                          </div>
                          <div>
                            <div className="font-semibold">
                              {inv.emailAddress}
                            </div>
                            <div className="font-medium text-muted-foreground text-sm">
                              Invited as{' '}
                              <span className="font-semibold text-foreground">
                                {ROLES[inv.role as keyof typeof ROLES]}
                              </span>{' '}
                              · {new Date(inv.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRevokeInvite(inv.id)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            Revoke
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === 'pools' && (
          <div className="fade-in slide-in-from-bottom-2 animate-in duration-300">
            <PoolsAndPartnersClient />
          </div>
        )}
      </div>

      <InviteMemberDialog
        loadPools={loadPools}
        onInvited={handleInvited}
        onOpenChange={setIsInviteOpen}
        open={isInviteOpen}
        organizationName={organization.name}
        sendInvite={sendInvite}
      />
    </PageWrapper>
  );
}
