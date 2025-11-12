'use client';

import { useOrganization, useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/design-system/components/ui/select';
import { Checkbox } from '@repo/design-system/components/ui/checkbox';
import { Label } from '@repo/design-system/components/ui/label';
import { Button } from '@repo/design-system/components/ui/button';
import { Input } from '@repo/design-system/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/design-system/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@repo/design-system/components/ui/alert-dialog';

// ✅ CORRECT: Direct backend calls with Clerk token (no exchange needed)
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

// Debug: Log the API base being used
if (typeof window !== 'undefined') {
  console.log('[DEBUG] API_BASE:', API_BASE);
  console.log('[DEBUG] NEXT_PUBLIC_API_URL env:', process.env.NEXT_PUBLIC_API_URL);
}

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

interface AvailableLocations {
  [connectionId: string]: {
    connectionName: string;
    platformType: string;
    locations: Array<{
      platformLocationId: string;
      locationName: string;
      timezone?: string;
    }>;
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

interface MemberPermissions {
  membershipId: string;
  userId: string;
  role: string;
  assignedPoolIds: string[];
  poolPermissions: Record<string, { canRead: boolean; canEdit: boolean; canSync: boolean }>;
  user: {
    Id: string;
    Email: string;
    FirstName?: string;
    LastName?: string;
  };
}

interface OrgSchema {
  tier: string;
  features: Record<string, boolean>;
  limits: Record<string, number>;
}

// Pool edit state
interface EditingPool {
  id: string;
  name: string;
  description: string;
  syncInventory: boolean;
  syncPricing: boolean;
  locationIds?: string[];
}

// Delete state
interface DeletingPool {
  id: string;
  name: string;
  mergeTarget: string | null;
  availablePools: Pool[];
}

// ✅ CORRECT: Frontend API routes handle authentication automatically
const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  console.log(`[${type.toUpperCase()}] ${message}`);
  // TODO: Replace with actual toast component
};

export default function MemberPermissionsPage() {
  const { organization, isLoaded, membership } = useOrganization();
  const { getToken } = useAuth();  // Direct Clerk token for APIs
  // const supabase = useSupabase();  // Use if direct DB fetches needed

  const [pools, setPools] = useState<Pool[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<Record<string, MemberPermissions>>({});
  const [schema, setSchema] = useState<OrgSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [poolLoading, setPoolLoading] = useState(false);
  const [editingPool, setEditingPool] = useState<EditingPool | null>(null);
  const [deletingPool, setDeletingPool] = useState<DeletingPool | null>(null);
  const [availableLocations, setAvailableLocations] = useState<AvailableLocations>({});
  const [poolLocations, setPoolLocations] = useState<Record<string, Location[]>>({});
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [selectedPoolLocationIds, setSelectedPoolLocationIds] = useState<string[]>([]);

  const orgId = organization?.id;

  // RBAC: Check if current user can manage pools (admin only)
  const canManagePools = membership?.role === 'org:admin';

  // Remove initializeSupabase useEffect - native is always ready with Clerk session

  // Load available locations after pools are loaded
  const loadAvailableLocations = async () => {
    if (!orgId) return;
    
    setLocationsLoading(true);
    try {
      const clerkToken = await getToken();
      const res = await fetch(`${API_BASE}/api/pools/locations/available?orgId=${orgId}`, {
        headers: {
          'Authorization': `Bearer ${clerkToken}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      });

      if (!res.ok) {
        console.error('[MemberPermissionsPage] Failed to load available locations:', res.status);
        return;
      }

      const locationData = await res.json();
      setAvailableLocations(locationData);
      console.log('[MemberPermissionsPage] Loaded available locations:', locationData);
    } catch (error) {
      console.error('[MemberPermissionsPage] Failed to load available locations:', error);
    } finally {
      setLocationsLoading(false);
    }
  };

  // Load locations for all pools
  const loadPoolLocations = async () => {
    if (pools.length === 0) return;

    try {
      const clerkToken = await getToken();
      const locMap: Record<string, Location[]> = {};

      for (const pool of pools) {
        const res = await fetch(`${API_BASE}/api/pools/${pool.id}/locations`, {
          headers: {
            'Authorization': `Bearer ${clerkToken}`,
            'Content-Type': 'application/json',
          },
          cache: 'no-store'
        });

        if (res.ok) {
          const data = await res.json();
          locMap[pool.id] = data.locations || [];
        }
      }

      setPoolLocations(locMap);
      console.log('[MemberPermissionsPage] Loaded pool locations:', locMap);
    } catch (error) {
      console.error('[MemberPermissionsPage] Failed to load pool locations:', error);
    }
  };

  // Update loadData to use Clerk token directly for backend APIs
  useEffect(() => {
    if (!isLoaded || !orgId) {
      if (!isLoaded) {
        console.log('[MemberPermissionsPage] Waiting for organization to load...');
      }
      if (!orgId) {
        console.log('[MemberPermissionsPage] No organization selected');
      }
      return;
    }
    loadData();
  }, [isLoaded, orgId]);

  // Load locations after pools are loaded
  useEffect(() => {
    if (pools.length > 0) {
      loadAvailableLocations();
      loadPoolLocations();
    }
  }, [pools]);

  // ✅ CORRECT: Direct backend calls with JWT token
  const loadData = async () => {
    if (!orgId) {
      setError('No organization selected');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const clerkToken = await getToken();  // Clerk token for backend
      if (!clerkToken) {
        throw new Error('Not authenticated');
      }

      // Direct backend calls with JWT token
      const headers = {
        'Authorization': `Bearer ${clerkToken}`,  // Pass Clerk token to backend
        'Content-Type': 'application/json',
      };

      const [poolsRes, schemaRes] = await Promise.all([
        fetch(`${API_BASE}/api/pools/org/${orgId}`, { headers, cache: 'no-store' }),
        fetch(`${API_BASE}/api/organizations/${orgId}/schema`, { headers, cache: 'no-store' })
      ]);

      // Handle pools response
      if (!poolsRes.ok) {
        console.error('[MemberPermissionsPage] Failed to load pools:', poolsRes.status, poolsRes.statusText);
        const poolsErrorText = await poolsRes.text();
        console.error('Pools error body:', poolsErrorText);
        setPools([]); // Set empty array on error
        showToast(`Failed to load pools: ${poolsRes.status}`, 'error');
      } else {
        const poolsData = await poolsRes.json();
        setPools(Array.isArray(poolsData) ? poolsData : []);
      }

      // Handle schema response
      if (!schemaRes.ok) {
        console.error('[MemberPermissionsPage] Failed to load schema:', schemaRes.status, schemaRes.statusText);
        const schemaErrorText = await schemaRes.text();
        console.error('Schema error body:', schemaErrorText);
        setSchema(null); // Set null on error
        showToast(`Failed to load organization schema: ${schemaRes.status}`, 'error');
      } else {
        const schemaData = await schemaRes.json();
        setSchema(schemaData);
      }

      // Load members from Clerk (organization.getMemberships)
      if (organization?.getMemberships) {
        try {
          const membershipList = await organization.getMemberships();
          const membersList = membershipList.data || [];
          setMembers(membersList);

          // Load permissions for each member via frontend API routes
          const permissionsMap: Record<string, MemberPermissions> = {};
          for (const member of membersList) {
            try {
              const memberId = member.publicUserData?.userId;
              if (!memberId) continue;

              const permRes = await fetch(
                `${API_BASE}/api/organizations/${orgId}/members/${memberId}/permissions`,
                { 
                  headers: {
                    'Authorization': `Bearer ${clerkToken}`,
                    'Content-Type': 'application/json',
                  },
                  cache: 'no-store' 
                }
              );

              if (!permRes.ok) {
                console.error(`[MemberPermissionsPage] Failed to load permissions for member ${memberId}:`, permRes.status, permRes.statusText);
                const permErrorText = await permRes.text();
                console.error('Permissions error body:', permErrorText);
                const memberDisplayName = member.publicUserData?.identifier || memberId;
                showToast(`Failed to load permissions for ${memberDisplayName}`, 'error');
                continue;
              }

              const permData = await permRes.json();
              permissionsMap[memberId] = permData;
            } catch (err) {
              console.error(`[MemberPermissionsPage] Error loading permissions for member:`, err);
              showToast('Error loading some member permissions', 'error');
            }
          }
          setPermissions(permissionsMap);
        } catch (err) {
          console.error('[MemberPermissionsPage] Failed to load members:', err);
          setError('Failed to load team members');
          showToast('Failed to load team members', 'error');
        }
      } else {
        console.warn('[MemberPermissionsPage] organization.getMemberships not available');
      }
    } catch (error) {
      console.error('[MemberPermissionsPage] Failed to load data:', error);
      setError('Failed to load permissions data. Please refresh the page.');
      showToast('Failed to load permissions data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // NEW: Load available pools for delete merge target (exclude the one being deleted)
  const loadAvailablePoolsForDelete = async (excludePoolId: string) => {
    setPoolLoading(true);
    try {
      const clerkToken = await getToken();
      const res = await fetch(`${API_BASE}/api/pools/org/${orgId}`, { 
        headers: {
          'Authorization': `Bearer ${clerkToken}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store' 
      });
      if (!res.ok) throw new Error(`Failed to load pools: ${res.status}`);
      
      const poolData: Pool[] = await res.json();
      const filteredPools = (Array.isArray(poolData) ? poolData : [])
        .filter(p => p.id !== excludePoolId)
        .sort((a, b) => a.name.localeCompare(b.name));

      // Add 'none' option
      const options = [
        { id: 'none', name: 'No merge (locations become individual)' },
        ...filteredPools
      ];

      return options;
    } catch (error) {
      console.error('[MemberPermissionsPage] Failed to load pools for delete:', error);
      showToast('Failed to load available pools', 'error');
      return [];
    } finally {
      setPoolLoading(false);
    }
  };

  // NEW: Update pool
  const updatePool = async (poolId: string, updates: Partial<Pool>) => {
    try {
      const clerkToken = await getToken();
      const res = await fetch(`${API_BASE}/api/pools/${poolId}`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${clerkToken}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to update pool: ${res.status} - ${errorText}`);
      }

      const updatedPool = await res.json();
      setPools(prev => prev.map(p => p.id === poolId ? updatedPool : p));
      showToast('Pool updated successfully', 'success');
      setEditingPool(null);
    } catch (error) {
      console.error('[MemberPermissionsPage] Failed to update pool:', error);
      showToast(error instanceof Error ? error.message : 'Failed to update pool', 'error');
    }
  };

  // NEW: Delete pool with merge
  const deletePool = async (poolId: string, mergeIntoPoolId?: string) => {
    try {
      const clerkToken = await getToken();
      const res = await fetch(`${API_BASE}/api/pools/${poolId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${clerkToken}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ mergeIntoPoolId }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to delete pool: ${res.status} - ${errorText}`);
      }

      setPools(prev => prev.filter(p => p.id !== poolId));
      showToast('Pool deleted successfully', 'success');
      setDeletingPool(null);
    } catch (error) {
      console.error('[MemberPermissionsPage] Failed to delete pool:', error);
      showToast(error instanceof Error ? error.message : 'Failed to delete pool', 'error');
    }
  };

  // NEW: Add/update locations for a pool
  const updatePoolLocations = async (poolId: string, locationIds: string[]) => {
    try {
      const clerkToken = await getToken();
      const res = await fetch(`${API_BASE}/api/pools/${poolId}`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${clerkToken}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ locationIds }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to update pool locations: ${res.status} - ${errorText}`);
      }

      const updatedPool = await res.json();
      setPools(prev => prev.map(p => p.id === poolId ? { ...p, locationIds: updatedPool.locationIds } : p));
      
      // Reload pool locations
      const locRes = await fetch(`${API_BASE}/api/pools/${poolId}/locations`, {
        headers: {
          'Authorization': `Bearer ${clerkToken}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      });

      if (locRes.ok) {
        const locData = await locRes.json();
        setPoolLocations(prev => ({ ...prev, [poolId]: locData.locations || [] }));
      }

      showToast('Pool locations updated successfully', 'success');
    } catch (error) {
      console.error('[MemberPermissionsPage] Failed to update pool locations:', error);
      showToast(error instanceof Error ? error.message : 'Failed to update pool locations', 'error');
    }
  };

  const updateMemberPermissions = async (memberId: string, updates: {
    role?: string;
    assignedPoolIds?: string[];
    poolPermissions?: Record<string, { canRead?: boolean; canEdit?: boolean; canSync?: boolean }>;
  }) => {
    if (!orgId) return;

    setSaving({ ...saving, [memberId]: true });
    try {
      // ✅ CORRECT: Direct backend call with JWT token
      const clerkToken = await getToken();
      const res = await fetch(
        `${API_BASE}/api/organizations/${orgId}/members/${memberId}/permissions`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${clerkToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
          cache: 'no-store',
        }
      );

      if (!res.ok) {
        const errorText = await res.text();
        console.error('[MemberPermissionsPage] Failed to update permissions:', res.status, errorText);
        throw new Error(`Failed to update permissions: ${res.status}`);
      }

      showToast('Permissions updated successfully', 'success');

      // Reload data
      await loadData();
    } catch (error) {
      console.error('Failed to update permissions:', error);
      showToast('Failed to update permissions. Please try again.', 'error');
    } finally {
      setSaving({ ...saving, [memberId]: false });
    }
  };

  if (loading) {
    return <div className="p-4">Loading permissions...</div>;
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-red-600 mb-4">{error}</div>
        <button 
          onClick={() => { setError(null); loadData(); }}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!orgId) {
    return <div className="p-4">No organization selected</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Member Permissions</h2>
        <p className="text-muted-foreground">
          Manage roles and pool access for team members
        </p>
        {schema && (
          <div className="mt-2 text-sm text-muted-foreground">
            Current tier: <span className="font-semibold">{schema.tier}</span>
          </div>
        )}
      </div>

      {/* NEW: Pools Management Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Location Pools
            {!canManagePools && (
              <span className="text-xs font-normal text-muted-foreground">
                (Admin only)
              </span>
            )}
            {canManagePools && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button onClick={() => setEditingPool({ id: 'new', name: '', description: '', syncInventory: true, syncPricing: true, locationIds: [] })}>
                    Create Pool
                  </Button>
                </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingPool?.id === 'new' ? 'Create Pool' : 'Edit Pool'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={editingPool?.name || ''}
                      onChange={(e) => setEditingPool(prev => prev ? { ...prev, name: e.target.value } : null)}
                      placeholder="Pool name"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input
                      value={editingPool?.description || ''}
                      onChange={(e) => setEditingPool(prev => prev ? { ...prev, description: e.target.value } : null)}
                      placeholder="Optional description"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Sync Settings</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="sync-inventory"
                          checked={editingPool?.syncInventory || false}
                          onCheckedChange={(checked) => setEditingPool(prev => prev ? { ...prev, syncInventory: !!checked } : null)}
                        />
                        <Label htmlFor="sync-inventory" className="text-sm">Sync Inventory</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="sync-pricing"
                          checked={editingPool?.syncPricing || false}
                          onCheckedChange={(checked) => setEditingPool(prev => prev ? { ...prev, syncPricing: !!checked } : null)}
                        />
                        <Label htmlFor="sync-pricing" className="text-sm">Sync Pricing</Label>
                      </div>
                    </div>
                  </div>
                  
                  {/* Location Selection for New Pool */}
                  {editingPool?.id === 'new' && (
                    <div className="space-y-2">
                      <Label>Select Locations</Label>
                      <div className="space-y-3 max-h-48 overflow-y-auto border rounded-md p-2">
                        {Object.entries(availableLocations).length === 0 ? (
                          <div className="text-sm text-muted-foreground">
                            {locationsLoading ? 'Loading locations...' : 'No locations available'}
                          </div>
                        ) : (
                          Object.entries(availableLocations).map(([connId, conn]) => (
                            <div key={connId} className="space-y-2">
                              <div className="text-xs font-semibold text-muted-foreground">
                                {conn.platformType} - {conn.connectionName}
                              </div>
                              {conn.locations.map((loc) => (
                                <div key={loc.platformLocationId} className="flex items-center space-x-2 ml-2">
                                  <Checkbox
                                    checked={selectedPoolLocationIds.includes(loc.platformLocationId)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedPoolLocationIds(prev => [...prev, loc.platformLocationId]);
                                      } else {
                                        setSelectedPoolLocationIds(prev => prev.filter(id => id !== loc.platformLocationId));
                                      }
                                    }}
                                  />
                                  <Label className="text-sm cursor-pointer">{loc.locationName}</Label>
                                </div>
                              ))}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={async () => {
                      if (!editingPool || !orgId) return;
                      if (editingPool.id === 'new') {
                        // Create new pool
                        const clerkToken = await getToken();
                        const res = await fetch(`${API_BASE}/api/pools`, {
                          method: 'POST',
                          headers: { 
                            'Authorization': `Bearer ${clerkToken}`,
                            'Content-Type': 'application/json' 
                          },
                          body: JSON.stringify({
                            orgId,
                            name: editingPool.name,
                            description: editingPool.description,
                            syncInventory: editingPool.syncInventory,
                            syncPricing: editingPool.syncPricing,
                            locationIds: selectedPoolLocationIds,
                          }),
                        });
                        if (res.ok) {
                          const newPool = await res.json();
                          setPools(prev => [...prev, newPool]);
                          showToast('Pool created successfully', 'success');
                          setSelectedPoolLocationIds([]);
                        } else {
                          showToast('Failed to create pool', 'error');
                        }
                      } else {
                        // Update existing
                        await updatePool(editingPool.id, editingPool);
                      }
                      setEditingPool(null);
                    }}
                    className="w-full"
                  >
                    {editingPool?.id === 'new' ? 'Create' : 'Update'}
                  </Button>
                </div>
              </DialogContent>
              </Dialog>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {poolLoading ? (
            <div className="p-4 text-center">Loading pools...</div>
          ) : pools.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No pools created yet. Create your first pool to organize locations.
            </div>
          ) : (
            <div className="space-y-2">
              {pools.map((pool) => {
                const poolLocs = poolLocations[pool.id] || [];
                return (
                <div key={pool.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <div className="flex-1">
                      <div className="font-medium">{pool.name}</div>
                      <div className="text-sm text-muted-foreground">{pool.description || 'No description'}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {poolLocs.length} location{poolLocs.length !== 1 ? 's' : ''} • Inventory: {pool.syncInventory ? 'On' : 'Off'} | Pricing: {pool.syncPricing ? 'On' : 'Off'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {canManagePools && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => setEditingPool({ id: pool.id, name: pool.name, description: pool.description || '', syncInventory: pool.syncInventory, syncPricing: pool.syncPricing, locationIds: pool.locationIds || [] })}>
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
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
                                placeholder="Pool name"
                              />
                            </div>
                            <div>
                              <Label>Description</Label>
                              <Input
                                value={editingPool.description}
                                onChange={(e) => setEditingPool({ ...editingPool, description: e.target.value })}
                                placeholder="Optional description"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Sync Settings</Label>
                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    checked={editingPool.syncInventory}
                                    onCheckedChange={(checked) => setEditingPool({ ...editingPool, syncInventory: !!checked })}
                                  />
                                  <Label className="text-sm">Sync Inventory</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    checked={editingPool.syncPricing}
                                    onCheckedChange={(checked) => setEditingPool({ ...editingPool, syncPricing: !!checked })}
                                  />
                                  <Label className="text-sm">Sync Pricing</Label>
                                </div>
                              </div>
                            </div>

                            {/* Current Locations */}
                            <div className="space-y-2">
                              <Label>Current Locations ({poolLocs.length})</Label>
                              {poolLocs.length === 0 ? (
                                <div className="text-sm text-muted-foreground p-2 border rounded bg-muted/30">
                                  No locations assigned to this pool yet
                                </div>
                              ) : (
                                <div className="space-y-1 p-2 border rounded max-h-32 overflow-y-auto">
                                  {poolLocs.map((loc) => (
                                    <div key={loc.platformLocationId} className="flex items-center justify-between text-sm">
                                      <span>{loc.locationName}</span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 text-red-600"
                                        onClick={() => {
                                          const newLocationIds = (pool.locationIds || []).filter(
                                            id => id !== loc.platformLocationId
                                          );
                                          updatePoolLocations(pool.id, newLocationIds);
                                        }}
                                      >
                                        Remove
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Add More Locations */}
                            <div className="space-y-2">
                              <Label>Add More Locations</Label>
                              <div className="space-y-2 max-h-32 overflow-y-auto border rounded-md p-2">
                                {Object.entries(availableLocations).map(([connId, conn]) => (
                                  <div key={connId} className="space-y-1">
                                    <div className="text-xs font-semibold text-muted-foreground">
                                      {conn.platformType}
                                    </div>
                                    {conn.locations.map((loc) => {
                                      const isAlreadyAdded = poolLocs.some(
                                        pl => pl.platformLocationId === loc.platformLocationId
                                      );
                                      return (
                                        <div key={loc.platformLocationId} className="flex items-center space-x-2 ml-2">
                                          <Checkbox
                                            disabled={isAlreadyAdded}
                                            onCheckedChange={(checked) => {
                                              if (checked) {
                                                const newLocationIds = [...(pool.locationIds || []), loc.platformLocationId];
                                                updatePoolLocations(pool.id, newLocationIds);
                                              }
                                            }}
                                          />
                                          <Label className="text-sm cursor-pointer" style={{ opacity: isAlreadyAdded ? 0.5 : 1 }}>
                                            {loc.locationName} {isAlreadyAdded && '(already added)'}
                                          </Label>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ))}
                              </div>
                            </div>

                            <Button onClick={() => updatePool(pool.id, editingPool)} className="w-full">
                              Update Settings
                            </Button>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>
                    )}
                    {canManagePools && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-red-600">
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Pool</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure? This will{' '}
                            <span className="font-medium">permanently delete {pool.name}</span> and remove it from all members.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={async () => {
                              await deletePool(pool.id);
                            }}
                            className="bg-red-600"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    )}
                  </div>
                </div>
              );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Member Permissions Section */}
      <div className="space-y-4">
        {members.map((member) => {
          const memberId = member.publicUserData?.userId || '';
          const memberPerms = permissions[memberId];
          const isSaving = saving[memberId];

          return (
            <Card key={memberId}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div>
                    {member.publicUserData?.firstName || member.publicUserData?.lastName
                      ? `${member.publicUserData.firstName} ${member.publicUserData.lastName}`
                      : member.publicUserData?.identifier || member.publicUserData?.email || 'Unknown'}
                  </div>
                  <div className="text-sm font-normal text-muted-foreground">
                    {member.publicUserData?.identifier || member.publicUserData?.email}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Role Selection */}
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select
                    value={memberPerms?.role || member.role}
                    onValueChange={(value) => {
                      updateMemberPermissions(memberId, { role: value });
                    }}
                    disabled={isSaving}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="org:admin">Admin</SelectItem>
                      <SelectItem value="org:member">Member</SelectItem>
                      <SelectItem value="partner">Partner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Pool Assignments */}
                <div className="space-y-2">
                  <Label>Location Pools</Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                    {pools.map((pool) => {
                      const isAssigned = memberPerms?.assignedPoolIds?.includes(pool.id) || false;
                      const poolPerms = memberPerms?.poolPermissions?.[pool.id] || {
                        canRead: true,
                        canEdit: false,
                        canSync: false,
                      };

                      return (
                        <div key={pool.id} className="space-y-2 p-2 border-b last:border-b-0">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={isAssigned}
                              onCheckedChange={(checked) => {
                                const currentPools = memberPerms?.assignedPoolIds || [];
                                const newPools = checked
                                  ? [...currentPools, pool.id]
                                  : currentPools.filter((id) => id !== pool.id);
                                updateMemberPermissions(memberId, {
                                  assignedPoolIds: newPools,
                                });
                              }}
                              disabled={isSaving}
                            />
                            <Label className="font-medium">{pool.name}</Label>
                          </div>
                          {isAssigned && (
                            <div className="ml-6 space-y-1">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  checked={poolPerms.canRead}
                                  disabled={true}
                                />
                                <Label className="text-sm">Can Read</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  checked={poolPerms.canEdit}
                                  onCheckedChange={(checked) => {
                                    updateMemberPermissions(memberId, {
                                      poolPermissions: {
                                        ...memberPerms?.poolPermissions,
                                        [pool.id]: {
                                          ...poolPerms,
                                          canEdit: checked as boolean,
                                        },
                                      },
                                    });
                                  }}
                                  disabled={isSaving}
                                />
                                <Label className="text-sm">Can Edit</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  checked={poolPerms.canSync}
                                  onCheckedChange={(checked) => {
                                    updateMemberPermissions(memberId, {
                                      poolPermissions: {
                                        ...memberPerms?.poolPermissions,
                                        [pool.id]: {
                                          ...poolPerms,
                                          canSync: checked as boolean,
                                        },
                                      },
                                    });
                                  }}
                                  disabled={isSaving}
                                />
                                <Label className="text-sm">Can Sync</Label>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {pools.length === 0 && (
                      <div className="text-sm text-muted-foreground p-2">
                        No location pools available
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {members.length === 0 && (
          <div className="text-center text-muted-foreground p-4">
            No members found
          </div>
        )}
      </div>
    </div>
  );
}