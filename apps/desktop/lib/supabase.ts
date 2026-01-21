'use client';

import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@clerk/nextjs';  // For getting Clerk token

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Simple hook: Returns Supabase client with Clerk token injected
export function useSupabase() {
  const { getToken } = useAuth();

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,  // Handles expiry automatically
      persistSession: false,   // Clerk manages this
    },
    global: {
      async fetch(input: RequestInfo | URL, init?: RequestInit) {
        const token = await getToken();  // Clerk token (valid in Supabase now)
        const headers = new Headers(init?.headers);
        if (token) {
          headers.set('Authorization', `Bearer ${token}`);
        }
        return fetch(input, { ...init, headers });
      },
    },
  });

  return supabase;
}

