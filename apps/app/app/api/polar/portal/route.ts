import { CustomerPortal } from "@polar-sh/nextjs";
import { keys } from '@repo/payments/keys';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Wrap CustomerPortal with error handling
const polarPortal = CustomerPortal({
  accessToken: keys().POLAR_ACCESS_TOKEN,
  getCustomerId: async (req) => {
    // Get the current authenticated user from Clerk
    const { userId } = await auth();
    
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

    if (!userData?.Id) {
      console.error(`User ${userId} not found in database`);
      throw new Error('User not found. Please contact support.');
    }

    // Check if PolarCustomerId exists on Users table
    if (userData.PolarCustomerId) {
      console.log(`[Portal] Found PolarCustomerId on Users: ${userData.PolarCustomerId}`);
      return userData.PolarCustomerId;
    }

    // Fallback: Check Subscriptions table for PolarCustomerId
    const { data: subData, error: subError } = await supabase
      .from('Subscriptions')
      .select('PolarCustomerId, PolarSubscriptionId, Status')
      .eq('UserId', userData.Id)
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
        .update({ PolarCustomerId: subData.PolarCustomerId })
        .eq('Id', userData.Id);
      
      return subData.PolarCustomerId;
    }
    
    console.error(`User ${userId} (internal: ${userData.Id}) does not have a Polar customer ID in Users or Subscriptions`);
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
