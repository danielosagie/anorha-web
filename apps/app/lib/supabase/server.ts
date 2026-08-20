import { auth } from '@repo/auth/server';
import { createClient } from '@supabase/supabase-js';

export type Database = unknown;

export async function getServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      'Workspace data configuration is missing: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required.'
    );
  }

  const { getToken, userId } = await auth();
  if (!userId) {
    throw new Error(
      'Workspace authentication is missing: Clerk user is required.'
    );
  }

  const token = await getToken();
  if (!token) {
    throw new Error(
      'Workspace authentication is missing: Clerk session token is required.'
    );
  }

  // Supabase is configured to trust Clerk as a third-party auth provider. Its
  // RLS policies resolve the Clerk `sub` through public.app_user_id(), matching
  // the native-auth contract used by mobile. A cookie-only Supabase client is
  // anonymous in this app because Clerk owns the session, so every protected
  // organization query would otherwise resolve to no rows.
  return createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
    accessToken: async () => token,
  });
}
