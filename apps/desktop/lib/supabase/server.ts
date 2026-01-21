import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export type Database = unknown;

export async function getServerSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      // In RSC, setting cookies is not supported; route handlers should create clients per request.
      set(_name: string, _value: string, _options: CookieOptions) {
        // no-op in server components
      },
      remove(_name: string, _options: CookieOptions) {
        // no-op in server components
      },
    },
  });
}
