'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { useOrganization, useAuth } from '@clerk/nextjs';
import { Button } from '@repo/design-system/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@repo/design-system/components/ui/card';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Input } from '@repo/design-system/components/ui/input';
import { Switch } from '@repo/design-system/components/ui/switch';
import { cn } from '@repo/design-system/lib/utils';
import {
  MapPinIcon, UsersIcon, Link2Icon, PlusIcon, Trash2Icon,
  Loader2Icon, CheckIcon, SendIcon, CopyIcon,
  SettingsIcon, ChevronRightIcon, ShieldIcon
} from 'lucide-react';

// --- Interfaces ---

interface TeamMember {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  role: 'org:admin' | 'org:member' | 'partner';
  assignedPoolIds: string[];
}

interface Pool {
  id: string;
  name: string;
  locationIds: string[];
  syncInventory: boolean;
  syncPricing: boolean;
}

interface Location {
  platformLocationId: string;
  locationName: string;
  connectionName: string;
  platformType: string;
}

interface Partnership {
  id: string;
  partnerOrgName?: string;
  partnerEmail: string;
  poolName: string;
  productCount: number;
}

interface PendingInvite {
  id: string;
  email: string;
  poolName: string;
  expiresAt: string;
  inviteLink: string;
}

type Tab = 'pools' | 'partners' | 'team';

const PLATFORM_LOGOS: Record<string, string> = {
  shopify: '/icons/shopify.svg', // adjustments may be needed for actual paths
  square: '/icons/square.svg',
  clover: '/icons/clover.svg',
};

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333').replace(/\/$/, '');

export default function PoolsAndPartnersClient() {
  const { organization, isLoaded: isOrgLoaded } = useOrganization();
  const { getToken, isLoaded: isAuthLoaded } = useAuth();
  const orgId = organization?.id;

  // View State
  const [activeTab, setActiveTab] = useState<Tab>('pools');
  const [isLoading, setIsLoading] = useState(true);

  // Data State
  const [pools, setPools] = useState<Pool[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);

  // Editing State
  const [editingPool, setEditingPool] = useState<Partial<Pool> | null>(null);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

  // Invite State
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePoolId, setInvitePoolId] = useState('');
  const [inviteCanRevoke, setInviteCanRevoke] = useState(true); // Default: consignment mode
  const [isInviting, setIsInviting] = useState(false);

  // Invite Success Modal State
  const [showInviteSuccess, setShowInviteSuccess] = useState(false);
  const [createdInviteLink, setCreatedInviteLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  const loadData = useCallback(async () => {
    if (!orgId) return;

    setIsLoading(true);
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };

      // Parallel Fetching
      const [poolsRes, locsRes, partnersRes, invitesRes] = await Promise.all([
        fetch(`${API_BASE}/api/pools/org/${orgId}`, { headers }),
        fetch(`${API_BASE}/api/pools/locations/available?orgId=${orgId}`, { headers }),
        fetch(`${API_BASE}/api/cross-org/partnerships`, { headers }).catch(() => null),
        fetch(`${API_BASE}/api/cross-org/invites/pending`, { headers }).catch(() => null),
      ]);

      if (poolsRes.ok) setPools(await poolsRes.json());
      if (locsRes.ok) {
        // Transform the nested structure from available locations endpoint to flat list
        const rawLocs: Record<string, any> = await locsRes.json();
        const flatLocs: Location[] = [];

        // The endpoint returns { connectionId: { platformType, connectionName, locations: [...] } }
        Object.values(rawLocs).forEach((conn: any) => {
          if (conn.locations) {
            conn.locations.forEach((l: any) => {
              flatLocs.push({
                platformLocationId: l.platformLocationId,
                locationName: l.locationName,
                connectionName: conn.connectionName,
                platformType: conn.platformType || 'unknown'
              });
            });
          }
        });
        setLocations(flatLocs);
      }

      if (partnersRes?.ok) {
        const pData = await partnersRes.json();
        setPartnerships(pData.partnerships || []);
      }

      if (invitesRes?.ok) {
        const iData = await invitesRes.json();
        setPendingInvites(iData.sent || []);
      }

      // Load Team Members
      if (organization?.getMemberships) {
        const membershipList = await organization.getMemberships();
        const membersData = membershipList.data || [];

        const loadedMembers: TeamMember[] = [];
        // Fetch permissions for each member
        await Promise.all(membersData.map(async (m) => {
          const uid = m.publicUserData?.userId;
          if (!uid) return;

          try {
            const permRes = await fetch(`${API_BASE}/api/organizations/${orgId}/members/${uid}/permissions`, { headers });
            const perms = permRes.ok ? await permRes.json() : {};

            loadedMembers.push({
              userId: uid,
              email: m.publicUserData?.identifier || '',
              firstName: m.publicUserData?.firstName || '',
              lastName: m.publicUserData?.lastName || '',
              imageUrl: m.publicUserData?.imageUrl,
              role: m.role as any,
              assignedPoolIds: perms.assignedPoolIds || [],
            });
          } catch (e) {
            console.error('Error fetching perms', e);
          }
        }));
        setMembers(loadedMembers);
      }

    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [orgId, getToken, organization]);

  useEffect(() => {
    if (isOrgLoaded && isAuthLoaded && orgId) {
      loadData();
    }
  }, [isOrgLoaded, isAuthLoaded, orgId, loadData]);

  // --- Actions ---

  const savePool = async () => {
    if (!editingPool || !orgId) return;

    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

      const body = {
        orgId,
        name: editingPool.name,
        syncInventory: editingPool.syncInventory ?? true,
        syncPricing: editingPool.syncPricing ?? true,
        location_ids: selectedLocations
      };

      let res;
      if (editingPool.id === 'new') {
        res = await fetch(`${API_BASE}/api/pools`, { method: 'POST', headers, body: JSON.stringify(body) });
      } else {
        res = await fetch(`${API_BASE}/api/pools/${editingPool.id}`, { method: 'PATCH', headers, body: JSON.stringify(body) });
      }

      if (res.ok) {
        setEditingPool(null);
        setSelectedLocations([]);
        loadData();
      }
    } catch (error) {
      console.error('Failed to save pool:', error);
    }
  };

  const deletePool = async (poolId: string) => {
    if (!confirm('Are you sure you want to delete this pool?')) return;
    try {
      const token = await getToken();
      await fetch(`${API_BASE}/api/pools/${poolId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      loadData();
    } catch (error) {
      console.error('Failed to delete pool:', error);
    }
  };

  const sendPartnerInvite = async () => {
    if (!inviteEmail || !invitePoolId || !orgId) return;

    setIsInviting(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/cross-org/invites`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviteeEmail: inviteEmail,
          poolId: invitePoolId,
          shareType: inviteCanRevoke ? 'consignment' : 'sync',
          syncDirection: 'bidirectional',
          canRevoke: inviteCanRevoke,
        })
      });

      if (res.ok) {
        const data = await res.json();
        const inviteLink = data.inviteLink || '';
        setCreatedInviteLink(inviteLink);
        setShowInviteSuccess(true);
        setLinkCopied(false);
        setInviteEmail('');
        setInvitePoolId('');
        setInviteCanRevoke(true); // Reset to default
        loadData();
      } else {
        const errText = await res.text();
        alert(`Failed to send invite: ${errText}`);
      }
    } catch (e) {
      console.error('Failed to send invite:', e);
      alert('Failed to send invite');
    } finally {
      setIsInviting(false);
    }
  };

  const toggleMemberPool = async (userId: string, poolId: string, checked: boolean) => {
    if (!orgId) return;

    // Optimistic update
    setMembers(prev => prev.map(m => {
      if (m.userId !== userId) return m;
      const newIds = checked
        ? [...m.assignedPoolIds, poolId]
        : m.assignedPoolIds.filter(id => id !== poolId);
      return { ...m, assignedPoolIds: newIds };
    }));

    try {
      const token = await getToken();
      const member = members.find(m => m.userId === userId);
      if (!member) return;

      const newIds = checked
        ? [...member.assignedPoolIds, poolId]
        : member.assignedPoolIds.filter(id => id !== poolId);

      await fetch(`${API_BASE}/api/organizations/${orgId}/members/${userId}/permissions`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedPoolIds: newIds })
      });
    } catch (e) {
      console.error(e);
      loadData(); // Revert
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString();

  if (!isOrgLoaded || !isAuthLoaded) {
    return <div className="p-8 flex justify-center"><Loader2Icon className="animate-spin" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-1">
        <Button
          variant={activeTab === 'pools' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('pools')}
          className={cn("gap-2 rounded-t-lg rounded-b-none border-b-2", activeTab === 'pools' ? "border-[#647653] bg-white text-[#647653] hover:bg-gray-50 hover:text-[#647653]" : "border-transparent text-gray-500")}
        >
          <MapPinIcon className="w-4 h-4" />
          Pools
        </Button>
        <Button
          variant={activeTab === 'team' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('team')}
          className={cn("gap-2 rounded-t-lg rounded-b-none border-b-2", activeTab === 'team' ? "border-[#647653] bg-white text-[#647653] hover:bg-gray-50 hover:text-[#647653]" : "border-transparent text-gray-500")}
        >
          <UsersIcon className="w-4 h-4" />
          Team Access
        </Button>
        <Button
          variant={activeTab === 'partners' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('partners')}
          className={cn("gap-2 rounded-t-lg rounded-b-none border-b-2", activeTab === 'partners' ? "border-[#647653] bg-white text-[#647653] hover:bg-gray-50 hover:text-[#647653]" : "border-transparent text-gray-500")}
        >
          <Link2Icon className="w-4 h-4" />
          Partners
        </Button>
      </div>

      {isLoading ? (
        <div className="p-12 flex justify-center">
          <Loader2Icon className="w-8 h-8 animate-spin text-gray-300" />
        </div>
      ) : (
        <>
          {/* === POOLS TAB === */}
          {activeTab === 'pools' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Pools</h2>
                  <p className="text-gray-600">Group locations that share inventory and pricing.</p>
                </div>
                <Button
                  onClick={() => {
                    setEditingPool({ id: 'new', name: '', syncInventory: true, syncPricing: true });
                    setSelectedLocations([]);
                  }}
                  className="bg-[#647653] hover:bg-[#556145] text-white"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  New Pool
                </Button>
              </div>

              {/* Pool Editor */}
              {editingPool && (
                <Card className="border-2 border-[#647653]">
                  <CardHeader>
                    <CardTitle>{editingPool.id === 'new' ? 'Create Pool' : 'Edit Pool'}</CardTitle>
                    <CardDescription>Configure your pool settings and select locations.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Pool Name</label>
                      <Input
                        placeholder="e.g. West Coast Stores"
                        value={editingPool.name || ''}
                        onChange={(e) => setEditingPool({ ...editingPool, name: e.target.value })}
                        className="focus:ring-[#647653]"
                      />
                    </div>

                    <div className="flex gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Switch
                          checked={editingPool.syncInventory ?? true}
                          onCheckedChange={(checked) =>
                            setEditingPool({ ...editingPool, syncInventory: checked })
                          }
                        />
                        <span className="text-sm">Sync Inventory</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <Switch
                          checked={editingPool.syncPricing ?? true}
                          onCheckedChange={(checked) =>
                            setEditingPool({ ...editingPool, syncPricing: checked })
                          }
                        />
                        <span className="text-sm">Sync Pricing</span>
                      </label>
                    </div>

                    {/* Location Selection */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Locations ({selectedLocations.length} selected)
                      </label>
                      <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                        {locations.length === 0 ? (
                          <p className="p-4 text-sm text-gray-500 text-center">No locations available</p>
                        ) : (
                          locations.map((loc) => {
                            const isSelected = selectedLocations.includes(loc.platformLocationId);
                            // Simple icon fallback if not using explicit SVG paths
                            // const logo = PLATFORM_LOGOS[loc.platformType]; 

                            return (
                              <div
                                key={loc.platformLocationId}
                                onClick={() =>
                                  setSelectedLocations((prev) =>
                                    isSelected
                                      ? prev.filter((id) => id !== loc.platformLocationId)
                                      : [...prev, loc.platformLocationId]
                                  )
                                }
                                className={cn(
                                  'flex items-center justify-between p-3 cursor-pointer border-b last:border-b-0 transition-colors',
                                  isSelected ? 'bg-[#647653]/10' : 'hover:bg-gray-50'
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <div>
                                    <div className="font-medium text-sm">{loc.locationName}</div>
                                    <div className="text-xs text-gray-500">{loc.connectionName}</div>
                                  </div>
                                </div>
                                {isSelected && <CheckIcon className="w-5 h-5 text-[#647653]" />}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingPool(null);
                          setSelectedLocations([]);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={savePool}
                        disabled={!editingPool.name || selectedLocations.length === 0}
                        className="bg-[#647653] hover:bg-[#556145] text-white"
                      >
                        {editingPool.id === 'new' ? 'Create Pool' : 'Save Changes'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Pool List */}
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle>Your Pools</CardTitle>
                  <CardDescription>Manage inventory sync groups</CardDescription>
                </CardHeader>
                <CardContent>
                  {pools.length === 0 ? (
                    <div className="text-center py-8">
                      <MapPinIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No pools yet. Create one to get started.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pools.map((pool) => (
                        <div
                          key={pool.id}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-[#647653]/10 flex items-center justify-center">
                              <MapPinIcon className="w-5 h-5 text-[#647653]" />
                            </div>
                            <div>
                              <div className="font-medium">{pool.name}</div>
                              <div className="flex items-center gap-3 text-sm text-gray-500">
                                <span>{pool.locationIds.length} locations</span>
                                {pool.syncInventory && (
                                  <Badge className="bg-[#647653] text-white text-xs">Inventory</Badge>
                                )}
                                {pool.syncPricing && (
                                  <Badge className="bg-blue-100 text-blue-800 text-xs">Pricing</Badge>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingPool(pool);
                                setSelectedLocations(pool.locationIds);
                              }}
                            >
                              <SettingsIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deletePool(pool.id)}
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2Icon className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* === TEAM TAB === */}
          {activeTab === 'team' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold">Team Access</h2>
                <p className="text-gray-600">Control which pools each team member can access.</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {members.map((member) => (
                  <Card key={member.userId} className="overflow-hidden">
                    <div className="flex flex-col md:flex-row md:items-center p-4 gap-4">
                      {/* Member Info */}
                      <div className="flex items-center gap-4 min-w-[200px]">
                        {member.imageUrl ? (
                          <div className="relative w-10 h-10">
                            <Image src={member.imageUrl} alt="" fill className="rounded-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500">
                            {member.firstName?.[0] || member.email[0]}
                          </div>
                        )}
                        <div>
                          <div className="font-medium">
                            {member.firstName} {member.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{member.email}</div>
                          <div className="flex mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {member.role.replace('org:', '')}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Permissions Matrix */}
                      <div className="flex-1 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-4">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                          Allowed Pools
                        </h4>

                        {member.role === 'org:admin' ? (
                          <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                            <ShieldIcon className="w-4 h-4 text-[#647653]" />
                            <span>Admins have full access to all pools.</span>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {pools.length === 0 ? (
                              <p className="text-sm text-gray-400 italic">No pools created yet.</p>
                            ) : (
                              pools.map(pool => {
                                const hasAccess = member.assignedPoolIds.includes(pool.id);
                                return (
                                  <button
                                    key={pool.id}
                                    onClick={() => toggleMemberPool(member.userId, pool.id, !hasAccess)}
                                    className={cn(
                                      "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all border",
                                      hasAccess
                                        ? "bg-[#647653]/10 border-[#647653] text-[#647653] hover:bg-[#647653]/20"
                                        : "bg-gray-50 border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600"
                                    )}
                                  >
                                    {hasAccess ? <CheckIcon className="w-3 h-3" /> : <PlusIcon className="w-3 h-3" />}
                                    {pool.name}
                                  </button>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* === PARTNERS TAB === */}
          {activeTab === 'partners' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold">Partners</h2>
                <p className="text-gray-600">
                  Share inventory with external partners. They get their own copy that stays in sync.
                </p>
              </div>

              {/* Invite Partner Card */}
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle>Invite a Partner</CardTitle>
                  <CardDescription>
                    Send an invite link. They'll get a copy of your products to add to their platforms.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Partner Email</label>
                      <Input
                        type="email"
                        placeholder="partner@company.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Share Pool</label>
                      <select
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#647653]"
                        value={invitePoolId}
                        onChange={(e) => setInvitePoolId(e.target.value)}
                      >
                        <option value="">Select a pool...</option>
                        {pools.map((pool) => (
                          <option key={pool.id} value={pool.id}>
                            {pool.name} ({pool.locationIds.length} locations)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Consignment Mode Toggle */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex-1 mr-4">
                        <span className="font-medium text-gray-900">Consignment Mode</span>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {inviteCanRevoke
                            ? 'You retain control. Can revoke products anytime.'
                            : 'Partner gets permanent copies. Cannot revoke.'}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={inviteCanRevoke}
                          onChange={(e) => setInviteCanRevoke(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[#647653]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#647653]"></div>
                      </label>
                    </div>
                  </div>

                  <Button
                    onClick={sendPartnerInvite}
                    disabled={!inviteEmail || !invitePoolId || isInviting}
                    className="bg-[#647653] hover:bg-[#556145] text-white"
                  >
                    {isInviting ? (
                      <Loader2Icon className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <SendIcon className="w-4 h-4 mr-2" />
                    )}
                    Send Invite
                  </Button>
                </CardContent>
              </Card>

              {/* Pending Invites */}
              {pendingInvites.length > 0 && (
                <Card className="border border-gray-200">
                  <CardHeader>
                    <CardTitle>Pending Invites</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {pendingInvites.map((invite) => (
                        <div
                          key={invite.id}
                          className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                        >
                          <div>
                            <div className="font-medium">{invite.email}</div>
                            <div className="text-sm text-gray-500">
                              Pool: {invite.poolName} · Expires {formatDate(invite.expiresAt)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-amber-100 text-amber-800">Pending</Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(invite.inviteLink);
                                alert('Link copied!');
                              }}
                            >
                              <CopyIcon className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Active Partnerships */}
              <Card className="border border-gray-200">
                <CardHeader>
                  <CardTitle>Active Partnerships</CardTitle>
                  <CardDescription>Partners with synced inventory access</CardDescription>
                </CardHeader>
                <CardContent>
                  {partnerships.length === 0 ? (
                    <div className="text-center py-8">
                      <Link2Icon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No active partnerships yet.</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Send an invite above to share inventory with a partner.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {partnerships.map((partner) => (
                        <div
                          key={partner.id}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#647653] to-[#556145] flex items-center justify-center text-white font-semibold">
                              {partner.partnerOrgName?.[0] || partner.partnerEmail[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="font-medium">
                                {partner.partnerOrgName || partner.partnerEmail}
                              </div>
                              <div className="text-sm text-gray-500">
                                {partner.productCount} products synced · Pool: {partner.poolName}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-[#647653] text-white">Active</Badge>
                            <Button variant="ghost" size="sm">
                              <ChevronRightIcon className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}

      {/* Invite Success Modal */}
      {showInviteSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="text-center mb-4">
              <div className="text-5xl mb-3">🎉</div>
              <h2 className="text-xl font-bold text-gray-900">Invite Sent!</h2>
              <p className="text-gray-600 mt-2">
                An email has been sent to your partner. Share this link if they didn't receive it:
              </p>
            </div>

            <div className="bg-gray-100 rounded-lg p-3 mb-4">
              <input
                type="text"
                readOnly
                value={createdInviteLink}
                className="w-full bg-transparent text-sm text-gray-700 outline-none"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={async () => {
                  await navigator.clipboard.writeText(createdInviteLink);
                  setLinkCopied(true);
                  setTimeout(() => setLinkCopied(false), 2000);
                }}
                className="flex-1 bg-[#647653] hover:bg-[#556647] text-white"
              >
                {linkCopied ? '✓ Copied!' : 'Copy Link'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowInviteSuccess(false)}
                className="flex-1"
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


