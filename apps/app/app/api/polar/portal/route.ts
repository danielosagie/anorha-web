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

    // Fetch user's Polar customer ID from Supabase
    const { data, error } = await supabase
      .from('Users')
      .select('PolarCustomerId')
      .eq('ClerkUserId', userId)
      .maybeSingle();

    if (error) {
      console.error('Supabase error fetching Polar customer ID:', error);
      throw new Error('Database error');
    }
    
    if (!data?.PolarCustomerId) {
      console.error(`User ${userId} does not have a Polar customer ID`);
      throw new Error('No Polar subscription found. Please subscribe first.');
    }

    return data.PolarCustomerId;
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
