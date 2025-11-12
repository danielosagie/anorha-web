'use client';

import { useOrganization, useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Checkbox } from '@repo/design-system/components/ui/checkbox';
import { Label } from '@repo/design-system/components/ui/label';
import { Button } from '@repo/design-system/components/ui/button';
import { Input } from '@repo/design-system/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/design-system/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@repo/design-system/components/ui/alert-dialog';

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

interface Pool {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  syncInventory: boolean;
  syncPricing: boolean;
  locationIds?: string[];
  createdAt: string;
  updatedAt: string;
}

interface TeamMember {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'org:admin' | 'org:member' | 'partner'; // From Clerk - read only
  assignedPoolIds: string[];
  poolPermissions: Record<string, { canRead: boolean; canEdit: boolean; canSync: boolean }>;
}

interface OrgSchema {
  tier: string;
  features: Record<string, boolean>;
  limits: Record<string, number>;
}

const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  console.log(`[${type.toUpperCase()}] ${message}`);
};

/**
 * PURPOSE: Manage location pools and team access control
 * 
 * ARCHITECTURE:
 * - Pools: Named groups of locations with sync settings
 * - Locations: Physical store/warehouse locations from connected platforms (Shopify, Square)
 * - Members: Team members with Clerk-managed roles (org:admin, org:member, partner)
 * - Permissions: Per-pool access control (canRead, canEdit, canSync)
 * 
 * FLOW:
 * 1. Admins create/manage pools and assign locations to them
 * 2. Members get pool access via RBAC (permissions table + Clerk role)
 * 3. Read-only shows locations assigned to each pool + unassigned available locations
 */
export default function MemberPermissionsPage() {
  const { organization, isLoaded, membership } = useOrganization();
  const { getToken } = useAuth();

  // State: Core data
  const [pools, setPools] = useState<Pool[]>([]);
  const [allLocations, setAllLocations] = useState<Record<string, Location[]>>({}); // grouped by connection
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [schema, setSchema] = useState<OrgSchema | null>(null);

  // State: Loading & error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State: UI interactions
  const [editingPool, setEditingPool] = useState<Pool | null>(null);
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
  const [deletingPoolId, setDeletingPoolId] = useState<string | null>(null);
  const [updatingMemberPool, setUpdatingMemberPool] = useState<{ memberId: string; poolId: string } | null>(null);

  const orgId = organization?.id;
  const isAdmin = membership?.role === 'org:admin';

  // Helper: Get locations not yet assigned to any pool
  const getUnassignedLocations = () => {
    const assignedSet = new Set<string>();
    pools.forEach(pool => {
      (pool.locationIds || []).forEach(id => assignedSet.add(id));
    });

    const result: Record<string, Location[]> = {};
    Object.entries(allLocations).forEach(([connId, locs]) => {
      const unassigned = locs.filter(loc => !assignedSet.has(loc.platformLocationId));
      if (unassigned.length > 0) {
        result[connId] = unassigned;
      }
    });
    return result;
  };

  // Helper: Get locations for a specific pool
  const getPoolLocations = (poolId: string): Location[] => {
    const pool = pools.find(p => p.id === poolId);
    if (!pool?.locationIds) return [];

    const result: Location[] = [];
    Object.values(allLocations).forEach(locs => {
      locs.forEach(loc => {
        if (pool.locationIds?.includes(loc.platformLocationId)) {
          result.push(loc);
        }
      });
    });
    return result;
  };

  // API: Load all data
  const loadData = async () => {
    if (!orgId) {
      setError('No organization selected');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const clerkToken = await getToken();
      if (!clerkToken) throw new Error('Not authenticated');

      const headers = {
        'Authorization': `Bearer ${clerkToken}`,
        'Content-Type': 'application/json',
      };

      // Parallel load: pools, available locations, schema
      const [poolsRes, locationsRes, schemaRes] = await Promise.all([
        fetch(`${API_BASE}/api/pools/org/${orgId}`, { headers, cache: 'no-store' }),
        fetch(`${API_BASE}/api/pools/locations/available?orgId=${orgId}`, { headers, cache: 'no-store' }),
        fetch(`${API_BASE}/api/organizations/${orgId}/schema`, { headers, cache: 'no-store' })
      ]);

      // Handle pools
      if (poolsRes.ok) {
        const poolsData = await poolsRes.json();
        setPools(Array.isArray(poolsData) ? poolsData : []);
      } else {
        console.error('[MemberPermissionsPage] Failed to load pools:', poolsRes.status);
        setPools([]);
      }

      // Handle locations
      if (locationsRes.ok) {
        const locationsData = await locationsRes.json();
        setAllLocations(locationsData);
      } else {
        console.error('[MemberPermissionsPage] Failed to load locations:', locationsRes.status);
        setAllLocations({});
      }

      // Handle schema
      if (schemaRes.ok) {
        const schemaData = await schemaRes.json();
        setSchema(schemaData);
      }

      // Load members with their permissions
      if (organization?.getMemberships) {
        try {
          const membershipList = await organization.getMemberships();
          const membersList = membershipList.data || [];

          const membersWithPerms: TeamMember[] = [];
          for (const member of membersList) {
            const userId = member.publicUserData?.userId;
            if (!userId) continue;

            // Fetch permissions for this member
            try {
              const permRes = await fetch(
                `${API_BASE}/api/organizations/${orgId}/members/${userId}/permissions`,
                { headers, cache: 'no-store' }
              );

              const perms = permRes.ok ? await permRes.json() : {
                assignedPoolIds: [],
                poolPermissions: {}
              };

              membersWithPerms.push({
                userId,
                email: member.publicUserData?.identifier ?? '',
                firstName: member.publicUserData?.firstName ?? undefined,
                lastName: member.publicUserData?.lastName ?? undefined,
                role: member.role as 'org:admin' | 'org:member' | 'partner',
                assignedPoolIds: perms.assignedPoolIds || [],
                poolPermissions: perms.poolPermissions || {}
              });
            } catch (err) {
              console.error('[MemberPermissionsPage] Error loading permissions for member:', err);
            }
          }

          setMembers(membersWithPerms);
        } catch (err) {
          console.error('[MemberPermissionsPage] Failed to load members:', err);
          setError('Failed to load team members');
        }
      }
    } catch (error) {
      console.error('[MemberPermissionsPage] Failed to load data:', error);
      setError('Failed to load page. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  // Effect: Load data when org is ready
  useEffect(() => {
    if (isLoaded && orgId) {
      loadData();
    }
  }, [isLoaded, orgId]);

  // API: Create or update pool
  const savePool = async (pool: Partial<Pool>) => {
    if (!orgId) return;

    try {
      const clerkToken = await getToken();
      const isNew = pool.id === 'new' || !pool.id;
      const url = isNew ? `${API_BASE}/api/pools` : `${API_BASE}/api/pools/${pool.id}`;
      const method = isNew ? 'POST' : 'PATCH';

      const payload = isNew 
        ? {
            orgId,
            name: pool.name,
            description: pool.description,
            syncInventory: pool.syncInventory ?? true,
            syncPricing: pool.syncPricing ?? true,
            locationIds: selectedLocationIds,
          }
        : {
            name: pool.name,
            description: pool.description,
            syncInventory: pool.syncInventory,
            syncPricing: pool.syncPricing,
            locationIds: selectedLocationIds,
          };

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${clerkToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Failed to save pool: ${res.status}`);

      const saved = await res.json();
      if (isNew) {
        setPools(prev => [...prev, saved]);
      } else {
        setPools(prev => prev.map(p => p.id === saved.id ? saved : p));
      }

      showToast(isNew ? 'Pool created' : 'Pool updated', 'success');
      setEditingPool(null);
      setSelectedLocationIds([]);
    } catch (error) {
      console.error('[MemberPermissionsPage] Failed to save pool:', error);
      showToast(error instanceof Error ? error.message : 'Failed to save pool', 'error');
    }
  };

  // API: Delete pool
  const handleDeletePool = async (poolId: string) => {
    try {
      const clerkToken = await getToken();
      const res = await fetch(`${API_BASE}/api/pools/${poolId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${clerkToken}`,
          'Content-Type': 'application/json'
        },
      });

      if (!res.ok) throw new Error(`Failed to delete pool: ${res.status}`);

      setPools(prev => prev.filter(p => p.id !== poolId));
      showToast('Pool deleted', 'success');
      setDeletingPoolId(null);
    } catch (error) {
      console.error('[MemberPermissionsPage] Failed to delete pool:', error);
      showToast(error instanceof Error ? error.message : 'Failed to delete pool', 'error');
    }
  };

  // API: Assign/remove pool access for member
  const updateMemberPool = async (memberId: string, poolId: string, assign: boolean) => {
    if (!orgId) return;

    setUpdatingMemberPool({ memberId, poolId });
    try {
      const clerkToken = await getToken();
      const member = members.find(m => m.userId === memberId);
      if (!member) return;

      const newPoolIds = assign
        ? [...member.assignedPoolIds, poolId]
        : member.assignedPoolIds.filter(id => id !== poolId);

      const res = await fetch(
        `${API_BASE}/api/organizations/${orgId}/members/${memberId}/permissions`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${clerkToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ assignedPoolIds: newPoolIds }),
        }
      );

      if (!res.ok) throw new Error(`Failed to update pool access: ${res.status}`);

      setMembers(prev => prev.map(m =>
        m.userId === memberId ? { ...m, assignedPoolIds: newPoolIds } : m
      ));
      showToast(assign ? 'Pool access granted' : 'Pool access removed', 'success');
    } catch (error) {
      console.error('[MemberPermissionsPage] Failed to update member pool:', error);
      showToast(error instanceof Error ? error.message : 'Failed to update access', 'error');
    } finally {
      setUpdatingMemberPool(null);
    }
  };

  // API: Update member pool permissions
  const updatePoolPermission = async (
    memberId: string,
    poolId: string,
    permission: 'canRead' | 'canEdit' | 'canSync',
    value: boolean
  ) => {
    if (!orgId) return;

    try {
      const clerkToken = await getToken();
      const member = members.find(m => m.userId === memberId);
      if (!member) return;

      const perms = member.poolPermissions[poolId] || { canRead: true, canEdit: false, canSync: false };

      const res = await fetch(
        `${API_BASE}/api/organizations/${orgId}/members/${memberId}/permissions`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${clerkToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            poolPermissions: {
              [poolId]: { ...perms, [permission]: value }
            }
          }),
        }
      );

      if (!res.ok) throw new Error(`Failed to update permission: ${res.status}`);

      setMembers(prev => prev.map(m =>
        m.userId === memberId
          ? {
              ...m,
              poolPermissions: {
                ...m.poolPermissions,
                [poolId]: { ...perms, [permission]: value }
              }
            }
          : m
      ));
      showToast('Permission updated', 'success');
    } catch (error) {
      console.error('[MemberPermissionsPage] Failed to update permission:', error);
      showToast(error instanceof Error ? error.message : 'Failed to update permission', 'error');
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return (
    <div className="p-4">
      <div className="text-red-600 mb-4">{error}</div>
      <Button onClick={() => { setError(null); loadData(); }}>Retry</Button>
    </div>
  );
  if (!orgId) return <div className="p-4">No organization selected</div>;

  const unassignedLocations = getUnassignedLocations();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Location Pools & Team Access</h2>
        <p className="text-muted-foreground">
          Organize physical locations into pools and control team access
        </p>
      </div>

      {/* SECTION 1: Pools Management (Admin only) */}
      {isAdmin && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Location Pools</CardTitle>
            <Dialog>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingPool({
                    id: 'new',
                    orgId: orgId!,
                    name: '',
                    description: '',
                    syncInventory: true,
                    syncPricing: true,
                    locationIds: [],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  });
                  setSelectedLocationIds([]);
                }}>
                  + New Pool
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingPool?.id === 'new' ? 'Create Pool' : `Edit ${editingPool?.name}`}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Pool Name *</Label>
                    <Input
                      value={editingPool?.name || ''}
                      onChange={(e) => setEditingPool(prev => prev ? { ...prev, name: e.target.value } : null)}
                      placeholder="e.g., Atlanta Locations, West Coast"
                    />
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Input
                      value={editingPool?.description || ''}
                      onChange={(e) => setEditingPool(prev => prev ? { ...prev, description: e.target.value } : null)}
                      placeholder="Optional notes about this pool"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={editingPool?.syncInventory ?? true}
                        onCheckedChange={(checked) => setEditingPool(prev => prev ? { ...prev, syncInventory: !!checked } : null)}
                      />
                      <Label>Sync Inventory</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={editingPool?.syncPricing ?? true}
                        onCheckedChange={(checked) => setEditingPool(prev => prev ? { ...prev, syncPricing: !!checked } : null)}
                      />
                      <Label>Sync Pricing</Label>
                    </div>
                  </div>

                  {/* Location Selection */}
                  <div className="border-t pt-4">
                    <Label className="text-base font-semibold">Assign Locations</Label>
                    <div className="mt-3 space-y-3 max-h-60 overflow-y-auto border rounded p-3 bg-muted/20">
                      {Object.keys(allLocations).length === 0 ? (
                        <div className="text-sm text-muted-foreground">No locations available. Connect a platform first.</div>
                      ) : (
                        Object.entries(allLocations).map(([connId, group]) => (
                          <div key={connId}>
                            <div className="text-xs font-semibold text-muted-foreground mb-2">
                              {group.platformType} • {group.connectionName}
                            </div>
                            <div className="ml-2 space-y-2">
                              {group.locations.map((loc) => (
                                <div key={loc.platformLocationId} className="flex items-center space-x-2">
                                  <Checkbox
                                    checked={selectedLocationIds.includes(loc.platformLocationId)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedLocationIds(prev => [...prev, loc.platformLocationId]);
                                      } else {
                                        setSelectedLocationIds(prev => prev.filter(id => id !== loc.platformLocationId));
                                      }
                                    }}
                                  />
                                  <Label className="text-sm">{loc.locationName}</Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" onClick={() => setEditingPool(null)}>Cancel</Button>
                    <Button onClick={() => {
                      if (editingPool) savePool(editingPool);
                    }}>
                      {editingPool?.id === 'new' ? 'Create Pool' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent className="space-y-3">
            {pools.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center p-8">
                No pools yet. Create one to get started.
              </div>
            ) : (
              pools.map((pool) => {
                const poolLocs = getPoolLocations(pool.id);
                return (
                  <div key={pool.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold">{pool.name}</h4>
                        <p className="text-sm text-muted-foreground">{pool.description || '–'}</p>
                        <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                          <span>📍 {poolLocs.length} location{poolLocs.length !== 1 ? 's' : ''}</span>
                          <span>{pool.syncInventory ? '✓' : '✗'} Inventory</span>
                          <span>{pool.syncPricing ? '✓' : '✗'} Pricing</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => {
                              setEditingPool(pool);
                              setSelectedLocationIds(pool.locationIds || []);
                            }}>
                              Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Edit {editingPool?.name}</DialogTitle>
                            </DialogHeader>
                            {editingPool?.id === pool.id && (
                              <div className="space-y-4">
                                <div>
                                  <Label>Name</Label>
                                  <Input
                                    value={editingPool.name}
                                    onChange={(e) => setEditingPool({ ...editingPool, name: e.target.value })}
                                  />
                                </div>
                                <div>
                                  <Label>Description</Label>
                                  <Input
                                    value={editingPool.description || ''}
                                    onChange={(e) => setEditingPool({ ...editingPool, description: e.target.value })}
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      checked={editingPool.syncInventory}
                                      onCheckedChange={(checked) => setEditingPool({ ...editingPool, syncInventory: !!checked })}
                                    />
                                    <Label>Sync Inventory</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      checked={editingPool.syncPricing}
                                      onCheckedChange={(checked) => setEditingPool({ ...editingPool, syncPricing: !!checked })}
                                    />
                                    <Label>Sync Pricing</Label>
                                  </div>
                                </div>

                                {/* Current Locations */}
                                <div className="border-t pt-4">
                                  <Label className="font-semibold">Current Locations</Label>
                                  {poolLocs.length === 0 ? (
                                    <div className="text-sm text-muted-foreground mt-2 p-2 bg-muted/30 rounded">None</div>
                                  ) : (
                                    <div className="mt-2 space-y-1">
                                      {poolLocs.map((loc) => (
                                        <div key={loc.platformLocationId} className="flex items-center justify-between text-sm p-2 bg-muted/20 rounded">
                                          <span>{loc.locationName}</span>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 text-red-600"
                                            onClick={() => {
                                              const newIds = selectedLocationIds.filter(id => id !== loc.platformLocationId);
                                              setSelectedLocationIds(newIds);
                                            }}
                                          >
                                            Remove
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Add More */}
                                <div className="border-t pt-4">
                                  <Label className="font-semibold">Add More Locations</Label>
                                  <div className="mt-2 max-h-40 overflow-y-auto space-y-2 border rounded p-2">
                                    {Object.entries(allLocations).map(([connId, group]) => (
                                      <div key={connId}>
                                        <div className="text-xs font-semibold mb-1 text-muted-foreground">
                                          {group.platformType} • {group.connectionName}
                                        </div>
                                        {group.locations.map((loc) => {
                                          const alreadyAdded = selectedLocationIds.includes(loc.platformLocationId);
                                          return (
                                            <div key={loc.platformLocationId} className="flex items-center space-x-2 ml-2">
                                              <Checkbox
                                                checked={alreadyAdded}
                                                disabled={alreadyAdded}
                                                onCheckedChange={(checked) => {
                                                  if (checked) {
                                                    setSelectedLocationIds(prev => [...prev, loc.platformLocationId]);
                                                  }
                                                }}
                                              />
                                              <Label className="text-sm" style={{ opacity: alreadyAdded ? 0.5 : 1 }}>
                                                {loc.locationName}
                                              </Label>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                <div className="flex gap-2 justify-end border-t pt-4">
                                  <Button variant="outline" onClick={() => setEditingPool(null)}>Cancel</Button>
                                  <Button onClick={() => savePool(editingPool)}>Save</Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-red-600" onClick={() => setDeletingPoolId(pool.id)}>
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete {pool.name}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This pool and its location assignments will be removed from all team members.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction className="bg-red-600" onClick={() => handleDeletePool(pool.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>

                    {/* Locations in this pool */}
                    {poolLocs.length > 0 && (
                      <div className="text-sm space-y-1 ml-2 pt-2 border-t">
                        {poolLocs.map((loc) => (
                          <div key={loc.platformLocationId} className="flex items-center gap-2 text-muted-foreground">
                            <span className="w-2 h-2 bg-blue-400 rounded-full" />
                            <span>{loc.locationName}</span>
                            <span className="text-xs opacity-70">({loc.platformConnection?.platformType})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      )}

      {/* SECTION 2: Unassigned Locations */}
      {isAdmin && Object.keys(unassignedLocations).length > 0 && (
        <Card className="border-amber-200 bg-amber-50/30">
          <CardHeader>
            <CardTitle className="text-amber-900">Available Locations Not in Any Pool</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(unassignedLocations).map(([connId, locs]) => (
              <div key={connId}>
                <div className="text-sm font-semibold text-muted-foreground mb-2">
                  {locs[0]?.platformConnection?.platformType} • {locs[0]?.platformConnection?.displayName}
                </div>
                <div className="ml-2 space-y-1">
                  {locs.map((loc) => (
                    <div key={loc.platformLocationId} className="flex items-center justify-between text-sm p-2 bg-white/50 rounded">
                      <span>{loc.locationName}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingPool({
                            id: 'new',
                            orgId: orgId!,
                            name: `${loc.locationName} Pool`,
                            description: '',
                            syncInventory: true,
                            syncPricing: true,
                            locationIds: [loc.platformLocationId],
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                          });
                          setSelectedLocationIds([loc.platformLocationId]);
                        }}
                      >
                        Create Pool
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* SECTION 3: Team Access Control */}
      <Card>
        <CardHeader>
          <CardTitle>Team Access</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {members.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center p-4">No team members</div>
          ) : (
            members.map((member) => (
              <div key={member.userId} className="space-y-2 p-3 border rounded">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium">{member.firstName} {member.lastName} ({member.email})</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Role: <span className="capitalize">{member.role.replace('org:', '')}</span>
                    </div>
                  </div>
                </div>

                {/* Pool Access */}
                <div className="ml-2 space-y-2 border-t pt-2">
                  <Label className="text-sm font-semibold">Pool Access</Label>
                  {pools.length === 0 ? (
                    <div className="text-xs text-muted-foreground">No pools created yet</div>
                  ) : (
                    <div className="space-y-2">
                      {pools.map((pool) => {
                        const hasAccess = member.assignedPoolIds.includes(pool.id);
                        const perms = member.poolPermissions[pool.id] || { canRead: true, canEdit: false, canSync: false };
                        const isUpdating = updatingMemberPool?.memberId === member.userId && updatingMemberPool?.poolId === pool.id;

                        return (
                          <div key={pool.id} className="text-sm space-y-1 p-2 bg-muted/20 rounded">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{pool.name}</span>
                              <Checkbox
                                checked={hasAccess}
                                disabled={isUpdating}
                                onCheckedChange={(checked) => updateMemberPool(member.userId, pool.id, !!checked)}
                              />
                            </div>

                            {hasAccess && (
                              <div className="ml-2 space-y-1 text-xs">
                                <div className="flex items-center space-x-2">
                                  <Checkbox checked disabled />
                                  <span>Read (always)</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    checked={perms.canEdit}
                                    disabled={isUpdating}
                                    onCheckedChange={(checked) => updatePoolPermission(member.userId, pool.id, 'canEdit', !!checked)}
                                  />
                                  <span>Edit</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    checked={perms.canSync}
                                    disabled={isUpdating}
                                    onCheckedChange={(checked) => updatePoolPermission(member.userId, pool.id, 'canSync', !!checked)}
                                  />
                                  <span>Sync</span>
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
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}