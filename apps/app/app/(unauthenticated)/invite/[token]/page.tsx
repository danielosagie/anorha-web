import { classifyInviteToken, resolveClerkTicket } from '@/lib/invite-token';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { InviteInvalid } from '../invite-states';
import { InviteClient } from './invite-client';

export const metadata: Metadata = {
  title: 'Invite',
  robots: { index: false, follow: false },
};

/**
 * The one stable landing for an invite link.
 *
 * It routes on the shape of the token rather than trusting where the link came
 * from, because two systems mint invites and their emails are not ours to edit:
 * Clerk sends a JWT ticket for organization invitations, and sssync-bknd sends
 * a UUID for cross-org partner invites. A partner UUID arriving here is someone
 * pasting the wrong link, so it goes to the route that can actually redeem it
 * instead of dead-ending.
 */
export default async function InvitePage(props: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ __clerk_ticket?: string }>;
}) {
  const { token } = await props.params;
  const searchParams = await props.searchParams;

  if (classifyInviteToken(token) === 'partner-uuid') {
    redirect(`/partner/accept/${token}`);
  }

  const ticket = resolveClerkTicket(token, searchParams.__clerk_ticket);
  if (!ticket) {
    return <InviteInvalid />;
  }

  // Clerk's sign-up reads the ticket from the query string, so put it there once
  // at the door rather than having the client rewrite the URL mid-flow.
  if (!searchParams.__clerk_ticket) {
    redirect(
      `/invite/${encodeURIComponent(token)}?__clerk_ticket=${encodeURIComponent(ticket)}`
    );
  }

  const returnUrl = `/invite/${encodeURIComponent(token)}?__clerk_ticket=${encodeURIComponent(ticket)}`;

  return <InviteClient returnUrl={returnUrl} ticket={ticket} />;
}
