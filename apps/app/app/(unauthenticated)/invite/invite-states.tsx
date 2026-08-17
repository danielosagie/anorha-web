'use client';

import { Button } from '@repo/design-system/components/ui/button';
import { Spinner } from '@repo/design-system/components/ui/spinner';
import { CheckCircle2, Mail, UserPlus, XCircle } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * Every visual state of /invite/[token], as pure props.
 *
 * Kept free of Clerk hooks so the dev harness can render all of them at once
 * without a session, a ticket, or a network call.
 */

function Shell({ children }: { readonly children: ReactNode }) {
  return (
    <div className="slide-in-from-bottom-4 fade-in flex animate-in flex-col space-y-6 py-8 duration-500">
      {children}
    </div>
  );
}

function Crest({ children }: { readonly children: ReactNode }) {
  return (
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
      {children}
    </div>
  );
}

function Heading({
  title,
  body,
}: {
  readonly title: string;
  readonly body?: string;
}) {
  return (
    <div className="flex flex-col space-y-2 text-center">
      <h1 className="font-bold text-2xl text-foreground tracking-tight md:text-3xl">
        {title}
      </h1>
      {body ? (
        <p className="mx-auto max-w-[34ch] text-muted-foreground text-sm md:text-base">
          {body}
        </p>
      ) : null}
    </div>
  );
}

/** Label/value rows. The invite's facts, without a paragraph around them. */
function Facts({
  rows,
}: {
  readonly rows: readonly { label: string; value: string }[];
}) {
  return (
    <dl className="space-y-3 rounded-[1.125rem] border border-border bg-card p-4">
      {rows.map((row) => (
        <div
          className="flex items-center justify-between gap-4"
          key={row.label}
        >
          <dt className="text-muted-foreground text-sm">{row.label}</dt>
          <dd className="min-w-0 truncate font-semibold text-foreground text-sm">
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function InviteLoading({ label }: { readonly label: string }) {
  return (
    <div className="fade-in flex min-h-[400px] animate-in flex-col items-center justify-center space-y-4 duration-500">
      <Spinner className="size-8 text-primary" />
      <p className="font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

/** Signed out. The org name is Clerk's to reveal, after the ticket is exchanged. */
export function InviteReview({
  onContinue,
  onDismiss,
}: {
  readonly onContinue: () => void;
  readonly onDismiss: () => void;
}) {
  return (
    <Shell>
      <Crest>
        <UserPlus className="size-7" aria-hidden />
      </Crest>
      <Heading
        body="Sign in or create an account to join."
        title="You have an invite"
      />
      <div className="space-y-3">
        <Button className="h-12 w-full text-md" onClick={onContinue}>
          Continue
        </Button>
        <Button className="h-12 w-full" onClick={onDismiss} variant="ghost">
          Not now
        </Button>
      </div>
    </Shell>
  );
}

/** Signed in, invitation still pending. Everything shown here is from Clerk. */
export function InviteAccept({
  organizationName,
  email,
  roleLabel,
  isAccepting,
  error,
  onAccept,
  onDismiss,
}: {
  readonly organizationName: string;
  readonly email: string;
  readonly roleLabel: string;
  readonly isAccepting: boolean;
  readonly error: string | null;
  readonly onAccept: () => void;
  readonly onDismiss: () => void;
}) {
  return (
    <Shell>
      <Crest>
        <Mail className="size-7" aria-hidden />
      </Crest>
      <Heading title={`Join ${organizationName}`} />
      <Facts
        rows={[
          { label: 'Invited', value: email },
          { label: 'Role', value: roleLabel },
        ]}
      />
      {error ? (
        <p className="rounded-[0.875rem] border border-destructive/30 bg-destructive/10 px-4 py-3 text-center text-destructive text-sm">
          {error}
        </p>
      ) : null}
      <div className="space-y-3">
        <Button
          className="h-12 w-full text-md"
          disabled={isAccepting}
          onClick={onAccept}
        >
          {isAccepting ? (
            <Spinner className="size-4" data-icon="inline-start" />
          ) : null}
          {isAccepting ? 'Joining' : 'Accept and open workspace'}
        </Button>
        <Button
          className="h-12 w-full"
          disabled={isAccepting}
          onClick={onDismiss}
          variant="ghost"
        >
          Not now
        </Button>
      </div>
    </Shell>
  );
}

/**
 * Signed in with more than one invitation pending.
 *
 * Clerk's ticket names no organization the client can read, so with two
 * invitations open there is no way to tell which link was clicked. Picking the
 * first would silently join the wrong workspace, so the user picks.
 */
export function InviteChoose({
  invites,
  acceptingId,
  error,
  onAccept,
}: {
  readonly invites: readonly {
    id: string;
    organizationName: string;
    roleLabel: string;
  }[];
  readonly acceptingId: string | null;
  readonly error: string | null;
  readonly onAccept: (inviteId: string) => void;
}) {
  return (
    <Shell>
      <Crest>
        <Mail className="size-7" aria-hidden />
      </Crest>
      <Heading body="Pick the one you want to open." title="You have invites" />
      {error ? (
        <p className="rounded-[0.875rem] border border-destructive/30 bg-destructive/10 px-4 py-3 text-center text-destructive text-sm">
          {error}
        </p>
      ) : null}
      <ul className="space-y-3">
        {invites.map((invite) => (
          <li
            className="flex items-center justify-between gap-3 rounded-[1.125rem] border border-border bg-card p-3 pl-4"
            key={invite.id}
          >
            <div className="min-w-0">
              <p className="truncate font-semibold text-foreground text-sm">
                {invite.organizationName}
              </p>
              <p className="text-muted-foreground text-xs">
                {invite.roleLabel}
              </p>
            </div>
            <Button
              disabled={acceptingId !== null}
              onClick={() => onAccept(invite.id)}
              size="sm"
            >
              {acceptingId === invite.id ? (
                <Spinner className="size-4" data-icon="inline-start" />
              ) : null}
              Accept
            </Button>
          </li>
        ))}
      </ul>
    </Shell>
  );
}

/**
 * Signed in with a membership and nothing pending.
 *
 * Covers both "just redeemed the ticket through Clerk" and "opened the link
 * twice", because from here they are the same fact: the user is in.
 */
export function InviteJoined({
  organizationName,
  isOpening,
  onOpen,
}: {
  readonly organizationName: string | null;
  readonly isOpening: boolean;
  readonly onOpen: () => void;
}) {
  return (
    <Shell>
      <Crest>
        <CheckCircle2 className="size-7" aria-hidden />
      </Crest>
      <Heading
        body={organizationName ? `You joined ${organizationName}.` : undefined}
        title="You're in"
      />
      <Button
        className="h-12 w-full text-md"
        disabled={isOpening}
        onClick={onOpen}
      >
        {isOpening ? (
          <Spinner className="size-4" data-icon="inline-start" />
        ) : null}
        Open workspace
      </Button>
    </Shell>
  );
}

/** Signed in, no invitation and no membership. Usually the wrong account. */
export function InviteNotFound({
  onSwitchAccount,
  onCreateWorkspace,
}: {
  readonly onSwitchAccount: () => void;
  readonly onCreateWorkspace: () => void;
}) {
  return (
    <Shell>
      <Crest>
        <XCircle className="size-7" aria-hidden />
      </Crest>
      <Heading
        body="It may have been sent to another address."
        title="No invite for this account"
      />
      <div className="space-y-3">
        <Button className="h-12 w-full text-md" onClick={onSwitchAccount}>
          Use another account
        </Button>
        <Button
          className="h-12 w-full"
          onClick={onCreateWorkspace}
          variant="outline"
        >
          Create a workspace
        </Button>
      </div>
    </Shell>
  );
}

/**
 * The token was not a shape any invite system in this app mints.
 *
 * Takes no handlers so the server page can render it without a client boundary.
 */
export function InviteInvalid() {
  return (
    <Shell>
      <Crest>
        <XCircle className="size-7" aria-hidden />
      </Crest>
      <Heading
        body="Ask for a new invite link."
        title="This link is not valid"
      />
      <Link className="block w-full" href="/">
        <Button className="h-12 w-full" variant="outline">
          Go home
        </Button>
      </Link>
    </Shell>
  );
}
