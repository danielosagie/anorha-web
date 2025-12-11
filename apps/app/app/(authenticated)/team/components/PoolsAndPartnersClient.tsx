'use client';

import React from 'react';
import Image, { type StaticImageData } from 'next/image';
import { useOrganization, useAuth } from '@clerk/nextjs';
import { Button } from '@repo/design-system/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@repo/design-system/components/ui/card';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Input } from '@repo/design-system/components/ui/input';
import { Switch } from '@repo/design-system/components/ui/switch';
import { cn } from '@repo/design-system/lib/utils';
import { 
  MapPinIcon, UsersIcon, Link2Icon, PlusIcon, Trash2Icon, 
  Loader2Icon, CheckIcon, XIcon, SendIcon, CopyIcon,
  RefreshCwIcon, SettingsIcon, ChevronRightIcon
} from 'lucide-react';

// Platform logos
import shopifyLogo from '../../../assets/shopify.png';
import squareLogo from '../../../assets/square.png';
import cloverLogo from '../../../assets/clover.png';

// ============================================================================
// TYPES
// ============================================================================

interface Pool {
  id: string;
  name: string;
  description?: string;
  syncInventory: boolean;
  syncPricing: boolean;
  locationIds: string[];
}

interface Location {
  platformLocationId: string;
  locationName: string;
  platformType: string;
  connectionName: string;
}

interface Partnership {
  id: string;
  partnerOrgName: string;
  partnerEmail: string;
  poolName: string;
  productCount: number;
  status: 'active' | 'pending';
  createdAt: string;
}

interface PendingInvite {
  id: string;
  email: string;
  poolName: string;
  expiresAt: string;
  inviteLink: string;
}

type Tab = 'pools' | 'partners';

const PLATFORM_LOGOS: Record<string, StaticImageData> = {
  shopify: shopifyLogo,
  square: squareLogo,
  clover: cloverLogo,
};

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333').replace(/\/$/, '');

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PoolsAndPartnersClient() {
  const { organization, isLoaded } = useOrganization();
  const { getToken } = useAuth();
  const orgId = organization?.id;

  // Tab state
  const [activeTab, setActiveTab] = React.useState<Tab>('pools');

  // Data state
  const [pools, setPools] = React.useState<Pool[]>([]);
  const [locations, setLocations] = React.useState<Location[]>([]);
  const [partnerships, setPartnerships] = React.useState<Partnership[]>([]);
  const [pendingInvites, setPendingInvites] = React.useState<PendingInvite[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Pool editing state
  const [editingPool, setEditingPool] = React.useState<Partial<Pool> | null>(null);
  const [selectedLocations, setSelectedLocations] = React.useState<string[]>([]);

  // Partner invite state
  const [inviteEmail, setInviteEmail] = React.useState('');
  const [invitePoolId, setInvitePoolId] = React.useState('');
  const [isInviting, setIsInviting] = React.useState(false);

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'pools', label: 'Pools', icon: <MapPinIcon className="w-4 h-4" /> },
    { id: 'partners', label: 'Partners', icon: <Link2Icon className="w-4 h-4" /> },
  ];

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  const loadData = React.useCallback(async () => {
    if (!orgId) return;
    setIsLoading(true);

    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };

      const [poolsRes, locsRes, partnersRes, invitesRes] = await Promise.all([
        fetch(`${API_BASE}/api/pools/org/${orgId}`, { headers }),
        fetch(`${API_BASE}/api/pools/locations/available?orgId=${orgId}`, { headers }),
        fetch(`${API_BASE}/api/cross-org/partnerships`, { headers }).catch(() => null),
        fetch(`${API_BASE}/api/cross-org/invites/pending`, { headers }).catch(() => null),
      ]);

      // Process pools
      if (poolsRes.ok) {
        const data = await poolsRes.json();
        setPools(
          (Array.isArray(data) ? data : [])
            .filter((p: any) => !p.deletedAt && !p.deleted_at)
            .map((p: any) => ({
              id: p.id,
              name: p.name,
              description: p.description,
              syncInventory: p.syncInventory ?? p.sync_inventory ?? true,
              syncPricing: p.syncPricing ?? p.sync_pricing ?? true,
              locationIds: p.locationIds || p.location_ids || [],
            }))
        );
      }

      // Process locations (flatten from grouped format)
      if (locsRes.ok) {
        const data = await locsRes.json();
        const flat: Location[] = [];
        for (const [, group] of Object.entries(data as Record<string, any>)) {
          for (const loc of group.locations || []) {
            flat.push({
              platformLocationId: loc.platformLocationId,
              locationName: loc.locationName,
              platformType: group.platformType?.toLowerCase() || 'unknown',
              connectionName: group.connectionName || '',
            });
          }
        }
        setLocations(flat);
      }

      // Process partnerships
      if (partnersRes?.ok) {
        const data = await partnersRes.json();
        setPartnerships(data.partnerships || []);
      }

      // Process pending invites
      if (invitesRes?.ok) {
        const data = await invitesRes.json();
        setPendingInvites(data.sent || []);
      }
    } catch (e) {
      console.error('[PoolsAndPartnersClient] Error loading data:', e);
    } finally {
      setIsLoading(false);
    }
  }, [orgId, getToken]);

  React.useEffect(() => {
    if (isLoaded && orgId) loadData();
  }, [isLoaded, orgId, loadData]);

  // ============================================================================
  // POOL OPERATIONS
  // ============================================================================

  const savePool = async () => {
    if (!editingPool?.name || !orgId) return;

    try {
      const token = await getToken();
      const isNew = !editingPool.id || editingPool.id === 'new';

      const res = await fetch(`${API_BASE}/api/pools${isNew ? '' : `/${editingPool.id}`}`, {
        method: isNew ? 'POST' : 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          name: editingPool.name,
          description: editingPool.description,
          syncInventory: editingPool.syncInventory ?? true,
          syncPricing: editingPool.syncPricing ?? true,
          locationIds: selectedLocations,
        }),
      });

      if (!res.ok) throw new Error('Failed to save pool');

      setEditingPool(null);
      setSelectedLocations([]);
      await loadData();
    } catch (e) {
      console.error('Error saving pool:', e);
    }
  };

  const deletePool = async (id: string) => {
    if (!confirm('Delete this pool? Locations will be unassigned but not deleted.')) return;

    try {
      const token = await getToken();
      await fetch(`${API_BASE}/api/pools/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      await loadData();
    } catch (e) {
      console.error('Error deleting pool:', e);
    }
  };

  // ============================================================================
  // PARTNER INVITE
  // ============================================================================

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
          shareType: 'sync',
          syncDirection: 'bidirectional',
        }),
      });

      if (!res.ok) throw new Error('Failed to send invite');

      const { inviteLink } = await res.json();
      await navigator.clipboard.writeText(inviteLink);
      alert('Invite link copied to clipboard!');

      setInviteEmail('');
      setInvitePoolId('');
      await loadData();
    } catch (e) {
      console.error('Error sending invite:', e);
    } finally {
      setIsInviting(false);
    }
  };

  // ============================================================================
  // HELPERS
  // ============================================================================

  const getLocationById = (id: string) => locations.find((l) => l.platformLocationId === id);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2Icon className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row border-t-2 border-gray-100 gap-6 w-full">
      {/* Sidebar Navigation */}
      <div className="w-full lg:w-48 flex-shrink-0 h-full">
        <div className="rounded-lg p-4">
          <nav className="space-y-2 flex flex-row lg:flex-col flex-wrap lg:flex-nowrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 lg:flex-none lg:w-full text-left px-4 py-2 rounded-md transition-colors font-medium text-sm flex items-center gap-2',
                  activeTab === tab.id
                    ? 'bg-gray-200 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                {tab.icon}
                {tab.label}
                {tab.id === 'pools' && pools.length > 0 && (
                  <Badge className="ml-auto bg-[#647653] text-white text-xs">{pools.length}</Badge>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-6 h-full pt-4">
        {/* ================================================================ */}
        {/* POOLS TAB */}
        {/* ================================================================ */}
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

            {/* Pool Editor Card */}
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
                          const logo = PLATFORM_LOGOS[loc.platformType];

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
                                {logo && (
                                  <Image src={logo} alt={loc.platformType} width={20} height={20} />
                                )}
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
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2Icon className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : pools.length === 0 ? (
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

        {/* ================================================================ */}
        {/* PARTNERS TAB */}
        {/* ================================================================ */}
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
      </div>
    </div>
  );
}


