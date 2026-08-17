'use client';

import { inviteRoleLabel } from '@/lib/invite-token';
import { SignUp, useClerk, useOrganizationList, useUser } from '@clerk/nextjs';
import { Button } from '@repo/design-system/components/ui/button';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import {
  InviteAccept,
  InviteChoose,
  InviteJoined,
  InviteLoading,
  InviteNotFound,
  InviteReview,
} from '../invite-states';

/**
 * Redemption for a Clerk organization invitation.
 *
 * The route owns the landing and the destination; Clerk owns the credential
 * exchange. Signed out, the ticket goes to Clerk's own sign-up (the embedded
 * idiom from /partner/accept/[token]) because the ticket is the only thing that
 * can mint the membership. Signed in, the invitation is already listed against
 * the account, so it is accepted directly and the workspace is switched.
 */

type Phase = 'review' | 'auth';

export function InviteClient({
  ticket,
  returnUrl,
}: {
  readonly ticket: string;
  readonly returnUrl: string;
}) {
  const router = useRouter();
  const { signOut } = useClerk();
  const { isLoaded: userLoaded, isSignedIn } = useUser();
  const orgList = useOrganizationList({
    userInvitations: { infinite: true },
    userMemberships: { infinite: true },
  });

  const [phase, setPhase] = useState<Phase>('review');
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [isOpening, setIsOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const invitations = orgList.isLoaded ? orgList.userInvitations.data : null;
  const memberships = orgList.isLoaded ? orgList.userMemberships.data : null;

  const pending = useMemo(
    () => (invitations ?? []).filter((i) => i.status === 'pending'),
    [invitations]
  );

  const setActive = orgList.isLoaded ? orgList.setActive : null;

  /**
   * Land in the workspace, not on a page that has an account but no active
   * organization. The authenticated shell only redirects to /onboarding when
   * there are no memberships at all, so an unset active organization is not a
   * redirect, it is an empty app.
   */
  const openWorkspace = useCallback(
    async (organizationId: string | null) => {
      if (setActive && organizationId) {
        await setActive({ organization: organizationId });
      }
      router.replace('/');
    },
    [router, setActive]
  );

  const acceptInvite = useCallback(
    async (inviteId: string) => {
      const invite = pending.find((i) => i.id === inviteId);
      if (!invite) {
        return;
      }
      setAcceptingId(inviteId);
      setError(null);
      try {
        await invite.accept();
        await openWorkspace(invite.publicOrganizationData.id);
      } catch {
        setError('That invite could not be accepted. Ask for a new link.');
        setAcceptingId(null);
      }
    },
    [openWorkspace, pending]
  );

  if (!(userLoaded && orgList.isLoaded)) {
    return <InviteLoading label="Checking your invite" />;
  }

  if (!isSignedIn) {
    if (phase === 'auth') {
      return (
        <div className="fade-in flex animate-in flex-col items-center space-y-4 pt-4">
          <SignUp
            appearance={{
              elements: {
                rootBox: 'w-full mx-auto',
                card: 'shadow-none border-0 w-full bg-transparent p-0',
              },
            }}
            fallbackRedirectUrl={returnUrl}
            forceRedirectUrl={returnUrl}
            routing="virtual"
            signInUrl={`/sign-in?redirect_url=${encodeURIComponent(returnUrl)}`}
          />
          <Button onClick={() => setPhase('review')} size="sm" variant="ghost">
            Back
          </Button>
        </div>
      );
    }

    return (
      <InviteReview
        onContinue={() => setPhase('auth')}
        onDismiss={() => router.push('/')}
      />
    );
  }

  if (pending.length > 1) {
    return (
      <InviteChoose
        acceptingId={acceptingId}
        error={error}
        invites={pending.map((invite) => ({
          id: invite.id,
          organizationName: invite.publicOrganizationData.name,
          roleLabel: inviteRoleLabel(invite.role),
        }))}
        onAccept={acceptInvite}
      />
    );
  }

  const invite = pending[0];
  if (invite) {
    return (
      <InviteAccept
        email={invite.emailAddress}
        error={error}
        isAccepting={acceptingId !== null}
        onAccept={() => acceptInvite(invite.id)}
        onDismiss={() => router.push('/')}
        organizationName={invite.publicOrganizationData.name}
        roleLabel={inviteRoleLabel(invite.role)}
      />
    );
  }

  // Nothing pending. A membership means the ticket already did its work, either
  // through Clerk's sign-up a moment ago or on an earlier visit to this link.
  const membership = memberships?.[0];
  if (membership) {
    return (
      <InviteJoined
        isOpening={isOpening}
        onOpen={() => {
          setIsOpening(true);
          openWorkspace(membership.organization.id).catch(() =>
            setIsOpening(false)
          );
        }}
        organizationName={membership.organization.name}
      />
    );
  }

  return (
    <InviteNotFound
      onCreateWorkspace={() => router.push('/onboarding')}
      onSwitchAccount={() =>
        signOut({ redirectUrl: `/invite/${encodeURIComponent(ticket)}` })
      }
    />
  );
}
