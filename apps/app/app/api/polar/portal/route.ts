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

    // Get Supabase client with service role for reliable access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );

    // First, get the user's internal ID and PolarCustomerId from Users table
    const { data: userData, error: userError } = await supabase
      .from('Users')
      .select('Id, PolarCustomerId')
      .eq('ClerkUserId', userId)
      .maybeSingle();

    if (userError) {
      console.error('Supabase error fetching user:', userError);
      throw new Error('Database error');
    }

    let internalUserId = userData?.Id as string | undefined;
    let polarCustomerId = userData?.PolarCustomerId as string | undefined;

    // Fallback 1: try to resolve internal user via OrgMemberships by clerk_user_id
    if (!internalUserId) {
      const { data: membership, error: membershipError } = await supabase
        .from('OrgMemberships')
        .select('UserId')
        .eq('clerk_user_id', userId)
        .maybeSingle();

      if (membershipError) {
        console.error('Supabase error fetching membership:', membershipError);
        throw new Error('Database error');
      }

      internalUserId = membership?.UserId || undefined;
    }

    // Fallback 2: try to resolve by email from Clerk
    if (!internalUserId && clerkUser?.emailAddresses?.length) {
      const primaryEmail = clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress
        || clerkUser.emailAddresses[0]?.emailAddress;
      if (primaryEmail) {
        const { data: emailMatch, error: emailError } = await supabase
          .from('Users')
          .select('Id, PolarCustomerId, ClerkUserId')
          .ilike('Email', primaryEmail)
          .maybeSingle();

        if (emailError) {
          console.error('Supabase error fetching user by email:', emailError);
          throw new Error('Database error');
        }

        if (emailMatch?.Id) {
          internalUserId = emailMatch.Id;
          polarCustomerId = emailMatch.PolarCustomerId as string | undefined;

          // Backfill ClerkUserId to keep mappings tight
          await supabase
            .from('Users')
            .update({ ClerkUserId: userId })
            .eq('Id', internalUserId);

          // Backfill membership linkage if missing
          await supabase
            .from('OrgMemberships')
            .update({ clerk_user_id: userId })
            .eq('UserId', internalUserId);
        }
      }
    }

    if (polarCustomerId) {
      console.log(`[Portal] Found PolarCustomerId on Users: ${polarCustomerId}`);
      return polarCustomerId;
    }

    if (!internalUserId) {
      console.error(`User ${userId} not found in Users, OrgMemberships, or by email fallback`);
      throw new Error('User not found. Please contact support.');
    }

    // Fallback: Check Subscriptions table for PolarCustomerId
    const { data: subData, error: subError } = await supabase
      .from('Subscriptions')
      .select('PolarCustomerId, PolarSubscriptionId, Status')
      .eq('UserId', internalUserId)
      .maybeSingle();

    if (subError) {
      console.error('Supabase error fetching subscription:', subError);
      throw new Error('Database error');
    }

    if (subData?.PolarCustomerId) {
      console.log(`[Portal] Found PolarCustomerId on Subscriptions: ${subData.PolarCustomerId}`);
      
      // Sync the PolarCustomerId back to Users table for future lookups
      await supabase
        .from('Users')
        .update({ PolarCustomerId: subData.PolarCustomerId, ClerkUserId: userId })
        .eq('Id', internalUserId);
      
      return subData.PolarCustomerId;
    }
    
    console.error(`User ${userId} (internal: ${internalUserId}) does not have a Polar customer ID in Users or Subscriptions`);
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
