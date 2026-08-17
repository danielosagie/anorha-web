/**
 * Which kind of invite link landed on /invite/[token].
 *
 * Two token shapes exist in practice, and they belong to different systems:
 *
 * - `clerk-ticket`: a JWT minted by Clerk for an organization invitation. This
 *   is what a team invite email actually carries. Both senders leave
 *   `redirect_url` unset, so Clerk decides the landing page and appends the
 *   ticket as `__clerk_ticket`. Only Clerk can redeem it.
 *     sender A: apps/app team page, `organization.inviteMember(...)`
 *     sender B: sssync-bknd `POST /organizations/:orgId/invitations`
 *
 * - `partner-uuid`: a UUID minted by sssync-bknd for a cross-org partner
 *   invite, readable at `GET /cross-org/invites/token/<uuid>` and redeemed at
 *   /partner/accept/[token]. `OrgMemberInvites` has no token column, so this
 *   shape never refers to a team invite.
 *
 * Anything else is a typo or a truncated link, and saying so beats a blank page.
 */
export type InviteTokenKind = 'clerk-ticket' | 'partner-uuid' | 'unknown';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Three base64url segments. Deliberately shape-only: the ticket is Clerk's to
// verify, and a signature check here would just be a second place to be wrong.
const JWT_PATTERN = /^[\w-]+\.[\w-]+\.[\w-]+$/;

const ROLE_PREFIX = /^org:/;

export function classifyInviteToken(token: string): InviteTokenKind {
  if (UUID_PATTERN.test(token)) {
    return 'partner-uuid';
  }
  if (JWT_PATTERN.test(token)) {
    return 'clerk-ticket';
  }
  return 'unknown';
}

/**
 * The Clerk ticket for this request, or null when there is nothing to redeem.
 *
 * Clerk's own components read the ticket from `window.location.search`, so the
 * query wins when both are present and the path segment is the fallback for a
 * link written as /invite/<ticket>.
 */
export function resolveClerkTicket(
  token: string,
  queryTicket?: string | null
): string | null {
  if (queryTicket) {
    return queryTicket;
  }
  return classifyInviteToken(token) === 'clerk-ticket' ? token : null;
}

/** `org:admin` and `org:member` are Clerk's wire values, not label text. */
export function inviteRoleLabel(role: string): string {
  if (role === 'org:admin' || role === 'admin') {
    return 'Admin';
  }
  if (role === 'org:member' || role === 'member') {
    return 'Member';
  }
  return role.replace(ROLE_PREFIX, '');
}
