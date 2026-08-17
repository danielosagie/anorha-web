'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { ReactNode } from 'react';
import {
  InviteAccept,
  InviteChoose,
  InviteInvalid,
  InviteJoined,
  InviteLoading,
  InviteNotFound,
  InviteReview,
} from '../../invite/invite-states';

/**
 * Dev-only. One /invite/[token] state at a time, with no session and no ticket.
 *
 * One at a time on purpose: the unauthenticated layout is `h-dvh`, so a stacked
 * gallery scrolls the split panel out of frame and stops being a receipt for
 * what the state actually looks like.
 */

const noop = () => {
  // Preview only. The real handlers live in invite-client.tsx.
};

const STATES: Record<string, () => ReactNode> = {
  loading: () => <InviteLoading label="Checking your invite" />,
  review: () => <InviteReview onContinue={noop} onDismiss={noop} />,
  accept: () => (
    <InviteAccept
      email="maya@oakandthread.com"
      error={null}
      isAccepting={false}
      onAccept={noop}
      onDismiss={noop}
      organizationName="Oak and Thread"
      roleLabel="Member"
    />
  ),
  'accept-error': () => (
    <InviteAccept
      email="maya@oakandthread.com"
      error="That invite could not be accepted. Ask for a new link."
      isAccepting={false}
      onAccept={noop}
      onDismiss={noop}
      organizationName="Oak and Thread"
      roleLabel="Admin"
    />
  ),
  choose: () => (
    <InviteChoose
      acceptingId={null}
      error={null}
      invites={[
        {
          id: 'orginv_1',
          organizationName: 'Oak and Thread',
          roleLabel: 'Member',
        },
        {
          id: 'orginv_2',
          organizationName: "Jacob's Archive",
          roleLabel: 'Admin',
        },
      ]}
      onAccept={noop}
    />
  ),
  joined: () => (
    <InviteJoined
      isOpening={false}
      onOpen={noop}
      organizationName="Oak and Thread"
    />
  ),
  'not-found': () => (
    <InviteNotFound onCreateWorkspace={noop} onSwitchAccount={noop} />
  ),
  invalid: () => <InviteInvalid />,
};

export function InvitePreview() {
  const state = useSearchParams().get('state');
  const render = state ? STATES[state] : undefined;

  if (render) {
    return <>{render()}</>;
  }

  return (
    <nav className="w-full space-y-2 py-8">
      <p className="font-mono text-muted-foreground text-xs uppercase tracking-wider">
        invite states
      </p>
      {Object.keys(STATES).map((name) => (
        <Link
          className="block rounded-[0.875rem] border border-border bg-card px-4 py-3 font-medium text-sm hover:border-ring"
          href={`/dev/invite?state=${name}`}
          key={name}
        >
          {name}
        </Link>
      ))}
    </nav>
  );
}
