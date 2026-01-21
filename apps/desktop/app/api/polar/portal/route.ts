import { CustomerPortal } from "@polar-sh/nextjs";
import { keys } from '@repo/payments/keys';
import { auth, currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Wrap CustomerPortal with error handling
const polarPortal = CustomerPortal({
  accessToken: keys().POLAR_ACCESS_TOKEN,
  getCustomerId: async (req) => {
    // Get the current authenticated user from Clerk
    const { userId } = await auth();
    const clerkUser = await currentUser();
    
    if (!userId) {
      throw new Error('User not authenticated');
    }

    console.log(`[Portal] Starting getCustomerId for Clerk user: ${userId}`);

    // Get Supabase client with service role for reliable access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );

    // First, get the user's internal ID and PolarCustomerId from Users table
    console.log(`[Portal] Attempt 1: Query Users by ClerkUserId=${userId}`);
    const { data: userData, error: userError } = await supabase
      .from('Users')
      .select('Id, PolarCustomerId')
      .eq('ClerkUserId', userId)
      .maybeSingle();

    if (userError) {
      console.error('[Portal] Supabase error fetching user by ClerkUserId:', userError);
    } else {
      console.log(`[Portal] Attempt 1 result: ${userData ? `Found Users.Id=${userData.Id}, PolarCustomerId=${userData.PolarCustomerId}` : 'No match'}`);
    }

    let internalUserId = userData?.Id as string | undefined;
    let polarCustomerId = userData?.PolarCustomerId as string | undefined;

    // Fallback 1: try to resolve internal user via OrgMemberships by clerk_user_id
    if (!internalUserId) {
      console.log(`[Portal] Attempt 2: Query OrgMemberships by clerk_user_id=${userId}`);
      const { data: membership, error: membershipError } = await supabase
        .from('OrgMemberships')
        .select('UserId')
        .eq('clerk_user_id', userId)
        .maybeSingle();

      if (membershipError) {
        console.error('[Portal] Supabase error fetching membership:', membershipError);
      } else {
        console.log(`[Portal] Attempt 2 result: ${membership ? `Found OrgMemberships.UserId=${membership.UserId}` : 'No match'}`);
      }

      internalUserId = membership?.UserId || undefined;
    }

    // Fallback 2: try to resolve by email from Clerk
    if (!internalUserId && clerkUser?.emailAddresses?.length) {
      const primaryEmail = clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress
        || clerkUser.emailAddresses[0]?.emailAddress;
      
      if (primaryEmail) {
        console.log(`[Portal] Attempt 3: Query Users by Email (ilike) = ${primaryEmail}`);
        const { data: emailMatch, error: emailError } = await supabase
          .from('Users')
          .select('Id, PolarCustomerId, ClerkUserId')
          .ilike('Email', primaryEmail)
          .maybeSingle();

        if (emailError) {
          console.error('[Portal] Supabase error fetching user by email:', emailError);
        } else {
          console.log(`[Portal] Attempt 3 result: ${emailMatch ? `Found Users.Id=${emailMatch.Id}, PolarCustomerId=${emailMatch.PolarCustomerId}` : 'No match'}`);
        }

        if (emailMatch?.Id) {
          internalUserId = emailMatch.Id;
          polarCustomerId = emailMatch.PolarCustomerId as string | undefined;

          // Backfill ClerkUserId to keep mappings tight
          console.log(`[Portal] Backfilling Users.ClerkUserId=${userId} for Users.Id=${internalUserId}`);
          await supabase
            .from('Users')
            .update({ ClerkUserId: userId })
            .eq('Id', internalUserId);

          // Backfill membership linkage if missing
          console.log(`[Portal] Backfilling OrgMemberships.clerk_user_id=${userId} for UserId=${internalUserId}`);
          await supabase
            .from('OrgMemberships')
            .update({ clerk_user_id: userId })
            .eq('UserId', internalUserId);
        }
      } else {
        console.log(`[Portal] No primary email found in Clerk user`);
      }
    }

    if (polarCustomerId) {
      console.log(`[Portal] SUCCESS: Found PolarCustomerId=${polarCustomerId}`);
      return polarCustomerId;
    }

    if (!internalUserId) {
      console.error(`[Portal] FAIL: User ${userId} not found in Users, OrgMemberships, or by email fallback. ClerkUser email addresses: ${clerkUser?.emailAddresses?.map(e => e.emailAddress).join(', ') || 'none'}`);
      throw new Error('User not found. Please contact support.');
    }

    // Fallback: Check Subscriptions table for PolarCustomerId
    console.log(`[Portal] Attempt 4: Query Subscriptions for UserId=${internalUserId}`);
    const { data: subData, error: subError } = await supabase
      .from('Subscriptions')
      .select('PolarCustomerId, PolarSubscriptionId, Status')
      .eq('UserId', internalUserId)
      .maybeSingle();

    if (subError) {
      console.error('[Portal] Supabase error fetching subscription:', subError);
    } else {
      console.log(`[Portal] Attempt 4 result: ${subData ? `Found Subscriptions.PolarCustomerId=${subData.PolarCustomerId}` : 'No match'}`);
    }

    if (subData?.PolarCustomerId) {
      console.log(`[Portal] SUCCESS: Found PolarCustomerId=${subData.PolarCustomerId} on Subscriptions`);
      
      // Sync the PolarCustomerId back to Users table for future lookups
      console.log(`[Portal] Syncing PolarCustomerId back to Users.Id=${internalUserId}`);
      await supabase
        .from('Users')
        .update({ PolarCustomerId: subData.PolarCustomerId, ClerkUserId: userId })
        .eq('Id', internalUserId);
      
      return subData.PolarCustomerId;
    }
    
    console.error(`[Portal] FAIL: User ${userId} (internal: ${internalUserId}) does not have a Polar customer ID in Users or Subscriptions`);
    throw new Error('No Polar subscription found. Please subscribe first.');
  },
  server: (process.env.POLAR_API_SERVER as 'production' | 'sandbox') || 'production',
});

export async function GET(req: NextRequest) {
  try {
    return await polarPortal(req);
  } catch (error: any) {
    console.error('Polar portal error:', error);
    // Return a redirect to billing page with error message instead of 500
    const errorMessage = encodeURIComponent(error?.message || 'Unable to access subscription portal');
    return NextResponse.redirect(
      new URL(`/billing?error=${errorMessage}`, req.url)
    );
  }
}
