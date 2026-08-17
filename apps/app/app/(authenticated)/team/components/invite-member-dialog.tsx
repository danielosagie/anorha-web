'use client';

import { Button } from '@repo/design-system/components/ui/button';
import { Checkbox } from '@repo/design-system/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/design-system/components/ui/dialog';
import { Input } from '@repo/design-system/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/design-system/components/ui/select';
import { Loader2, Mail } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

export type InvitePool = { id: string; name: string };
export type InviteRole = 'org:member' | 'org:admin';

export type InviteMemberDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationName: string;
  /** Pools this org owns, for the member pool assignment. */
  loadPools: () => Promise<InvitePool[]>;
  /** Sends the invite. Rejects with the backend's own message on failure. */
  sendInvite: (input: {
    email: string;
    role: InviteRole;
    assignedPoolIds: string[];
  }) => Promise<void>;
  onInvited: (email: string) => void;
};

type PoolPickerProps = {
  pools: InvitePool[];
  isLoading: boolean;
  loadError: string | null;
  selectedPoolIds: string[];
  onToggle: (poolId: string) => void;
  onRetry: () => void;
};

function PoolPicker({
  pools,
  isLoading,
  loadError,
  selectedPoolIds,
  onToggle,
  onRetry,
}: PoolPickerProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-2 text-muted-foreground text-sm">
        <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        Loading pools
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-md border border-destructive/40 px-3 py-2 text-destructive text-sm">
        <span>{loadError}</span>
        <Button onClick={onRetry} size="sm" variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  if (pools.length === 0) {
    return (
      <p className="rounded-md border border-dashed px-3 py-2 text-muted-foreground text-sm">
        No pools yet. Create one under Pools &amp; Partners.
      </p>
    );
  }

  return (
    <fieldset
      aria-labelledby="team-invite-pools-label"
      className="max-h-44 space-y-1 overflow-y-auto rounded-md border p-1"
    >
      {pools.map((pool) => (
        <label
          className="flex cursor-pointer items-center gap-3 rounded-sm px-2 py-2 text-sm hover:bg-accent"
          htmlFor={`team-invite-pool-${pool.id}`}
          key={pool.id}
        >
          <Checkbox
            checked={selectedPoolIds.includes(pool.id)}
            id={`team-invite-pool-${pool.id}`}
            onCheckedChange={() => onToggle(pool.id)}
          />
          <span className="truncate">{pool.name}</span>
        </label>
      ))}
    </fieldset>
  );
}

/**
 * Invite dialog for the Team screen.
 *
 * Transport lives with the caller so this component stays previewable: it owns
 * the question being asked, not who answers it.
 */
export function InviteMemberDialog({
  open,
  onOpenChange,
  organizationName,
  loadPools,
  sendInvite,
  onInvited,
}: InviteMemberDialogProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<InviteRole>('org:member');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pools, setPools] = useState<InvitePool[]>([]);
  const [isLoadingPools, setIsLoadingPools] = useState(false);
  const [poolLoadError, setPoolLoadError] = useState<string | null>(null);
  const [selectedPoolIds, setSelectedPoolIds] = useState<string[]>([]);

  // Admins see every pool, so the assignment is a member-only question.
  const isMemberInvite = role === 'org:member';

  const refreshPools = useCallback(async () => {
    setIsLoadingPools(true);
    setPoolLoadError(null);
    try {
      const loaded = await loadPools();
      setPools(loaded);
      // One pool is not a choice, and the only other state the backend accepts
      // is invalid. Two or more is a real access decision, so it stays explicit.
      setSelectedPoolIds(loaded.length === 1 ? [loaded[0].id] : []);
    } catch (cause) {
      setPoolLoadError(
        cause instanceof Error ? cause.message : 'Failed to load pools'
      );
      setPools([]);
      setSelectedPoolIds([]);
    } finally {
      setIsLoadingPools(false);
    }
  }, [loadPools]);

  useEffect(() => {
    if (open) {
      refreshPools();
    }
  }, [open, refreshPools]);

  const togglePool = (poolId: string) => {
    setError(null);
    setSelectedPoolIds((current) =>
      current.includes(poolId)
        ? current.filter((id) => id !== poolId)
        : [...current, poolId]
    );
  };

  const handleSend = async () => {
    if (!email) {
      return;
    }
    if (isMemberInvite && selectedPoolIds.length === 0) {
      setError('Select at least one pool');
      return;
    }

    setIsSending(true);
    setError(null);
    try {
      await sendInvite({
        email,
        role,
        assignedPoolIds: isMemberInvite ? selectedPoolIds : [],
      });
      onInvited(email);
      setEmail('');
      onOpenChange(false);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Failed to send invitation'
      );
    } finally {
      setIsSending(false);
    }
  };

  const hasNoPools = !(isLoadingPools || poolLoadError) && pools.length === 0;
  // A member invite needs a pool, so anything that leaves the list unusable
  // blocks the send rather than letting it fail with a misleading message.
  const cannotPickPool = isLoadingPools || hasNoPools || poolLoadError !== null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setError(null);
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Send an email invitation to join <strong>{organizationName}</strong>
            .
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label
              className="font-medium text-sm leading-none"
              htmlFor="team-invite-email"
            >
              Email Address
            </label>
            <Input
              id="team-invite-email"
              onChange={(e) => {
                setEmail(e.target.value);
                setError(null);
              }}
              placeholder="colleague@company.com"
              type="email"
              value={email}
            />
          </div>

          <div className="space-y-2">
            <label
              className="font-medium text-sm leading-none"
              htmlFor="team-invite-role"
            >
              Role
            </label>
            <Select
              onValueChange={(next: InviteRole) => {
                setRole(next);
                setError(null);
              }}
              value={role}
            >
              <SelectTrigger id="team-invite-role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="org:member">
                  <div className="flex flex-col items-start py-1">
                    <span className="font-medium">Member</span>
                    <span className="text-muted-foreground text-xs">
                      Can view and edit but cannot manage organization settings.
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="org:admin">
                  <div className="flex flex-col items-start py-1">
                    <span className="font-medium">Admin</span>
                    <span className="text-muted-foreground text-xs">
                      Full access to everything including member management.
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isMemberInvite ? (
            <div className="space-y-2">
              <span
                className="block font-medium text-sm leading-none"
                id="team-invite-pools-label"
              >
                Pools
              </span>
              <PoolPicker
                isLoading={isLoadingPools}
                loadError={poolLoadError}
                onRetry={refreshPools}
                onToggle={togglePool}
                pools={pools}
                selectedPoolIds={selectedPoolIds}
              />
            </div>
          ) : null}

          {error ? (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            Cancel
          </Button>
          <Button
            disabled={!email || isSending || (isMemberInvite && cannotPickPool)}
            onClick={handleSend}
          >
            {isSending ? (
              <Loader2 className="animate-spin" data-icon="inline-start" />
            ) : (
              <Mail data-icon="inline-start" />
            )}
            Send Invitation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
