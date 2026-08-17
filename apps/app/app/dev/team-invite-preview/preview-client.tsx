'use client';

import { Button } from '@repo/design-system/components/ui/button';
import { useState } from 'react';
import {
  InviteMemberDialog,
  type InvitePool,
} from '../../(authenticated)/team/components/invite-member-dialog';

const POOLS: InvitePool[] = [
  { id: 'pool-warehouse', name: 'Warehouse' },
  { id: 'pool-storefront', name: 'Storefront' },
  { id: 'pool-consignment', name: 'Consignment' },
];

export type PreviewCase = 'pools' | 'single' | 'empty' | 'error' | 'reject';

const CASES: Record<
  PreviewCase,
  { label: string; loadPools: () => Promise<InvitePool[]> }
> = {
  pools: { label: 'Several pools', loadPools: () => Promise.resolve(POOLS) },
  single: {
    label: 'One pool',
    loadPools: () => Promise.resolve([POOLS[0]]),
  },
  empty: { label: 'No pools', loadPools: () => Promise.resolve([]) },
  error: {
    label: 'Pools unreachable',
    loadPools: () => Promise.reject(new Error('Failed to load pools (503)')),
  },
  reject: {
    label: 'Backend rejects',
    loadPools: () => Promise.resolve(POOLS),
  },
};

export function TeamInvitePreview() {
  const [active, setActive] = useState<PreviewCase>('pools');
  const [open, setOpen] = useState(true);

  return (
    <div className="flex min-h-screen flex-col gap-4 bg-background p-8">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(CASES) as PreviewCase[]).map((key) => (
          <Button
            key={key}
            onClick={() => {
              setActive(key);
              setOpen(true);
            }}
            variant={key === active ? 'default' : 'outline'}
          >
            {CASES[key].label}
          </Button>
        ))}
      </div>

      <InviteMemberDialog
        key={active}
        loadPools={CASES[active].loadPools}
        onInvited={() => {
          // no-op in preview
        }}
        onOpenChange={setOpen}
        open={open}
        organizationName="Preview Org"
        sendInvite={() =>
          active === 'reject'
            ? Promise.reject(
                new Error(
                  'someone@example.com is already a member of this organization'
                )
              )
            : Promise.resolve()
        }
      />
    </div>
  );
}
