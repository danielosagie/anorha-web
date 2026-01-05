'use client';

import { useOrganization, useAuth } from '@clerk/nextjs';
import { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';

// UI Components
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@repo/design-system/components/ui/card';
import { Checkbox } from '@repo/design-system/components/ui/checkbox';
import { Label } from '@repo/design-system/components/ui/label';
import { Button } from '@repo/design-system/components/ui/button';
import { Input } from '@repo/design-system/components/ui/input';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Switch } from '@repo/design-system/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/design-system/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@repo/design-system/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/design-system/components/ui/tooltip';
import { ScrollArea } from '@repo/design-system/components/ui/scroll-area';
import { Separator } from '@repo/design-system/components/ui/separator';
import {
  Plus, X, Trash2, Check, ChevronDown, ChevronRight, RefreshCw, Users,
  MapPin, Link2, Settings, AlertTriangle, Loader2, Activity, Send,
  Shield, Eye, Edit, Zap, Clock, CheckCircle2, XCircle, AlertCircle,
  UserPlus, Mail, Copy, ExternalLink
} from 'lucide-react';

// Import assets
import shopifyIcon from '../../../assets/shopify.svg';
import squareIcon from '../../../assets/square.svg';
import cloverIcon from '../../../assets/clover.svg';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

const PLATFORM_ICONS: Record<string, any> = {
  shopify: shopifyIcon,
  square: squareIcon,
  clover: cloverIcon,
};

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333').replace(/\/$/, '');
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

interface Location {
  platformLocationId: string;
  locationName: string;
  timezone?: string;
  platformConnection?: {
    platformType: string;
    displayName: string;
    id: string;
    status?: string;
    lastSyncAt?: string;
  };
}

interface LocationGroup {
  platformType: string;
  connectionName: string;
  connectionId: string;
  connectionStatus?: string;
  needsReauth?: boolean;
  locations: Location[];
}

interface Pool {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  syncInventory: boolean;
  syncPricing: boolean;
  locationIds: string[];
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

interface TeamMember {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  role: 'org:admin' | 'org:member' | 'partner';
  assignedPoolIds: string[];
  poolPermissions: Record<string, { canRead: boolean; canEdit: boolean; canSync: boolean }>;
}

interface PartnerInvite {
  id: string;
  partnerEmail: string;
  locationIds: string[];
  status: 'pending' | 'accepted' | 'expired';
  expiresAt: string;
  createdAt: string;
}

interface SyncStatus {
  connectionId: string;
  status: 'idle' | 'syncing' | 'error';
  lastSyncAt?: string;
  error?: string;
}

// ============================================================================
// UTILITIES
// ============================================================================

const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
  // In a real app, use sonner or similar
  console.log(`[${type.toUpperCase()}] ${message}`);
};

const formatTimeAgo = (date: string | Date) => {
  const now = new Date();
  const then = new Date(date);
  const diff = now.getTime() - then.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function MemberPermissionsPage() {
  const { organization, isLoaded, membership } = useOrganization();
  const { getToken } = useAuth();

  // Core state
  const [pools, setPools] = useState<Pool[]>([]);
  const [allLocations, setAllLocations] = useState<Record<string, LocationGroup>>({});
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [partnerInvites, setPartnerInvites] = useState<PartnerInvite[]>([]);
  const [syncStatuses, setSyncStatuses] = useState<Record<string, SyncStatus>>({});

  // UI state
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pools' | 'team' | 'partners'>('pools');

  // Pool editing
  const [editingPool, setEditingPool] = useState<Partial<Pool> | null>(null);
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
  const [expandedPlatformId, setExpandedPlatformId] = useState<string | null>(null);

  // Partner invite
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLocationId, setInviteLocationId] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);

  // Reconnect dialog
  const [reconnectDialog, setReconnectDialog] = useState<{ open: boolean; connectionId: string; platformType: string } | null>(null);

  // Realtime subscription refs
  const poolsChannelRef = useRef<RealtimeChannel | null>(null);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);

  const orgId = organization?.id;
  const isAdmin = membership?.role === 'org:admin';

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  const loadData = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);

    try {
      const clerkToken = await getToken();
      const headers = { 'Authorization': `Bearer ${clerkToken}` };

      const [poolsRes, locationsRes, invitesRes] = await Promise.all([
        fetch(`${API_BASE}/api/pools/org/${orgId}`, { headers, cache: 'no-store' }),
        fetch(`${API_BASE}/api/pools/locations/available?orgId=${orgId}`, { headers, cache: 'no-store' }),
        isAdmin ? fetch(`${API_BASE}/api/organizations/${orgId}/partner-invites`, { headers, cache: 'no-store' }).catch(() => null) : null,
      ]);

      // Process pools
      if (poolsRes.ok) {
        const rawData = await poolsRes.json();
        const normalizedPools = (Array.isArray(rawData) ? rawData : []).map((p: any) => ({
          id: p.id,
          orgId: p.orgId || p.org_id,
          name: p.name,
          description: p.description,
          syncInventory: p.syncInventory ?? p.sync_inventory ?? true,
          syncPricing: p.syncPricing ?? p.sync_pricing ?? true,
          locationIds: p.locationIds || p.location_ids || [],
          createdAt: p.createdAt || p.created_at,
          updatedAt: p.updatedAt || p.updated_at,
          deletedAt: p.deletedAt || p.deleted_at || null,
        })).filter((p: Pool) => !p.deletedAt);
        setPools(normalizedPools);
      }

      // Process locations with connection status
      if (locationsRes.ok) {
        const data = await locationsRes.json();
        // Enhance with connection status
        const enhanced: Record<string, LocationGroup> = {};
        for (const [connId, group] of Object.entries(data as Record<string, LocationGroup>)) {
          enhanced[connId] = {
            ...group,
            needsReauth: group.connectionStatus === 'error' || group.connectionStatus === 'inactive',
          };
        }
        setAllLocations(enhanced);

        // Initialize sync statuses
        const statuses: Record<string, SyncStatus> = {};
        for (const [connId, group] of Object.entries(enhanced)) {
          statuses[connId] = {
            connectionId: connId,
            status: group.connectionStatus === 'syncing' ? 'syncing' :
              group.connectionStatus === 'error' ? 'error' : 'idle',
            lastSyncAt: group.locations[0]?.platformConnection?.lastSyncAt,
          };
        }
        setSyncStatuses(statuses);
      }

      // Process partner invites
      if (invitesRes?.ok) {
        const invites = await invitesRes.json();
        setPartnerInvites(Array.isArray(invites) ? invites : []);
      }

      // Load team members
      if (organization?.getMemberships) {
        const membershipList = await organization.getMemberships();
        const membersData = membershipList.data || [];

        const loadedMembers: TeamMember[] = [];
        for (const m of membersData) {
          const uid = m.publicUserData?.userId;
          if (!uid) continue;

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
              poolPermissions: perms.poolPermissions || {}
            });
          } catch (e) {
            console.error(e);
          }
        }
        setMembers(loadedMembers);
      }

    } catch (e) {
      console.error('Failed to load data:', e);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [orgId, getToken, organization, isAdmin]);

  // ============================================================================
  // REALTIME SUBSCRIPTIONS
  // ============================================================================

  useEffect(() => {
    if (!orgId || !SUPABASE_URL || !SUPABASE_ANON_KEY) return;

    // Initialize Supabase client for realtime
    if (!supabaseRef.current) {
      supabaseRef.current = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }

    const supabase = supabaseRef.current;

    // Subscribe to pool changes
    poolsChannelRef.current = supabase
      .channel(`pools-${orgId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'LocationPools',
          filter: `org_id=eq.${orgId}`,
        },
        (payload) => {
          console.log('[Realtime] Pool change:', payload);
          // Refresh data on any change
          loadData();
        }
      )
      .subscribe();

    return () => {
      if (poolsChannelRef.current) {
        supabase.removeChannel(poolsChannelRef.current);
      }
    };
  }, [orgId, loadData]);

  // Initial load
  useEffect(() => {
    if (isLoaded && orgId) loadData();
  }, [isLoaded, orgId, loadData]);

  // ============================================================================
  // POOL OPERATIONS
  // ============================================================================

  const savePool = async () => {
    if (!editingPool || !orgId) return;

    try {
      const clerkToken = await getToken();
      const isNew = !editingPool.id || editingPool.id === 'new';

      const body = {
        orgId: orgId,
        name: editingPool.name,
        description: editingPool.description,
        syncInventory: editingPool.syncInventory ?? true,
        syncPricing: editingPool.syncPricing ?? true,
        locationIds: selectedLocationIds
      };

      const res = await fetch(`${API_BASE}/api/pools${isNew ? '' : `/${editingPool.id}`}`, {
        method: isNew ? 'POST' : 'PATCH',
        headers: {
          'Authorization': `Bearer ${clerkToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to save pool');
      }

      await loadData();
      setEditingPool(null);
      showToast(isNew ? 'Pool created successfully' : 'Pool updated', 'success');
    } catch (e: any) {
      console.error(e);
      showToast(e.message || 'Error saving pool', 'error');
    }
  };

  const handleDeletePool = async (id: string) => {
    if (!confirm('Are you sure you want to delete this pool? Locations will be unassigned but not deleted.')) return;

    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/pools/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Failed to delete');

      setPools(prev => prev.filter(p => p.id !== id));
      showToast('Pool deleted', 'success');
    } catch (e) {
      showToast('Error deleting pool', 'error');
    }
  };

  const triggerPoolSync = async (poolId: string) => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/pools/${poolId}/sync`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Failed to trigger sync');

      showToast('Sync started', 'info');
      // Update sync status optimistically
      const pool = pools.find(p => p.id === poolId);
      if (pool) {
        pool.locationIds.forEach(locId => {
          const connId = getConnectionForLocation(locId);
          if (connId) {
            setSyncStatuses(prev => ({
              ...prev,
              [connId]: { ...prev[connId], status: 'syncing' }
            }));
          }
        });
      }
    } catch (e) {
      showToast('Failed to start sync', 'error');
    }
  };

  // ============================================================================
  // RECONNECT/REAUTH
  // ============================================================================

  const handleReconnect = async (connectionId: string, platformType: string) => {
    try {
      const token = await getToken();

      // For OAuth platforms, redirect to auth flow
      if (platformType === 'shopify' || platformType === 'square' || platformType === 'clover') {
        // Get the reconnect URL from backend
        const res = await fetch(`${API_BASE}/api/auth/${platformType}/reconnect?connectionId=${connectionId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          const { authUrl } = await res.json();
          window.location.href = authUrl;
          return;
        }
      }

      // Fallback: trigger a reconcile to refresh tokens if possible
      const res = await fetch(`${API_BASE}/api/sync/connection/${connectionId}/reconcile`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      if (!res.ok) throw new Error('Failed to reconnect');

      showToast('Reconnection initiated', 'success');
      setReconnectDialog(null);
      await loadData();
    } catch (e) {
      showToast('Failed to reconnect. Please try again.', 'error');
    }
  };

  // ============================================================================
  // PARTNER INVITE
  // ============================================================================

  const sendPartnerInvite = async () => {
    if (!inviteEmail || !inviteLocationId || !orgId) return;

    setInviteLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/organizations/${orgId}/partner-invites`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          partnerEmail: inviteEmail,
          locationId: inviteLocationId,
          permissions: {
            canViewSales: true,
            canEditInventory: true
          }
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to send invite');
      }

      const { inviteLink } = await res.json();

      // Copy link to clipboard
      await navigator.clipboard.writeText(inviteLink);
      showToast('Invite link copied to clipboard!', 'success');

      setInviteDialogOpen(false);
      setInviteEmail('');
      setInviteLocationId('');
      await loadData();
    } catch (e: any) {
      showToast(e.message || 'Failed to send invite', 'error');
    } finally {
      setInviteLoading(false);
    }
  };

  // ============================================================================
  // MEMBER PERMISSIONS
  // ============================================================================

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
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedPoolIds: newIds })
      });
    } catch (e) {
      console.error(e);
      // Revert on error
      loadData();
    }
  };

  const toggleMemberPermission = async (
    userId: string,
    poolId: string,
    feature: 'canRead' | 'canEdit' | 'canSync',
    checked: boolean
  ) => {
    if (!orgId) return;

    // Optimistic update
    setMembers(prev => prev.map(m => {
      if (m.userId !== userId) return m;
      const poolPerms = m.poolPermissions[poolId] || { canRead: true, canEdit: true, canSync: true };
      return {
        ...m,
        poolPermissions: {
          ...m.poolPermissions,
          [poolId]: { ...poolPerms, [feature]: checked }
        }
      };
    }));

    try {
      const token = await getToken();
      const member = members.find(m => m.userId === userId);
      if (!member) return;

      const currentPerms = member.poolPermissions[poolId] || { canRead: true, canEdit: true, canSync: true };
      const newPerms = { ...currentPerms, [feature]: checked };

      await fetch(`${API_BASE}/api/organizations/${orgId}/members/${userId}/permissions`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poolPermissions: { [poolId]: newPerms }
        })
      });
    } catch (e) {
      console.error(e);
      loadData();
    }
  };

  // ============================================================================
  // HELPERS
  // ============================================================================

  const getLocationMeta = (locationId: string) => {
    for (const group of Object.values(allLocations)) {
      const loc = group.locations.find(l => l.platformLocationId === locationId);
      if (loc) return { loc, group };
    }
    return null;
  };

  const getConnectionForLocation = (locationId: string): string | null => {
    for (const [connId, group] of Object.entries(allLocations)) {
      if (group.locations.some(l => l.platformLocationId === locationId)) {
        return connId;
      }
    }
    return null;
  };

  const getPoolSyncStatus = (pool: Pool): 'idle' | 'syncing' | 'error' | 'warning' => {
    let hasError = false;
    let hasSyncing = false;
    let hasWarning = false;

    for (const locId of pool.locationIds) {
      const connId = getConnectionForLocation(locId);
      if (connId) {
        const status = syncStatuses[connId];
        if (status?.status === 'syncing') hasSyncing = true;
        if (status?.status === 'error') hasError = true;
        if (allLocations[connId]?.needsReauth) hasWarning = true;
      }
    }

    if (hasError) return 'error';
    if (hasWarning) return 'warning';
    if (hasSyncing) return 'syncing';
    return 'idle';
  };

  // ============================================================================
  // RENDER: LOCATION SELECTOR
  // ============================================================================

  const renderSelectedLocation = (locId: string) => {
    const meta = getLocationMeta(locId);
    if (!meta) return null;
    const { loc, group } = meta;
    const platformType = group.platformType.toLowerCase();
    const IconSrc = PLATFORM_ICONS[platformType];
    const syncStatus = syncStatuses[group.connectionId || ''];

    return (
      <div key={locId} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-3 group">
        <div className="flex items-center gap-3">
          {IconSrc && <Image src={IconSrc} alt={platformType} width={20} height={20} />}
          <div>
            <div className="text-sm font-medium text-slate-900">{loc.locationName}</div>
            <div className="text-xs text-slate-500">{group.connectionName}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {syncStatus?.status === 'syncing' && (
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          )}
          {group.needsReauth && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                </TooltipTrigger>
                <TooltipContent>Needs reconnection</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600"
            onClick={() => setSelectedLocationIds(prev => prev.filter(id => id !== locId))}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  // ============================================================================
  // RENDER: POOL CARD
  // ============================================================================

  const renderPoolCard = (pool: Pool) => {
    const locationCount = pool.locationIds?.length || 0;
    const status = getPoolSyncStatus(pool);
    const statusConfig = {
      idle: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50', label: 'Synced' },
      syncing: { icon: Loader2, color: 'text-blue-500', bg: 'bg-blue-50', label: 'Syncing...', animate: true },
      error: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', label: 'Error' },
      warning: { icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-50', label: 'Needs attention' },
    }[status];

    const StatusIcon = statusConfig.icon;

    return (
      <Card key={pool.id} className="overflow-hidden hover:shadow-md transition-all">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-lg text-slate-900">{pool.name}</h3>
                <Badge variant="outline" className={`${statusConfig.bg} ${statusConfig.color} border-0`}>
                  <StatusIcon className={`w-3 h-3 mr-1 ${statusConfig.animate ? 'animate-spin' : ''}`} />
                  {statusConfig.label}
                </Badge>
              </div>

              {pool.description && (
                <p className="text-sm text-slate-500 mb-3">{pool.description}</p>
              )}

              <div className="flex flex-wrap gap-3 text-sm">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <MapPin className="w-4 h-4" />
                  <span>{locationCount} location{locationCount !== 1 ? 's' : ''}</span>
                </div>

                <div className={`flex items-center gap-1.5 ${pool.syncInventory ? 'text-green-600' : 'text-slate-400'}`}>
                  {pool.syncInventory ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  <span>Inventory</span>
                </div>

                <div className={`flex items-center gap-1.5 ${pool.syncPricing ? 'text-green-600' : 'text-slate-400'}`}>
                  {pool.syncPricing ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  <span>Pricing</span>
                </div>
              </div>

              {/* Location pills */}
              {locationCount > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {pool.locationIds.slice(0, 3).map(locId => {
                    const meta = getLocationMeta(locId);
                    if (!meta) return null;
                    const platformType = meta.group.platformType.toLowerCase();
                    const IconSrc = PLATFORM_ICONS[platformType];
                    return (
                      <div key={locId} className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded-full text-xs">
                        {IconSrc && <Image src={IconSrc} alt="" width={12} height={12} />}
                        <span className="text-slate-600 truncate max-w-[100px]">{meta.loc.locationName}</span>
                      </div>
                    );
                  })}
                  {locationCount > 3 && (
                    <span className="px-2 py-1 text-xs text-slate-500">+{locationCount - 3} more</span>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 ml-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => triggerPoolSync(pool.id)}
                      disabled={status === 'syncing'}
                    >
                      <RefreshCw className={`w-4 h-4 ${status === 'syncing' ? 'animate-spin' : ''}`} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Sync now</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {isAdmin && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setEditingPool(pool);
                      setSelectedLocationIds(pool.locationIds || []);
                    }}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleDeletePool(pool.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // ============================================================================
  // RENDER: MEMBER CARD
  // ============================================================================

  const renderMemberCard = (member: TeamMember) => {
    const isPartner = member.role === 'partner';
    const roleDisplay = member.role.replace('org:', '').charAt(0).toUpperCase() + member.role.replace('org:', '').slice(1);
    const roleColor = {
      'admin': 'bg-purple-100 text-purple-800',
      'member': 'bg-blue-100 text-blue-800',
      'partner': 'bg-amber-100 text-amber-800',
    }[member.role.replace('org:', '')] || 'bg-slate-100 text-slate-800';

    return (
      <Card key={member.userId} className="overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start gap-4 mb-4">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
              {member.firstName?.[0] || member.email[0].toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold text-slate-900">
                  {member.firstName} {member.lastName}
                </h4>
                <Badge className={roleColor} variant="secondary">
                  {isPartner && <Link2 className="w-3 h-3 mr-1" />}
                  {roleDisplay}
                </Badge>
              </div>
              <p className="text-sm text-slate-500 truncate">{member.email}</p>
            </div>
          </div>

          {/* Pool Access Grid */}
          {pools.length > 0 && (
            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pool Access</div>

              <div className="grid gap-2">
                {pools.map(pool => {
                  const hasAccess = member.assignedPoolIds.includes(pool.id);
                  const perms = member.poolPermissions[pool.id] || { canRead: true, canEdit: true, canSync: true };

                  return (
                    <div
                      key={pool.id}
                      className={`p-3 rounded-lg border transition-all ${hasAccess
                          ? 'bg-blue-50/50 border-blue-200'
                          : 'bg-slate-50/50 border-slate-200 opacity-60'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            id={`access-${member.userId}-${pool.id}`}
                            checked={hasAccess}
                            onCheckedChange={(checked) => toggleMemberPool(member.userId, pool.id, !!checked)}
                            disabled={!isAdmin}
                          />
                          <label
                            htmlFor={`access-${member.userId}-${pool.id}`}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {pool.name}
                          </label>
                        </div>
                        <span className="text-xs text-slate-400">
                          {pool.locationIds.length} locations
                        </span>
                      </div>

                      {hasAccess && isAdmin && (
                        <div className="flex gap-4 ml-6 pt-2 border-t border-slate-200/50">
                          <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                            <Checkbox
                              checked={perms.canRead}
                              onCheckedChange={(checked) => toggleMemberPermission(member.userId, pool.id, 'canRead', !!checked)}
                              className="h-3.5 w-3.5"
                            />
                            <Eye className="w-3 h-3" /> View
                          </label>
                          <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                            <Checkbox
                              checked={perms.canEdit}
                              onCheckedChange={(checked) => toggleMemberPermission(member.userId, pool.id, 'canEdit', !!checked)}
                              className="h-3.5 w-3.5"
                            />
                            <Edit className="w-3 h-3" /> Edit
                          </label>
                          <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                            <Checkbox
                              checked={perms.canSync}
                              onCheckedChange={(checked) => toggleMemberPermission(member.userId, pool.id, 'canSync', !!checked)}
                              className="h-3.5 w-3.5"
                            />
                            <Zap className="w-3 h-3" /> Sync
                          </label>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // ============================================================================
  // RENDER: MAIN
  // ============================================================================

  if (loading && pools.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Team & Locations</h1>
          <p className="text-slate-500 mt-1">Manage pools, team access, and partner sharing</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {isAdmin && (
            <Button onClick={() => {
              setEditingPool({
                id: 'new',
                orgId: orgId!,
                name: '',
                syncInventory: true,
                syncPricing: true,
                locationIds: []
              });
              setSelectedLocationIds([]);
            }}>
              <Plus className="w-4 h-4 mr-2" />
              New Pool
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="pools" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Pools
            {pools.length > 0 && <Badge variant="secondary" className="ml-1">{pools.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Team
            {members.length > 0 && <Badge variant="secondary" className="ml-1">{members.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="partners" className="flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            Partners
          </TabsTrigger>
        </TabsList>

        {/* POOLS TAB */}
        <TabsContent value="pools" className="mt-6 space-y-4">
          {/* Connection Health Banner */}
          {Object.values(allLocations).some(g => g.needsReauth) && (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="font-medium text-amber-900">Some connections need attention</p>
                    <p className="text-sm text-amber-700">
                      {Object.values(allLocations).filter(g => g.needsReauth).length} connection(s) require re-authentication
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-amber-300 hover:bg-amber-100"
                  onClick={() => {
                    const firstBroken = Object.entries(allLocations).find(([, g]) => g.needsReauth);
                    if (firstBroken) {
                      setReconnectDialog({
                        open: true,
                        connectionId: firstBroken[0],
                        platformType: firstBroken[1].platformType
                      });
                    }
                  }}
                >
                  Fix Now
                </Button>
              </CardContent>
            </Card>
          )}

          {pools.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                  <MapPin className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No pools yet</h3>
                <p className="text-slate-500 mb-6 max-w-sm">
                  Create a pool to group locations that share inventory and pricing.
                </p>
                {isAdmin && (
                  <Button onClick={() => {
                    setEditingPool({
                      id: 'new',
                      orgId: orgId!,
                      name: '',
                      syncInventory: true,
                      syncPricing: true,
                      locationIds: []
                    });
                    setSelectedLocationIds([]);
                  }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Pool
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pools.map(renderPoolCard)}
            </div>
          )}
        </TabsContent>

        {/* TEAM TAB */}
        <TabsContent value="team" className="mt-6">
          <div className="grid gap-4 md:grid-cols-2">
            {members.filter(m => m.role !== 'partner').map(renderMemberCard)}
          </div>
        </TabsContent>

        {/* PARTNERS TAB */}
        <TabsContent value="partners" className="mt-6 space-y-6">
          {/* Partner Members */}
          {members.filter(m => m.role === 'partner').length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-700">Active Partners</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {members.filter(m => m.role === 'partner').map(renderMemberCard)}
              </div>
            </div>
          )}

          {/* Pending Invites */}
          {partnerInvites.filter(i => i.status === 'pending').length > 0 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-700">Pending Invites</h3>
              <div className="space-y-2">
                {partnerInvites.filter(i => i.status === 'pending').map(invite => (
                  <Card key={invite.id}>
                    <CardContent className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-slate-400" />
                        <div>
                          <p className="font-medium">{invite.partnerEmail}</p>
                          <p className="text-xs text-slate-500">
                            Expires {formatTimeAgo(invite.expiresAt)}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Invite Partner Button */}
          {isAdmin && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4">
                  <UserPlus className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Invite a Partner</h3>
                <p className="text-slate-500 mb-6 max-w-sm">
                  Share inventory access with a business partner. They'll only see the locations you assign.
                </p>
                <Button onClick={() => setInviteDialogOpen(true)}>
                  <Send className="w-4 h-4 mr-2" />
                  Send Invite
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* ================================================================== */}
      {/* DIALOGS */}
      {/* ================================================================== */}

      {/* Pool Edit Dialog */}
      <Dialog open={!!editingPool} onOpenChange={(open) => !open && setEditingPool(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingPool?.id === 'new' ? 'Create Pool' : 'Edit Pool'}</DialogTitle>
            <DialogDescription>
              Group locations that should share inventory and pricing.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label>Pool Name</Label>
              <Input
                placeholder="e.g. West Coast Stores"
                value={editingPool?.name || ''}
                onChange={e => setEditingPool(prev => prev ? { ...prev, name: e.target.value } : null)}
              />
            </div>

            {/* Sync Options */}
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch
                  checked={editingPool?.syncInventory ?? true}
                  onCheckedChange={checked => setEditingPool(prev => prev ? { ...prev, syncInventory: checked } : null)}
                />
                <span className="text-sm">Sync Inventory</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Switch
                  checked={editingPool?.syncPricing ?? true}
                  onCheckedChange={checked => setEditingPool(prev => prev ? { ...prev, syncPricing: checked } : null)}
                />
                <span className="text-sm">Sync Pricing</span>
              </label>
            </div>

            <Separator />

            {/* Selected Locations */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Locations ({selectedLocationIds.length})</Label>
              </div>

              {selectedLocationIds.length > 0 ? (
                <ScrollArea className="h-[150px]">
                  <div className="space-y-2 pr-4">
                    {selectedLocationIds.map(renderSelectedLocation)}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-6 bg-slate-50 rounded-lg border border-dashed">
                  <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">No locations selected</p>
                </div>
              )}
            </div>

            {/* Platform Selector */}
            <div className="space-y-2">
              <Label className="text-xs text-slate-500 uppercase tracking-wider">Add from Platform</Label>
              <div className="border rounded-lg divide-y max-h-[200px] overflow-y-auto">
                {Object.keys(allLocations).length === 0 ? (
                  <div className="p-4 text-sm text-slate-400 text-center">No platforms connected</div>
                ) : (
                  Object.entries(allLocations).map(([connId, group]) => {
                    const isOpen = expandedPlatformId === connId;
                    const platformType = group.platformType.toLowerCase();
                    const IconSrc = PLATFORM_ICONS[platformType];
                    const availableLocs = group.locations.filter(l => !selectedLocationIds.includes(l.platformLocationId));

                    return (
                      <div key={connId}>
                        <button
                          onClick={() => setExpandedPlatformId(isOpen ? null : connId)}
                          className="w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {IconSrc && <Image src={IconSrc} alt={platformType} width={20} height={20} />}
                            <span className="text-sm font-medium">{group.connectionName}</span>
                            {group.needsReauth && (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs">
                                Needs auth
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">{availableLocs.length} available</span>
                            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                          </div>
                        </button>

                        {isOpen && (
                          <div className="bg-slate-50 p-2 space-y-1 border-t">
                            {availableLocs.length === 0 ? (
                              <p className="text-xs text-slate-400 text-center py-2">All locations selected</p>
                            ) : (
                              availableLocs.map(loc => (
                                <button
                                  key={loc.platformLocationId}
                                  onClick={() => setSelectedLocationIds(prev => [...prev, loc.platformLocationId])}
                                  className="w-full flex items-center justify-between p-2 rounded hover:bg-white text-left group"
                                >
                                  <span className="text-sm text-slate-600">{loc.locationName}</span>
                                  <Plus className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPool(null)}>Cancel</Button>
            <Button onClick={savePool} disabled={!editingPool?.name || selectedLocationIds.length === 0}>
              {editingPool?.id === 'new' ? 'Create Pool' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Partner Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Partner</DialogTitle>
            <DialogDescription>
              Partners can view and edit inventory for the location you share.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Partner Email</Label>
              <Input
                type="email"
                placeholder="partner@company.com"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Share Location</Label>
              <select
                className="w-full p-2 border rounded-md"
                value={inviteLocationId}
                onChange={e => setInviteLocationId(e.target.value)}
              >
                <option value="">Select a location...</option>
                {Object.entries(allLocations).map(([connId, group]) => (
                  <optgroup key={connId} label={group.connectionName}>
                    {group.locations.map(loc => (
                      <option key={loc.platformLocationId} value={loc.platformLocationId}>
                        {loc.locationName}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={sendPartnerInvite}
              disabled={!inviteEmail || !inviteLocationId || inviteLoading}
            >
              {inviteLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reconnect Dialog */}
      <Dialog open={!!reconnectDialog?.open} onOpenChange={(open) => !open && setReconnectDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Reconnect Required
            </DialogTitle>
            <DialogDescription>
              Your {reconnectDialog?.platformType} connection needs to be re-authenticated.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <p className="text-sm text-slate-600">
              This usually happens when access tokens expire or permissions change.
              Click below to reconnect your account.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReconnectDialog(null)}>Later</Button>
            <Button
              onClick={() => reconnectDialog && handleReconnect(reconnectDialog.connectionId, reconnectDialog.platformType)}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Reconnect Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
