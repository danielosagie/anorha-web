import { CustomerPortal } from "@polar-sh/nextjs";
import { keys } from '@repo/payments/keys';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';

export const GET = CustomerPortal({
  accessToken: keys().POLAR_ACCESS_TOKEN,
  getCustomerId: async (req) => {
    try {
      // Get the current authenticated user from Clerk
      const { userId } = await auth();
      
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Get Supabase client
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      );

      // Fetch user's Polar customer ID from Supabase
      const { data, error } = await supabase
        .from('Users')
        .select('PolarCustomerId')
        .eq('ClerkUserId', userId)
        .maybeSingle();

      if (error || !data?.PolarCustomerId) {
        throw new Error('User does not have a Polar customer ID');
      }

      return data.PolarCustomerId;
    } catch (error) {
      console.error('Failed to get Polar customer ID:', error);
      throw new Error('Unable to access customer portal');
    }
  },
  server: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox',
});
