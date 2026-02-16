'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  SettingsIcon, ChevronRightIcon, ShieldIcon, EyeIcon, EyeOffIcon, AlertTriangleIcon
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
  isPaused?: boolean;
  direction: 'sent' | 'received'; // Whether we sent or received this partnership
  shareType?: 'consignment' | 'wholesale' | 'sync';
  canTerminate?: boolean; // Whether current user can terminate
}

interface PendingInvite {
  id: string;
  email: string;
  poolName: string;
  expiresAt: string;
  inviteLink: string;
}

interface ReceivedInvite {
  id: string;
  sourceOrgName: string;
  sourcePoolName: string;
  shareType: 'consignment' | 'wholesale' | 'sync';
  productCount: number;  // Grouped by ProductId
  variantCount: number;  // Total variants
  expiresAt: string;
  token: string; // Token for accepting the invite
}

interface LinkedProduct {
  id: string;
  sourceVariantId: string;
  sourceVariantTitle: string;
  sourceVariantSku: string;
  targetVariantId?: string;
  status: 'active' | 'paused' | 'revoked' | 'terminated';
  visibilityStatus?: 'available' | 'out_of_stock' | 'hidden' | 'revoked';
  sharedQuantity?: number;
  lastSyncAt?: string;
  // New grouped fields
  productId?: string;
  title?: string;
  baseSku?: string;
  primaryImageUrl?: string | null;
  totalStock?: number;
  variantCount?: number;
  variants?: Array<{
    variantId: string;
    sku: string;
    options?: Record<string, string>;
    variantType?: string;
    stock: number;
  }>;
  links?: Array<{ linkId: string; sourceVariantId: string; targetVariantId: string; status: string; }>;
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
  const hasSyncedRef = useRef(false);
  const loadedOrgIdRef = useRef<string | null>(null);

  // View State
  const [activeTab, setActiveTab] = useState<Tab>('partners');
  const [isLoading, setIsLoading] = useState(true);

  // Data State
  const [pools, setPools] = useState<Pool[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [partnerships, setPartnerships] = useState<Partnership[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [receivedInvites, setReceivedInvites] = useState<ReceivedInvite[]>([]);
  const [rejectedInvites, setRejectedInvites] = useState<Array<{ id: string; email: string; poolName: string; rejectedAt: string }>>([]); // Ephemeral - cleared on action
  const [members, setMembers] = useState<TeamMember[]>([]);

  // Editing State
  const [editingPool, setEditingPool] = useState<Partial<Pool> | null>(null);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

  // Invite State
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePoolId, setInvitePoolId] = useState('');
  const [inviteCanRevoke, setInviteCanRevoke] = useState(true); // Default: consignment mode
  const [isInviting, setIsInviting] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);

  // Email validation helper
  const isValidEmail = (email: string): boolean => {
    if (!email) return false;
    // Standard email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  // Invite Success Modal State
  const [showInviteSuccess, setShowInviteSuccess] = useState(false);
  const [createdInviteLink, setCreatedInviteLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  // Create Location Modal State
  const [showCreateLocation, setShowCreateLocation] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationConnectionId, setNewLocationConnectionId] = useState('');
  const [isCreatingLocation, setIsCreatingLocation] = useState(false);

  // Connections with location creation capability
  interface ConnectionCapability {
    connectionId: string;
    connectionName: string;
    platformType: string;
    canCreateLocations: boolean;
  }
  const [connectionsWithCapabilities, setConnectionsWithCapabilities] = useState<ConnectionCapability[]>([]);

  // Linked Products State
  const [expandedPartnership, setExpandedPartnership] = useState<string | null>(null);
  const [linkedProducts, setLinkedProducts] = useState<Record<string, LinkedProduct[]>>({});
  const [loadingLinkedProducts, setLoadingLinkedProducts] = useState<string | null>(null);

  // Confirm Dialog State (replaces native confirm)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    destructive?: boolean;
    onConfirm: () => void;
  } | null>(null);

  // Alert Modal State (replaces native alert)
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  } | null>(null);

  const loadData = useCallback(async () => {
    if (!isOrgLoaded) return;

    if (!orgId) {
      setIsLoading(false);
      return;
    }

    // Only show full loading state on first load or org switch to prevent UI flashing
    if (loadedOrgIdRef.current !== orgId) {
      setIsLoading(true);
    }
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };

      // Ensure local DB is in sync with Clerk (once per session)
      if (!hasSyncedRef.current) {
        try {
          await fetch(`${API_BASE}/api/auth/backfill/clerk-orgs`, { method: 'POST', headers });
          hasSyncedRef.current = true;
        } catch (e) {
          console.error('Auto-sync failed', e);
        }
      }

      // Parallel Fetching
      const [poolsRes, locsRes, partnersRes, invitesRes] = await Promise.all([
        fetch(`${API_BASE}/api/pools/org/${orgId}`, { headers }),
        fetch(`${API_BASE}/api/pools/locations/available?orgId=${orgId}`, { headers }),
        fetch(`${API_BASE}/api/cross-org/partnerships?orgId=${orgId}`, { headers }).catch(() => null),
        fetch(`${API_BASE}/api/cross-org/invites/pending?orgId=${orgId}`, { headers }).catch(() => null),
      ]);

      if (poolsRes.ok) setPools(await poolsRes.json());
      if (locsRes.ok) {
        // Transform the nested structure from available locations endpoint to flat list
        const rawLocs: Record<string, any> = await locsRes.json();
        const flatLocs: Location[] = [];
        const capabilities: ConnectionCapability[] = [];

        // The endpoint returns { connectionId: { platformType, connectionName, locations: [...] } }
        Object.entries(rawLocs).forEach(([connectionId, conn]: [string, any]) => {
          const platformType = (conn.platformType || 'unknown').toLowerCase();
          const canCreate = platformType === 'shopify' || platformType === 'square';

          capabilities.push({
            connectionId,
            connectionName: conn.connectionName || 'Unknown Connection',
            platformType,
            canCreateLocations: canCreate,
          });

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
        setConnectionsWithCapabilities(capabilities.filter(c => c.canCreateLocations));
      }

      if (partnersRes?.ok) {
        const pData = await partnersRes.json();
        setPartnerships(pData.partnerships || []);
      }

      if (invitesRes?.ok) {
        const iData = await invitesRes.json();
        setPendingInvites(iData.sent || []);
        // Received invites - invites where this org is the target
        setReceivedInvites((iData.received || []).map((inv: any) => ({
          id: inv.id,
          sourceOrgName: inv.sourceOrgName || 'Unknown Organization',
          sourcePoolName: inv.sourcePoolName || 'Unknown Pool',
          shareType: inv.shareType || 'consignment',
          productCount: inv.productCount || inv.variantCount || 0,
          variantCount: inv.variantCount || 0,
          expiresAt: inv.expiresAt,
          token: inv.token || inv.id, // Token for accepting
        })));
        // Rejected invites - ephemeral notifications for the sender
        setRejectedInvites((iData.rejected || []).map((inv: any) => ({
          id: inv.id,
          email: inv.email || inv.inviteeEmail || 'Unknown',
          poolName: inv.poolName || 'Unknown Pool',
          rejectedAt: inv.rejectedAt || new Date().toISOString(),
        })));
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
      // Mark this org as loaded
      loadedOrgIdRef.current = orgId;
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, isOrgLoaded, getToken]); // Note: organization used inside but ref changes shouldn't trigger reload

  // Initial load
  useEffect(() => {
    if (isOrgLoaded && !orgId) {
      setIsLoading(false);
    } else if (orgId) {
      loadData();
    }
  }, [orgId, isOrgLoaded, loadData]);

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
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Pool',
      message: 'Are you sure you want to delete this pool?',
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
        setConfirmDialog(null);
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
      }
    });
  };

  const sendPartnerInvite = async () => {
    if (!inviteEmail || !invitePoolId || !orgId) return;

    setIsInviting(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/cross-org/invites?orgId=${orgId}`, {
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
        setAlertModal({ isOpen: true, title: 'Invite Failed', message: `Failed to send invite: ${errText}` });
      }
    } catch (e) {
      console.error('Failed to send invite:', e);
      setAlertModal({ isOpen: true, title: 'Error', message: 'Failed to send invite' });
    } finally {
      setIsInviting(false);
    }
  };

  const revokeInvite = async (inviteId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Revoke Invite',
      message: 'Are you sure you want to revoke this invite?',
      confirmLabel: 'Revoke',
      destructive: true,
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const token = await getToken();
          const res = await fetch(`${API_BASE}/api/cross-org/invites/${inviteId}?orgId=${orgId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });

          if (res.ok) {
            setPendingInvites(prev => prev.filter(i => i.id !== inviteId));
          } else {
            setAlertModal({ isOpen: true, title: 'Error', message: 'Failed to revoke invite' });
          }
        } catch (e) {
          console.error('Failed to revoke invite:', e);
        }
      }
    });
  };

  // Accept a received invite (for partners)
  const [isAcceptingInvite, setIsAcceptingInvite] = useState<string | null>(null);

  const acceptReceivedInvite = async (invite: ReceivedInvite) => {
    if (!orgId) {
      setAlertModal({ isOpen: true, title: 'Error', message: 'No organization selected. Switch to an organization to accept the invite.' });
      return;
    }
    setIsAcceptingInvite(invite.id);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/cross-org/invites/${invite.token}/accept?orgId=${encodeURIComponent(orgId)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      if (res.ok) {
        const result = await res.json();
        // Remove from received invites
        setReceivedInvites(prev => prev.filter(i => i.id !== invite.id));
        // Refresh data to show new partnership
        await loadData();
        setAlertModal({
          isOpen: true,
          title: '🎉 Partnership Established!',
          message: `Successfully connected with ${invite.sourceOrgName}. ${result.linkedCount || 0} products are now syncing.`
        });
      } else {
        const errorData = await res.json().catch(() => ({ message: 'Failed to accept invite' }));

        // Handle email mismatch error
        if (errorData.code === 'EMAIL_MISMATCH') {
          setAlertModal({
            isOpen: true,
            title: '⚠️ Wrong Account',
            message: `This invite was sent to ${errorData.inviteeEmail}. You are logged in as ${errorData.currentEmail}. Please switch accounts.`
          });
        } else {
          setAlertModal({
            isOpen: true,
            title: 'Error',
            message: errorData.message || 'Failed to accept invite'
          });
        }
      }
    } catch (e: any) {
      console.error('Failed to accept invite:', e);
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: e.message || 'Failed to accept invite'
      });
    } finally {
      setIsAcceptingInvite(null);
    }
  };

  const terminatePartnership = async (partnershipId: string, cleanup: boolean = true) => {
    const message = cleanup
      ? 'This will remove all shared products from the partner\'s account.'
      : 'Shared products will remain but sync will stop.';

    setConfirmDialog({
      isOpen: true,
      title: 'End Partnership',
      message,
      confirmLabel: 'End Partnership',
      destructive: true,
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          const token = await getToken();
          const res = await fetch(`${API_BASE}/api/cross-org/partnerships/${partnershipId}?cleanup=${cleanup}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });

          if (res.ok) {
            const result = await res.json();
            setPartnerships(prev => prev.filter(p => p.id !== partnershipId));
            if (result.cleanedUp) {
              setAlertModal({
                isOpen: true,
                title: 'Partnership Ended',
                message: `Partnership ended. Cleaned up ${result.cleanedUp.variants} products.`
              });
            }
          } else {
            const errText = await res.text();
            setAlertModal({ isOpen: true, title: 'Error', message: `Failed to end partnership: ${errText}` });
          }
        } catch (e) {
          console.error('Failed to end partnership:', e);
          setAlertModal({ isOpen: true, title: 'Error', message: 'Failed to end partnership' });
        }
      }
    });
  };

  const togglePartnershipPause = async (partnershipId: string, currentlyPaused: boolean) => {
    const action = currentlyPaused ? 'resume' : 'pause';
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/cross-org/partnerships/${partnershipId}/${action}?orgId=${orgId}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        // Update local state
        setPartnerships(prev => prev.map(p =>
          p.id === partnershipId ? { ...p, isPaused: !currentlyPaused } : p
        ));
      } else {
        const errText = await res.text();
        alert(`Failed to ${action} partnership: ${errText}`);
      }
    } catch (e) {
      console.error(`Failed to ${action} partnership:`, e);
      alert(`Failed to ${action} partnership`);
    }
  };

  // ========================================================================
  // LINKED PRODUCTS FUNCTIONS
  // ========================================================================

  const fetchLinkedProducts = async (partnershipId: string) => {
    if (linkedProducts[partnershipId]) {
      // Already loaded, just toggle expansion
      setExpandedPartnership(expandedPartnership === partnershipId ? null : partnershipId);
      return;
    }

    setLoadingLinkedProducts(partnershipId);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/cross-org/partnerships/${partnershipId}/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setLinkedProducts(prev => ({ ...prev, [partnershipId]: data }));
        setExpandedPartnership(partnershipId);
      } else {
        console.error('Failed to fetch linked products');
      }
    } catch (e) {
      console.error('Error fetching linked products:', e);
    } finally {
      setLoadingLinkedProducts(null);
    }
  };

  const toggleLinkSync = async (linkId: string, partnershipId: string, currentlyPaused: boolean) => {
    const action = currentlyPaused ? 'resume' : 'pause';
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/cross-org/links/${linkId}/${action}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        // Update local state
        setLinkedProducts(prev => ({
          ...prev,
          [partnershipId]: prev[partnershipId]?.map(p =>
            p.id === linkId ? { ...p, status: currentlyPaused ? 'active' : 'paused' } : p
          ) || []
        }));
      } else {
        alert('Failed to update link sync status');
      }
    } catch (e) {
      console.error('Error toggling link sync:', e);
    }
  };

  const toggleLinkVisibility = async (linkId: string, partnershipId: string, currentlyHidden: boolean) => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/cross-org/links/${linkId}/visibility`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ hidden: !currentlyHidden })
      });

      if (res.ok) {
        // Update local state
        setLinkedProducts(prev => ({
          ...prev,
          [partnershipId]: prev[partnershipId]?.map(p =>
            p.id === linkId ? {
              ...p,
              visibilityStatus: currentlyHidden ? 'available' : 'hidden'
            } : p
          ) || []
        }));
      } else {
        alert('Failed to update visibility');
      }
    } catch (e) {
      console.error('Error toggling visibility:', e);
    }
  };


  // Revoke/remove a product from a partnership (for consignment/revocable partnerships)
  const [revokingLinkId, setRevokingLinkId] = useState<string | null>(null);

  const revokeProductFromPartnership = async (linkId: string, partnershipId: string, productTitle: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Remove Product from Partner',
      message: `Remove "${productTitle}" from this partnership? The partner will no longer have access to this product.`,
      confirmLabel: 'Remove',
      destructive: true,
      onConfirm: async () => {
        setConfirmDialog(null);
        setRevokingLinkId(linkId);
        try {
          const token = await getToken();
          const res = await fetch(`${API_BASE}/api/cross-org/links/${linkId}/revoke`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });

          if (res.ok) {
            // Remove from local state
            setLinkedProducts(prev => ({
              ...prev,
              [partnershipId]: prev[partnershipId]?.filter(p => {
                // Remove the product if its id or any link's linkId matches
                const linkIds = p.links?.map(l => l.linkId) || [];
                return p.id !== linkId && !linkIds.includes(linkId);
              }) || []
            }));
          } else {
            const errText = await res.text();
            setAlertModal({ isOpen: true, title: 'Error', message: `Failed to remove product: ${errText}` });
          }
        } catch (e) {
          console.error('Error revoking product:', e);
          setAlertModal({ isOpen: true, title: 'Error', message: 'Failed to remove product' });
        } finally {
          setRevokingLinkId(null);
        }
      }
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy query: ', err);
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

  const createLocation = async () => {
    if (!newLocationName.trim() || !newLocationConnectionId) {
      alert('Please enter a location name and select a platform');
      return;
    }

    setIsCreatingLocation(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/locations/create`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionId: newLocationConnectionId,
          name: newLocationName.trim(),
          address: { countryCode: 'US' }, // Default to US - could add address form later
        }),
      });

      if (res.ok) {
        const data = await res.json();
        // Auto-select the newly created location
        if (data.location?.platformLocationId) {
          setSelectedLocations(prev => [...prev, data.location.platformLocationId]);
        }
        setShowCreateLocation(false);
        setNewLocationName('');
        setNewLocationConnectionId('');
        loadData(); // Refresh locations list
      } else {
        const errText = await res.text();
        alert(`Failed to create location: ${errText}`);
      }
    } catch (e) {
      console.error('Failed to create location:', e);
      alert('Failed to create location');
    } finally {
      setIsCreatingLocation(false);
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString();

  if (!isOrgLoaded || !isAuthLoaded) {
    return <div className="p-8 flex justify-center"><Loader2Icon className="animate-spin" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">

      {/* Rejected Invite Notifications - Ephemeral, dismissible */}
      {rejectedInvites.length > 0 && (
        <div className="space-y-2">
          {rejectedInvites.map((rejected) => (
            <div
              key={rejected.id}
              className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <AlertTriangleIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Invite Declined
                  </p>
                  <p className="text-sm text-amber-700">
                    <span className="font-medium">{rejected.email}</span> declined your invite to <span className="font-medium">{rejected.poolName}</span>.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRejectedInvites(prev => prev.filter(r => r.id !== rejected.id))}
                className="text-amber-500 hover:text-amber-700 p-1"
                aria-label="Dismiss"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-1">
        <Button
          variant={activeTab === 'partners' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('partners')}
          className={cn("gap-2 rounded-t-lg rounded-b-none border-b-2", activeTab === 'partners' ? "border-[#647653] bg-white text-[#647653] hover:bg-gray-50 hover:text-[#647653]" : "border-transparent text-gray-500")}
        >
          <Link2Icon className="w-4 h-4" />
          Partners
        </Button>
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

                      {/* Create Location Button - only show if we have capable connections */}
                      {connectionsWithCapabilities.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowCreateLocation(true)}
                          className="mt-2 w-full border-dashed border-gray-300 text-gray-600 hover:text-gray-900"
                        >
                          <PlusIcon className="w-4 h-4 mr-2" />
                          Create New Location
                        </Button>
                      )}
                    </div>

                    {/* Create Location Modal */}
                    {showCreateLocation && (
                      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
                          <h3 className="text-lg font-bold mb-4">Create New Location</h3>
                          <p className="text-sm text-gray-600 mb-4">
                            Create a new location on your connected platform. It will be automatically added to your available locations.
                          </p>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">Platform</label>
                              <select
                                value={newLocationConnectionId}
                                onChange={(e) => setNewLocationConnectionId(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg p-2 text-sm"
                              >
                                <option value="">Select a platform...</option>
                                {connectionsWithCapabilities.map((c) => (
                                  <option key={c.connectionId} value={c.connectionId}>
                                    {c.connectionName} ({c.platformType})
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium mb-1">Location Name</label>
                              <Input
                                value={newLocationName}
                                onChange={(e) => setNewLocationName(e.target.value)}
                                placeholder="e.g., Downtown Store, Warehouse A"
                              />
                            </div>
                          </div>

                          <div className="flex gap-2 mt-6">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setShowCreateLocation(false);
                                setNewLocationName('');
                                setNewLocationConnectionId('');
                              }}
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={createLocation}
                              disabled={isCreatingLocation || !newLocationName.trim() || !newLocationConnectionId}
                              className="flex-1 bg-[#647653] hover:bg-[#556145] text-white"
                            >
                              {isCreatingLocation ? (
                                <><Loader2Icon className="w-4 h-4 mr-2 animate-spin" /> Creating...</>
                              ) : (
                                <><PlusIcon className="w-4 h-4 mr-2" /> Create Location</>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

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
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Partnerships</h2>
                  <p className="text-gray-500 mt-1">
                    Manage your shared inventory network and invitations.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Invite Action */}
                <div className="lg:col-span-1 space-y-6">
                  <Card className="border border-gray-200 shadow-sm overflow-hidden sticky top-4 border-t-[#647653] border-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <SendIcon className="w-5 h-5 text-[#647653]" />
                        Invite Partner
                      </CardTitle>
                      <CardDescription>
                        Send a link to share your inventory pool.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1.5 text-gray-700">Partner Email</label>
                        <Input
                          type="email"
                          name="email"
                          autoComplete="email"
                          placeholder="partner@company.com"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          onBlur={() => setEmailTouched(true)}
                          className={cn(
                            "bg-gray-50 focus:bg-white transition-colors",
                            emailTouched && inviteEmail && !isValidEmail(inviteEmail) && "border-red-300 focus:border-red-500 focus:ring-red-500"
                          )}
                        />
                        {emailTouched && inviteEmail && !isValidEmail(inviteEmail) && (
                          <p className="text-xs text-red-500 mt-1">Please enter a valid email address</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5 text-gray-700">Share Pool</label>
                        <div className="relative">
                          <select
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-[#647653] focus:bg-white transition-all text-sm"
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
                          <ChevronRightIcon className="w-4 h-4 text-gray-400 absolute right-3 top-2.5 rotate-90 pointer-events-none" />
                        </div>
                      </div>

                      {/* Consignment Mode Toggle */}
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm text-gray-900">Revocable Access</span>
                          <Switch
                            checked={inviteCanRevoke}
                            onCheckedChange={setInviteCanRevoke}
                            className="data-[state=checked]:bg-[#647653]"
                          />
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          {inviteCanRevoke
                            ? 'You stay in control. Revoke access anytime to remove products from their system.'
                            : 'Permanent transfer. Once shared, they keep the product data forever.'}
                        </p>
                      </div>

                      <Button
                        onClick={sendPartnerInvite}
                        disabled={!inviteEmail || !isValidEmail(inviteEmail) || !invitePoolId || isInviting}
                        className="w-full bg-[#647653] hover:bg-[#556145] text-white transition-all shadow-sm hover:shadow"
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
                </div>

                {/* Right Column: Lists */}
                <div className="lg:col-span-2 space-y-8">

                  {/* Received Invites Swimlane - For partners to accept */}
                  {receivedInvites.length > 0 && (
                    <section>
                      <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Invitations to Accept
                      </h3>

                      <div className="space-y-3">
                        {receivedInvites.map((invite) => (
                          <div
                            key={invite.id}
                            className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl shadow-sm hover:border-emerald-300 hover:shadow-md transition-all duration-200"
                          >
                            <div className="flex items-start gap-4 mb-3 sm:mb-0">
                              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                <Link2Icon className="w-5 h-5 text-emerald-600" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{invite.sourceOrgName}</div>
                                <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5 flex-wrap">
                                  <Badge variant="outline" className="text-xs font-normal bg-white">
                                    {invite.sourcePoolName}
                                  </Badge>
                                  <span>•</span>
                                  <span>{invite.productCount} products{invite.variantCount > invite.productCount ? ` (${invite.variantCount} variants)` : ''}</span>
                                  <span>•</span>
                                  <Badge variant="outline" className="text-xs font-normal bg-amber-50 text-amber-700 border-amber-200">
                                    {invite.shareType === 'consignment' ? '📦 Consignment' : '🤝 Partnership'}
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 pl-14 sm:pl-0">
                              <Button
                                size="sm"
                                onClick={() => acceptReceivedInvite(invite)}
                                disabled={isAcceptingInvite === invite.id}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              >
                                {isAcceptingInvite === invite.id ? (
                                  <Loader2Icon className="w-4 h-4 animate-spin" />
                                ) : (
                                  <CheckIcon className="w-4 h-4" />
                                )}
                                <span className="ml-2">Accept</span>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Pending Invites Swimlane */}
                  <section>
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-400" />
                      Pending Invites
                    </h3>

                    {pendingInvites.length === 0 ? (
                      <div className="text-center py-6 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                        <p className="text-sm text-gray-500">No pending invites.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {pendingInvites.map((invite) => (
                          <div
                            key={invite.id}
                            className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-gray-300 hover:shadow-md transition-all duration-200"
                          >
                            <div className="flex items-start gap-4 mb-3 sm:mb-0">
                              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center flex-shrink-0">
                                <SendIcon className="w-5 h-5 text-amber-500" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{invite.email}</div>
                                <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                                  <Badge variant="outline" className="text-xs font-normal bg-gray-50">
                                    {invite.poolName}
                                  </Badge>
                                  <span>•</span>
                                  <span>Expires {formatDate(invite.expiresAt)}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 pl-14 sm:pl-0">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(invite.inviteLink)}
                                className="text-gray-600 hover:text-[#647653] hover:border-[#647653]"
                              >
                                {linkCopied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                                <span className="ml-2 sm:hidden">Copy Link</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => revokeInvite(invite.id)}
                                className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2Icon className="w-4 h-4" />
                                <span className="ml-2 sm:hidden">Revoke</span>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>

                  {/* Active Partnerships Swimlane */}
                  <section>
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#647653]" />
                      Active Partnerships
                    </h3>

                    {partnerships.length === 0 ? (
                      <div className="text-center py-12 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                        <Link2Icon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h4 className="text-gray-900 font-medium">No partners yet</h4>
                        <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1">
                          When partners accept your invite, they'll appear here. You'll be able to see their sync status and manage access.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {partnerships.map((partner) => (
                          <div
                            key={partner.id}
                            className="bg-white border border-gray-200 rounded-xl shadow-sm hover:border-[#647653]/30 hover:shadow-md transition-all duration-200 overflow-hidden"
                          >
                            {/* Card Header / Main Row */}
                            <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="relative shrink-0">
                                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#647653] to-[#45523e] flex items-center justify-center text-white text-lg font-bold shadow-sm">
                                    {partner.partnerOrgName?.[0] || partner.partnerEmail[0].toUpperCase()}
                                  </div>
                                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center border border-gray-100 shadow-sm">
                                    <div className={cn(
                                      "w-2.5 h-2.5 rounded-full",
                                      partner.isPaused ? "bg-amber-400" : "bg-[#A7CE38] animate-pulse"
                                    )} />
                                  </div>
                                </div>

                                <div className="flex flex-col min-w-0 flex-1">
                                  <div className="font-semibold text-gray-900 text-lg truncate pr-2" title={partner.partnerOrgName || partner.partnerEmail}>
                                    {partner.partnerOrgName || partner.partnerEmail}
                                  </div>
                                  <div className="flex flex-col items-start gap-y-1 text-sm text-gray-500 mt-0.5">
                                    <div className="flex items-center gap-1.5">
                                      <MapPinIcon className="w-3.5 h-3.5" />
                                      {partner.poolName}
                                    </div>
                                    {/*<div className="w-1 h-1 rounded-full bg-gray-300" />*/}
                                    <div className="flex items-center gap-1.5">
                                      <Link2Icon className="w-3.5 h-3.5" />
                                      {partner.productCount} products synced
                                    </div>
                                    {/*<div className="w-1 h-1 rounded-full bg-gray-300" />*/}
                                    <Badge variant="outline" className={cn(
                                      "text-xs font-normal border-0",
                                      partner.direction === 'sent'
                                        ? "bg-[#FFFDEF] text-[#EABB4A] ring-1 ring-inset ring-[#EABB4A]/10"
                                        : "bg-[#F1FFEF] text-[#91B91F] ring-1 ring-inset ring-[#91B91F]/10"
                                    )}>
                                      {partner.direction === 'sent' ? '↑ Sent' : '↓ Received'}
                                    </Badge>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 shrink-0 sm:ml-auto">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => fetchLinkedProducts(partner.id)}
                                  className={cn(
                                    "transition-colors",
                                    expandedPartnership === partner.id
                                      ? "bg-gray-100 text-gray-900 border-gray-300"
                                      : "text-gray-600 hover:text-[#647653] hover:border-[#647653]"
                                  )}
                                >
                                  {loadingLinkedProducts === partner.id ? (
                                    <Loader2Icon className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <>
                                      {expandedPartnership === partner.id ? 'Hide Items' : 'View Items'}
                                      <ChevronRightIcon className={cn(
                                        "w-4 h-4 ml-2 transition-transform duration-200",
                                        expandedPartnership === partner.id ? "rotate-90" : ""
                                      )} />
                                    </>
                                  )}
                                </Button>

                                <div className="h-4 w-px bg-gray-200 mx-1" />

                                <div className="flex items-center gap-2" title={partner.isPaused ? "Resume Partnership" : "Pause Partnership"}>
                                  <Switch
                                    checked={!partner.isPaused}
                                    onCheckedChange={() => togglePartnershipPause(partner.id, !!partner.isPaused)}
                                    className="data-[state=checked]:bg-[#647653]"
                                  />
                                </div>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                                  onClick={() => terminatePartnership(
                                    partner.id,
                                    partner.shareType === 'consignment' || partner.direction === 'sent'
                                  )}
                                  title={partner.direction === 'sent' ? 'End Partnership' : 'Leave Partnership'}
                                >
                                  <Trash2Icon className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Expandable Linked Products Section */}
                            {expandedPartnership === partner.id && linkedProducts[partner.id] && (
                              <div className="border-t border-gray-100 bg-gray-50/50 p-4 animate-in slide-in-from-top-2 duration-200">
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-semibold text-gray-900">
                                      Linked Products
                                    </h4>
                                    <Badge variant="secondary" className="text-xs bg-gray-200/50 text-gray-600 font-normal">
                                      {linkedProducts[partner.id].length}
                                    </Badge>
                                  </div>

                                  {/* Future: Add Search Bar Here */}
                                  {/* <div className="relative">
                                    <SearchIcon className="w-3.5 h-3.5 absolute left-2.5 top-2 text-gray-400" />
                                    <input 
                                      type="text" 
                                      placeholder="Filter products..." 
                                      className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#647653]"
                                    />
                                  </div> */}
                                </div>

                                {linkedProducts[partner.id].length === 0 ? (
                                  <div className="text-center py-8 text-gray-500 bg-white border border-gray-200 border-dashed rounded-lg">
                                    <p className="text-sm">No products explicitly linked yet.</p>
                                    <p className="text-xs mt-1">Add items to your pool to auto-share them.</p>
                                  </div>
                                ) : (
                                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                                    <table className="w-full text-sm text-left">
                                      <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                                        <tr>
                                          <th className="px-4 py-3 w-1/2">Product</th>
                                          <th className="px-4 py-3 text-center">Stock</th>
                                          <th className="px-4 py-3 text-center">Sync Status</th>
                                          <th className="px-4 py-3 text-center">Visibility</th>
                                          {partner.direction === 'sent' && partner.shareType === 'consignment' && (
                                            <th className="px-4 py-3 text-center w-16"></th>
                                          )}
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-100">
                                        {linkedProducts[partner.id].map((product) => (
                                          <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-3">
                                              <div className="font-medium text-gray-900">
                                                {product.title || product.sourceVariantTitle}
                                                {(product.variantCount || 0) > 1 && (
                                                  <span className="ml-2 text-xs font-normal text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                                    {product.variantCount} variants
                                                  </span>
                                                )}
                                              </div>
                                              <div className="text-xs text-gray-500 font-mono mt-0.5">
                                                {product.baseSku || product.sourceVariantSku || 'NO SKU'}
                                              </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                              <span className={cn(
                                                "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                                                (product.totalStock || product.sharedQuantity || 0) > 0
                                                  ? "bg-green-50 text-green-700"
                                                  : "bg-gray-100 text-gray-500"
                                              )}>
                                                {product.totalStock ?? product.sharedQuantity ?? 0}
                                              </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                              <div className="flex justify-center">
                                                <div
                                                  className="flex items-center gap-2 cursor-pointer group"
                                                  onClick={() => {
                                                    const linkId = product.links?.[0]?.linkId || product.id;
                                                    toggleLinkSync(linkId, partner.id, product.status !== 'active');
                                                  }}
                                                >
                                                  <div className={cn(
                                                    "w-1.5 h-1.5 rounded-full",
                                                    product.status === 'active' ? "bg-green-500" : "bg-amber-400"
                                                  )} />
                                                  <span className={cn(
                                                    "text-xs group-hover:underline decoration-dashed decoration-gray-300",
                                                    product.status === 'active' ? "text-gray-600" : "text-amber-600 font-medium"
                                                  )}>
                                                    {product.status === 'active' ? 'Active' : 'Paused'}
                                                  </span>
                                                </div>
                                              </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className={cn(
                                                  "h-7 px-2",
                                                  product.visibilityStatus === 'hidden'
                                                    ? "text-gray-400 hover:text-gray-600 bg-gray-50"
                                                    : "text-[#647653] hover:text-[#556145] hover:bg-[#647653]/5"
                                                )}
                                                onClick={() => {
                                                  const linkId = product.links?.[0]?.linkId || product.id;
                                                  toggleLinkVisibility(
                                                    linkId,
                                                    partner.id,
                                                    product.visibilityStatus === 'hidden'
                                                  );
                                                }}
                                                title={product.visibilityStatus === 'hidden' ? "Hidden from partner" : "Visible to partner"}
                                              >
                                                {product.visibilityStatus === 'hidden' ? (
                                                  <>
                                                    <EyeOffIcon className="w-3.5 h-3.5 mr-1.5" />
                                                    <span className="text-xs">Hidden</span>
                                                  </>
                                                ) : (
                                                  <>
                                                    <EyeIcon className="w-3.5 h-3.5 mr-1.5" />
                                                    <span className="text-xs">Visible</span>
                                                  </>
                                                )}
                                              </Button>
                                            </td>
                                            {partner.direction === 'sent' && partner.shareType === 'consignment' && (
                                              <td className="px-4 py-3 text-center">
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="h-7 px-2 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                                  onClick={() => {
                                                    const linkId = product.links?.[0]?.linkId || product.id;
                                                    revokeProductFromPartnership(
                                                      linkId,
                                                      partner.id,
                                                      product.title || product.sourceVariantTitle || 'this product'
                                                    );
                                                  }}
                                                  disabled={revokingLinkId === (product.links?.[0]?.linkId || product.id)}
                                                  title="Remove from partnership"
                                                >
                                                  {revokingLinkId === (product.links?.[0]?.linkId || product.id) ? (
                                                    <Loader2Icon className="w-3.5 h-3.5 animate-spin" />
                                                  ) : (
                                                    <Trash2Icon className="w-3.5 h-3.5" />
                                                  )}
                                                </Button>
                                              </td>
                                            )}
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Invite Success Modal */}
      {showInviteSuccess && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all scale-100">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[#F1FFEF] rounded-full flex items-center justify-center mx-auto mb-4">
                <SendIcon className="w-8 h-8 text-[#91B91F] ml-1" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Invite Sent!</h2>
              <p className="text-gray-600 mt-2">
                We've emailed your partner. You can also copy the link below and send it manually.
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 flex items-center justify-between gap-3">
              <code className="text-sm text-gray-600 break-all w-full h-full flex-1 min-w-0 font-mono bg-white px-2 py-1 rounded border border-gray-100">
                {createdInviteLink}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(createdInviteLink)}
                className="shrink-0 hover:border-[#647653] hover:text-[#647653]"
              >
                {linkCopied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
              </Button>
            </div>

            <Button
              className="w-full bg-[#647653] hover:bg-[#556145] text-white py-6 text-lg rounded-xl"
              onClick={() => setShowInviteSuccess(false)}
            >
              Done
            </Button>
          </div>
        </div>
      )}

      {/* Create Location Modal */}
      {showCreateLocation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 transform transition-all">
            <h3 className="text-xl font-bold mb-4">Create New Location</h3>
            <p className="text-gray-600 mb-6 text-sm">
              Create a location in the selected platform to sync your inventory.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700">Location Name</label>
                <Input
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  placeholder="e.g. Warehouse 1"
                  className="w-full"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowCreateLocation(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-[#647653] hover:bg-[#556145] text-white"
                  onClick={createLocation}
                  disabled={!newLocationName || isCreatingLocation}
                >
                  {isCreatingLocation ? <Loader2Icon className="w-4 h-4 animate-spin" /> : 'Create'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog Modal */}
      {confirmDialog?.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0",
                confirmDialog.destructive ? "bg-red-50" : "bg-amber-50"
              )}>
                <AlertTriangleIcon className={cn(
                  "w-6 h-6",
                  confirmDialog.destructive ? "text-red-500" : "text-amber-500"
                )} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{confirmDialog.title}</h3>
                <p className="text-gray-600 mt-1 text-sm">{confirmDialog.message}</p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setConfirmDialog(null)}
              >
                Cancel
              </Button>
              <Button
                className={cn(
                  "flex-1",
                  confirmDialog.destructive
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-[#647653] hover:bg-[#556145] text-white"
                )}
                onClick={confirmDialog.onConfirm}
              >
                {confirmDialog.confirmLabel || 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      {alertModal?.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckIcon className="w-8 h-8 text-[#647653]" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">{alertModal.title}</h3>
            <p className="text-gray-600 mt-2">{alertModal.message}</p>
            <Button
              className="w-full mt-6 bg-[#647653] hover:bg-[#556145] text-white"
              onClick={() => setAlertModal(null)}
            >
              OK
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}






