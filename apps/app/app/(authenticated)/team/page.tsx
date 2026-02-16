'use client';

import { useState } from 'react';
import { useOrganization, useUser } from '@clerk/nextjs';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import {
  Loader2,
  Settings,
  Users,
  Plus,
  MoreVertical,
  Shield,
  Mail,
  Check,
  X,
  UserPlus
} from 'lucide-react';
import { Button } from '@repo/design-system/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Input } from '@repo/design-system/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@repo/design-system/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/design-system/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/design-system/components/ui/select";
import { Badge } from '@repo/design-system/components/ui/badge';
import { Header } from '../components/header';
import { cn } from '@repo/design-system/lib/utils';
import { toast } from 'sonner';

// Lazy load heavy components
const PoolsAndPartnersClient = dynamic(
  () => import('./components/PoolsAndPartnersClient'),
  {
    loading: () => (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
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
  'org:member': 'Member'
};

export default function TeamPage() {
  const { organization, isLoaded, memberships, invites } = useOrganization({
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
  const [activeTab, setActiveTab] = useState<Tab>('members');

  // Invitation State
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'org:member' | 'org:admin'>('org:member');
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  // Check if current user is admin
  const isAdmin = memberships?.data?.find(m => m.publicUserData.userId === user?.id)?.role === 'org:admin';

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setIsSendingInvite(true);
    try {
      await organization?.inviteMember({
        emailAddress: inviteEmail,
        role: inviteRole,
      });
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      setIsInviteOpen(false);
      // Refresh invites list handled automatically by SWR-like behavior of Clerk hook usually, 
      // but we can force revalidate if needed.
    } catch (err: any) {
      console.error('Invite failed:', err);
      toast.error(err.errors?.[0]?.message || 'Failed to send invitation');
    } finally {
      setIsSendingInvite(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    try {
      await organization?.removeMember(userId);
      toast.success("Member removed");
    } catch (e: any) {
      toast.error("Failed to remove member");
    }
  }

  const handleRevokeInvite = async (inviteId: string) => {
    try {
      const invite = invites?.data?.find(i => i.id === inviteId);
      await invite?.revoke();
      toast.success("Invitation revoked");
    } catch (e) {
      toast.error("Failed to revoke invitation");
    }
  }

  if (!isLoaded || !organization) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#FEF4DD]">
        <Loader2 className="w-8 h-8 animate-spin text-[#647653]" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col p-2 min-h-[100vh] bg-[#FEF4DD]" >
      <div className="bg-[#FFFCF5] rounded-lg border-2 border-[#AFAFAF] p-4 flex flex-col flex-1 overflow-hidden" >
        <Header page="Team" />

        <div className="flex flex-col flex-1 min-h-0 mt-4 space-y-6 overflow-y-auto pr-2">

          {/* Page Header Area */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">{organization.name}</h1>
              <p className="text-gray-500 mt-1">Manage your team members and partner connections.</p>
            </div>

            <div className="flex items-center bg-gray-100/80 p-1 rounded-lg border border-gray-200 self-start md:self-auto">
              <button
                onClick={() => setActiveTab('members')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                  activeTab === 'members'
                    ? "bg-white text-[#647653] shadow-sm ring-1 ring-gray-200"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                )}
              >
                <Users className="w-4 h-4" />
                Team Members
              </button>
              <button
                onClick={() => setActiveTab('pools')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200",
                  activeTab === 'pools'
                    ? "bg-white text-[#647653] shadow-sm ring-1 ring-gray-200"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                )}
              >
                <Settings className="w-4 h-4" />
                Pools & Partners
              </button>
            </div>
          </div>

          {/* TAB CONTENT */}

          {activeTab === 'members' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

              {/* Members List Card */}
              <Card className="border-2 border-gray-100 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-gray-50">
                  <div>
                    <CardTitle className="text-xl">Active Members</CardTitle>
                    <CardDescription>People with access to this organization.</CardDescription>
                  </div>
                  {isAdmin && (
                    <Button
                      onClick={() => setIsInviteOpen(true)}
                      className="bg-[#647653] hover:bg-[#556145] text-white"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Invite Member
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-100">
                    {memberships?.data?.map((mem) => (
                      <div key={mem.id} className="flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gray-200 border border-gray-200">
                            <Image
                              src={mem.publicUserData.imageUrl}
                              alt={mem.publicUserData.identifier}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">
                                {mem.publicUserData.firstName} {mem.publicUserData.lastName}
                              </span>
                              {mem.publicUserData.userId === user?.id && (
                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5">You</Badge>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">{mem.publicUserData.identifier}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="hidden md:flex flex-col items-end mr-4">
                            <Badge
                              variant="outline"
                              className={cn(
                                "uppercase text-[10px] tracking-wider font-semibold",
                                mem.role === 'org:admin' ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-blue-50 text-blue-700 border-blue-200"
                              )}
                            >
                              {ROLES[mem.role as keyof typeof ROLES] || mem.role}
                            </Badge>
                            <span className="text-xs text-gray-400 mt-1">Joined {new Date(mem.createdAt).toLocaleDateString()}</span>
                          </div>

                          {/* Only admins can manage others, but not themselves here for safety (usually handled by specialized settings) */}
                          {isAdmin && mem.publicUserData.userId !== user?.id && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="w-4 h-4 text-gray-400" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  className="text-red-600 focus:text-red-600 cursor-pointer"
                                  onClick={() => handleRemoveMember(mem.publicUserData.userId!)}
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
              {invites?.data && invites.data.length > 0 && (
                <Card className="border-2 border-gray-100 shadow-sm border-t-amber-200">
                  <CardHeader className="pb-2 border-b border-gray-50">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Mail className="w-4 h-4 text-amber-500" />
                      Pending Invitations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-gray-100">
                      {invites.data.map((inv) => (
                        <div key={inv.id} className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600">
                              <Mail className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{inv.emailAddress}</div>
                              <div className="text-sm text-gray-500">
                                Invited as <span className="font-medium text-gray-700">{ROLES[inv.role as keyof typeof ROLES]}</span> • {new Date(inv.createdAt).toLocaleDateString()}
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
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <PoolsAndPartnersClient />
            </div>
          )}

        </div>
      </div>

      {/* Invite Member Dialog */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an email invitation to join <strong>{organization.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Email Address</label>
              <Input
                placeholder="colleague@company.com"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Role</label>
              <Select value={inviteRole} onValueChange={(val: any) => setInviteRole(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="org:member">
                    <div className="flex flex-col items-start py-1">
                      <span className="font-medium">Member</span>
                      <span className="text-xs text-gray-500">Can view and edit but cannot manage organization settings.</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="org:admin">
                    <div className="flex flex-col items-start py-1">
                      <span className="font-medium">Admin</span>
                      <span className="text-xs text-gray-500">Full access to everything including member management.</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteOpen(false)}>Cancel</Button>
            <Button onClick={handleInvite} disabled={!inviteEmail || isSendingInvite} className="bg-[#647653] hover:bg-[#556145] text-white">
              {isSendingInvite ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
