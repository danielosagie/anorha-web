import { currentUser, auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const { userId: clerkUserId } = await auth();
  const clerkUser = await currentUser();
  
  if (!clerkUserId) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

  // Try to find user by ClerkUserId
  const { data: userByClerk } = await supabase
    .from('Users')
    .select('*')
    .eq('ClerkUserId', clerkUserId)
    .maybeSingle();

  // Try to find by email
  const primaryEmail = clerkUser?.emailAddresses?.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress
    || clerkUser?.emailAddresses?.[0]?.emailAddress;

  const { data: userByEmail } = await supabase
    .from('Users')
    .select('*')
    .ilike('Email', primaryEmail || '')
    .maybeSingle();

  // Try to find membership
  const { data: membership } = await supabase
    .from('OrgMemberships')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle();

  // Try to find subscription
  const userId = userByClerk?.Id || userByEmail?.Id;
  let subscription = null;
  if (userId) {
    const { data: sub } = await supabase
      .from('Subscriptions')
      .select('*')
      .eq('UserId', userId)
      .maybeSingle();
    subscription = sub;
  }

  return Response.json({
    clerkUserId,
    clerkEmail: primaryEmail,
    clerkEmailAddresses: clerkUser?.emailAddresses?.map(e => ({ email: e.emailAddress, id: e.id })),
    userByClerkId: userByClerk ? { Id: userByClerk.Id, Email: userByClerk.Email, ClerkUserId: userByClerk.ClerkUserId, PolarCustomerId: userByClerk.PolarCustomerId } : null,
    userByEmail: userByEmail ? { Id: userByEmail.Id, Email: userByEmail.Email, ClerkUserId: userByEmail.ClerkUserId, PolarCustomerId: userByEmail.PolarCustomerId } : null,
    membership: membership ? { Id: membership.Id, UserId: membership.UserId, OrgId: membership.OrgId, clerk_user_id: membership.clerk_user_id, clerk_org_id: membership.clerk_org_id } : null,
    subscription: subscription ? { Id: subscription.Id, UserId: subscription.UserId, PolarCustomerId: subscription.PolarCustomerId, Status: subscription.Status } : null,
  });
}
