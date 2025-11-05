'use client';

import { useOrganization } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/design-system/components/ui/select';
import { Checkbox } from '@repo/design-system/components/ui/checkbox';
import { Label } from '@repo/design-system/components/ui/label';

// ✅ CORRECT: Use frontend API routes, not direct backend calls
const API_BASE = '/api'; // Frontend API routes handle authentication

interface Pool {
  id: string;
  name: string;
  description?: string;
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

// ✅ CORRECT: Frontend API routes handle authentication automatically
const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  console.log(`[${type.toUpperCase()}] ${message}`);
  // TODO: Replace with actual toast component
};

export default function MemberPermissionsPage() {
  const { organization, isLoaded } = useOrganization();

  const [pools, setPools] = useState<Pool[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<Record<string, MemberPermissions>>({});
  const [schema, setSchema] = useState<OrgSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Record<string, boolean>>({});

  const orgId = organization?.id;

  useEffect(() => {
    if (!orgId) return;
    loadData();
  }, [orgId]);

  // ✅ CORRECT: Frontend API routes handle auth automatically
  const loadData = async () => {
    if (!orgId) return;

    setLoading(true);
    try {
      // Call frontend API routes - they handle Clerk → Supabase token exchange
      const [poolsRes, schemaRes] = await Promise.all([
        fetch(`${API_BASE}/pools/org/${orgId}`, { cache: 'no-store' }),
        fetch(`${API_BASE}/organizations/${orgId}/schema`, { cache: 'no-store' })
      ]);

      if (poolsRes.ok) {
        const poolsData = await poolsRes.json();
        setPools(Array.isArray(poolsData) ? poolsData : []);
      }

      if (schemaRes.ok) {
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
              // ✅ CORRECT: Use frontend API route
              const permRes = await fetch(
                `${API_BASE}/organizations/${orgId}/members/${member.publicUserData?.userId}/permissions`,
                { cache: 'no-store' }
              );
              if (permRes.ok) {
                const permData = await permRes.json();
                permissionsMap[member.publicUserData?.userId || ''] = permData;
              }
            } catch (err) {
              console.error(`Failed to load permissions for member ${member.publicUserData?.userId}:`, err);
            }
          }
          setPermissions(permissionsMap);
        } catch (err) {
          console.error('Failed to load members:', err);
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      showToast('Failed to load permissions data', 'error');
    } finally {
      setLoading(false);
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
      // ✅ CORRECT: Use frontend API route - handles auth automatically
      const res = await fetch(
        `${API_BASE}/organizations/${orgId}/members/${memberId}/permissions`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
          cache: 'no-store',
        }
      );

      if (!res.ok) {
        throw new Error('Failed to update permissions');
      }

      showToast('Permissions updated successfully', 'success');

      // Reload data
      await loadData();
    } catch (error) {
      console.error('Failed to update permissions:', error);
      showToast('Failed to update permissions', 'error');
    } finally {
      setSaving({ ...saving, [memberId]: false });
    }
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
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
                      : member.publicUserData?.emailAddresses?.[0]?.emailAddress || 'Unknown'}
                  </div>
                  <div className="text-sm font-normal text-muted-foreground">
                    {member.publicUserData?.emailAddresses?.[0]?.emailAddress}
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