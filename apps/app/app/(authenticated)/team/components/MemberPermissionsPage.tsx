'use client';

import { useOrganization, useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Checkbox } from '@repo/design-system/components/ui/checkbox';
import { Label } from '@repo/design-system/components/ui/label';
import { Button } from '@repo/design-system/components/ui/button';
import { Input } from '@repo/design-system/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/design-system/components/ui/dialog';
import { Plus, X, Trash2, Check, ChevronDown, ChevronRight } from 'lucide-react';

// Import assets
import shopifyIcon from '../../../assets/shopify.svg';
import squareIcon from '../../../assets/square.svg';
import cloverIcon from '../../../assets/clover.svg';

const PLATFORM_ICONS: Record<string, any> = {
  shopify: shopifyIcon,
  square: squareIcon,
  clover: cloverIcon,
};

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333').replace(/\/$/, '');

interface Location {
  platformLocationId: string;
  locationName: string;
  timezone?: string;
  platformConnection?: {
    platformType: string;
    displayName: string;
    id: string;
  };
}

interface LocationGroup {
  platformType: string;
  connectionName: string;
  locations: Location[];
}

// Corrected interface to match what the backend service returns (camelCase)
// but robust enough to handle snake_case if that's what comes over the wire
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
  deletedAt?: string;
  
  // Fallback for potential snake_case
  org_id?: string;
  sync_inventory?: boolean;
  sync_pricing?: boolean;
  location_ids?: string[];
  deleted_at?: string;
}

interface TeamMember {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'org:admin' | 'org:member' | 'partner';
  assignedPoolIds: string[];
  poolPermissions: Record<string, { canRead: boolean; canEdit: boolean; canSync: boolean }>;
}

const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  console.log(`[${type.toUpperCase()}] ${message}`);
};

export default function MemberPermissionsPage() {
  const { organization, isLoaded, membership } = useOrganization();
  const { getToken } = useAuth();

  const [pools, setPools] = useState<Pool[]>([]);
  const [allLocations, setAllLocations] = useState<Record<string, LocationGroup>>({});
  const [members, setMembers] = useState<TeamMember[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Editing state
  const [editingPool, setEditingPool] = useState<Partial<Pool> | null>(null);
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);

  // UI state for dialog
  const [expandedPlatformId, setExpandedPlatformId] = useState<string | null>(null);

  const orgId = organization?.id;
  const isAdmin = membership?.role === 'org:admin';

  // Helpers
  const getLocationMeta = (locationId: string) => {
    for (const group of Object.values(allLocations)) {
      const loc = group.locations.find(l => l.platformLocationId === locationId);
      if (loc) return { loc, group };
    }
    return null;
  };

  const loadData = async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const clerkToken = await getToken();
      const headers = { 'Authorization': `Bearer ${clerkToken}` };

      const [poolsRes, locationsRes] = await Promise.all([
        fetch(`${API_BASE}/api/pools/org/${orgId}`, { headers, cache: 'no-store' }),
        fetch(`${API_BASE}/api/pools/locations/available?orgId=${orgId}`, { headers, cache: 'no-store' }),
      ]);

      if (poolsRes.ok) {
        const rawData = await poolsRes.json();
        // Normalize pools to camelCase
        const normalizedPools = (Array.isArray(rawData) ? rawData : []).map((p: any) => ({
          ...p,
          id: p.id,
          orgId: p.orgId || p.org_id,
          name: p.name,
          description: p.description,
          syncInventory: p.syncInventory ?? p.sync_inventory ?? true,
          syncPricing: p.syncPricing ?? p.sync_pricing ?? true,
          locationIds: p.locationIds || p.location_ids || [],
          deletedAt: p.deletedAt || p.deleted_at
        })).filter((p: Pool) => !p.deletedAt); // Client-side filter just in case
        setPools(normalizedPools);
      }

      if (locationsRes.ok) {
        const data = await locationsRes.json();
        setAllLocations(data);
      }

      // Load members...
      if (organization?.getMemberships) {
        const membershipList = await organization.getMemberships();
        const membersData = membershipList.data || [];
        
        const loadedMembers: TeamMember[] = [];
        for (const m of membersData) {
          const uid = m.publicUserData?.userId;
          if (!uid) continue;

          // permissions fetch
          try {
            const permRes = await fetch(`${API_BASE}/api/organizations/${orgId}/members/${uid}/permissions`, { headers });
            const perms = permRes.ok ? await permRes.json() : {};
            
            loadedMembers.push({
              userId: uid,
              email: m.publicUserData?.identifier || '',
              firstName: m.publicUserData?.firstName || '',
              lastName: m.publicUserData?.lastName || '',
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
      console.error(e);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && orgId) loadData();
  }, [isLoaded, orgId]);

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

      if (!res.ok) throw new Error('Failed to save');
      
      await loadData(); // Reload to get fresh state
      setEditingPool(null);
      showToast('Pool saved');
    } catch (e) {
      console.error(e);
      showToast('Error saving pool', 'error');
    }
  };

  const handleDeletePool = async (id: string) => {
    try {
      const token = await getToken();
      await fetch(`${API_BASE}/api/pools/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setPools(prev => prev.filter(p => p.id !== id));
      showToast('Pool deleted');
    } catch (e) {
      showToast('Error deleting pool', 'error');
    }
  };

  // Toggle access to a pool for a user
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
      // Revert on error (omitted for brevity)
    }
  };

  // Toggle specific permission for a user in a pool
  const toggleMemberPermission = async (userId: string, poolId: string, feature: 'canRead' | 'canEdit', checked: boolean) => {
    if (!orgId) return;
    
    // Optimistic update
    setMembers(prev => prev.map(m => {
      if (m.userId !== userId) return m;
      const poolPerms = m.poolPermissions[poolId] || { canRead: true, canEdit: false, canSync: false };
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

      const currentPerms = member.poolPermissions[poolId] || { canRead: true, canEdit: false, canSync: false };
      const newPerms = { ...currentPerms, [feature]: checked };

      await fetch(`${API_BASE}/api/organizations/${orgId}/members/${userId}/permissions`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          poolPermissions: { 
            [poolId]: newPerms 
    }
        })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const renderSelectedLocation = (locId: string) => {
    const meta = getLocationMeta(locId);
    if (!meta) return null;
    const { loc, group } = meta;
    const platformType = group.platformType.toLowerCase();
    const IconSrc = PLATFORM_ICONS[platformType];

    // Styled to match mobile: Logo + Platform Name on top row, Location Name on second row
    return (
      <div key={locId} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-3 mb-2">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            {IconSrc && <Image src={IconSrc} alt={platformType} width={16} height={16} />}
            <span className="text-xs font-semibold text-slate-700">{group.connectionName}</span>
          </div>
          <div className="text-sm font-medium text-slate-900">{loc.locationName}</div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 rounded-full"
          onClick={() => setSelectedLocationIds(prev => prev.filter(id => id !== locId))}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  };

  if (loading && pools.length === 0) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Location Pools & Team Access</h1>
          <p className="text-slate-500 mt-1">Organize physical locations into pools and control team access</p>
        </div>
      </div>

      {/* POOLS SECTION */}
      {isAdmin && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Location Pools</CardTitle>
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
          </CardHeader>
          <CardContent>
            <Dialog open={!!editingPool} onOpenChange={(open) => !open && setEditingPool(null)}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>{editingPool?.id === 'new' ? 'Create Location Pool' : 'Edit Pool'}</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-5 py-2">
                  {/* Name */}
                  <div className="space-y-1.5">
                    <Label>Pool Name</Label>
                    <Input 
                      placeholder="e.g. West Coast Stores" 
                      value={editingPool?.name || ''}
                      onChange={e => setEditingPool(prev => prev ? { ...prev, name: e.target.value } : null)}
                    />
                  </div>

                  {/* Selected Locations */}
                  {selectedLocationIds.length > 0 && (
                    <div className="space-y-2">
                      <Label>Selected Locations</Label>
                      <div className="max-h-[200px] overflow-y-auto">
                        {selectedLocationIds.map(renderSelectedLocation)}
                      </div>
                    </div>
                  )}

                  {/* Platform Selector (Add Location) */}
                  <div className="space-y-2">
                    <Label className="text-slate-500 text-xs uppercase font-bold tracking-wider">Add Location from Platform</Label>
                    <div className="border rounded-lg divide-y">
                      {Object.keys(allLocations).length === 0 ? (
                        <div className="p-3 text-sm text-slate-400">No platforms connected</div>
                      ) : (
                        Object.entries(allLocations).map(([connId, group]) => {
                          const isOpen = expandedPlatformId === connId;
                          const platformType = group.platformType.toLowerCase();
                          const IconSrc = PLATFORM_ICONS[platformType];

                          return (
                            <div key={connId} className="bg-white">
                              <button
                                onClick={() => setExpandedPlatformId(isOpen ? null : connId)}
                                className="w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  {IconSrc && <Image src={IconSrc} alt={platformType} width={20} height={20} />}
                                  <span className="text-sm font-medium text-slate-700">{group.connectionName}</span>
                                </div>
                                {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                              </button>
                              
                              {isOpen && (
                                <div className="bg-slate-50/50 p-2 space-y-1 border-t shadow-inner">
                                  {group.locations.map(loc => {
                                    const isSelected = selectedLocationIds.includes(loc.platformLocationId);
                                    if (isSelected) return null; // Hide if already selected

                                    return (
                                      <button
                                        key={loc.platformLocationId}
                                        onClick={() => {
                                          setSelectedLocationIds(prev => [...prev, loc.platformLocationId]);
                                          setExpandedPlatformId(null); // Close on select
                                        }}
                                        className="w-full flex items-center justify-between p-2 rounded hover:bg-white hover:shadow-sm text-left group"
                                      >
                                        <span className="text-sm text-slate-600 group-hover:text-slate-900">{loc.locationName}</span>
                                        <Plus className="w-3 h-3 text-slate-400 group-hover:text-blue-600" />
                                      </button>
                                    );
                                  })}
                                  {group.locations.every(l => selectedLocationIds.includes(l.platformLocationId)) && (
                                    <div className="text-xs text-slate-400 text-center py-2">All locations selected</div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <Button variant="outline" onClick={() => setEditingPool(null)}>Cancel</Button>
                    <Button onClick={savePool} disabled={!editingPool?.name || selectedLocationIds.length === 0}>
                      {editingPool?.id === 'new' ? 'Create Pool' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {pools.length === 0 ? (
              <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-lg border border-dashed">
                No pools created yet
              </div>
            ) : (
              <div className="grid gap-3">
                {pools.map(pool => {
                  const count = pool.locationIds?.length || 0;
                  return (
                    <div key={pool.id} className="flex items-center justify-between p-4 border rounded-lg hover:border-blue-200 transition-colors bg-white">
                      <div>
                        <h3 className="font-medium text-slate-900">{pool.name}</h3>
                        <div className="flex gap-4 mt-1.5">
                          <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                            📍 {count} location{count !== 1 ? 's' : ''}
                          </span>
                          <span className={`text-xs font-medium flex items-center gap-1 ${pool.syncInventory ? 'text-green-600' : 'text-slate-400'}`}>
                            {pool.syncInventory ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} Inventory
                          </span>
                          <span className={`text-xs font-medium flex items-center gap-1 ${pool.syncPricing ? 'text-green-600' : 'text-slate-400'}`}>
                            {pool.syncPricing ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} Pricing
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                              setEditingPool(pool);
                            setSelectedLocationIds(pool.locationIds || []);
                          }}
                        >
                              Edit
                            </Button>
                        
                        <Button 
                           variant="ghost" 
                           size="icon" 
                           className="text-red-400 hover:text-red-600 hover:bg-red-50"
                           onClick={() => handleDeletePool(pool.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TEAM ACCESS (V3 Style) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Team Access</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {members.map(member => (
             <div key={member.userId} className="border rounded-lg p-5 bg-white shadow-sm">
               {/* User Header */}
               <div className="flex items-start justify-between mb-4 border-b pb-4">
                 <div>
                   <h3 className="font-bold text-slate-900 text-lg">{member.firstName} {member.lastName}</h3>
                   <div className="text-sm text-slate-500">{member.email}</div>
                 </div>
                 <div className="flex flex-col items-end gap-1">
                 <div className="px-2 py-1 bg-slate-100 rounded text-xs font-semibold text-slate-600 uppercase tracking-wider">
                   {member.role.replace('org:', '')}
                   </div>
                 </div>
               </div>

               {/* Pools & Features List */}
               <div className="space-y-4">
                 <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pool Access & Permissions</div>
                 
                 {pools.length === 0 ? (
                   <div className="text-sm text-slate-400 italic">No pools available</div>
                 ) : (
                   <div className="grid gap-4 md:grid-cols-2">
                     {pools.map(pool => {
                       const hasAccess = member.assignedPoolIds.includes(pool.id);
                       const perms = member.poolPermissions[pool.id] || { canRead: true, canEdit: false };
                       const poolLocIds = pool.locationIds || [];
                       const locationCount = poolLocIds.length;

                       return (
                         <div key={pool.id} className={`border rounded-md p-4 transition-all ${hasAccess ? 'bg-blue-50/30 border-blue-200 ring-1 ring-blue-100' : 'bg-slate-50/50 border-transparent opacity-75'}`}>
                           <div className="flex items-center gap-3 mb-2">
                             <Checkbox 
                               id={`pool-${member.userId}-${pool.id}`}
                               checked={hasAccess}
                               onCheckedChange={(checked) => toggleMemberPool(member.userId, pool.id, !!checked)}
                               className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                             />
                             <label 
                               htmlFor={`pool-${member.userId}-${pool.id}`}
                               className={`font-semibold text-sm cursor-pointer ${hasAccess ? 'text-blue-900' : 'text-slate-600'}`}
                             >
                               {pool.name}
                             </label>
                           </div>

                           {/* Location summary */}
                           <div className="ml-7 mb-3 text-xs text-slate-500">
                             {locationCount === 0 ? (
                               <span className="italic">No locations</span>
                             ) : (
                               <span>
                                 Includes {locationCount} location{locationCount !== 1 ? 's' : ''}:{' '}
                                 {poolLocIds.map(id => getLocationMeta(id)?.loc.locationName).filter(Boolean).join(', ')}
                               </span>
                             )}
                           </div>
                           
                           {hasAccess && (
                             <div className="pl-7 space-y-2 pt-2 border-t border-blue-100/50">
                               <div className="flex items-center gap-2">
                                 <Checkbox 
                                    id={`perm-view-${member.userId}-${pool.id}`}
                                    checked={perms.canRead}
                                    onCheckedChange={(checked) => toggleMemberPermission(member.userId, pool.id, 'canRead', !!checked)}
                                    disabled // Always true if assigned? Or toggleable?
                                    className="h-3.5 w-3.5 opacity-50"
                                 />
                                 <label htmlFor={`perm-view-${member.userId}-${pool.id}`} className="text-xs text-slate-700 font-medium">
                                   View Inventory
                                 </label>
                               </div>
                               
                               <div className="flex items-center gap-2">
                                  <Checkbox 
                                    id={`perm-edit-${member.userId}-${pool.id}`}
                                    checked={perms.canEdit}
                                    onCheckedChange={(checked) => toggleMemberPermission(member.userId, pool.id, 'canEdit', !!checked)}
                                    className="h-3.5 w-3.5"
                                  /> 
                                  <label htmlFor={`perm-edit-${member.userId}-${pool.id}`} className="text-xs text-slate-700 font-medium">
                                    Edit Inventory
                                  </label>
                               </div>
                             </div>
                           )}
                         </div>
                       );
                     })}
                   </div>
                 )}
               </div>
             </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
