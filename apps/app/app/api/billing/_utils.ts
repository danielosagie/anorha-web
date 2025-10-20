import { auth } from '@repo/auth/server';

export async function getSupabaseToken() {
  const { getToken } = await auth();
  if (!getToken) {
    throw new Error('Auth not available');
  }
  const clerkToken = await getToken();
  if (!clerkToken) {
    throw new Error('Missing Clerk session token');
  }
  const apiBase = process.env.NEXT_PUBLIC_API_URL;
  if (!apiBase) {
    throw new Error('NEXT_PUBLIC_API_URL is not set');
  }
  const res = await fetch(`${apiBase}/auth/exchange`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${clerkToken}` },
    // Do not cache token exchanges
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Auth exchange failed: ${res.status} ${text}`);
  }
  const data = (await res.json()) as { supabase_token: string };
  if (!data?.supabase_token) {
    throw new Error('No supabase_token in exchange response');
  }
  return { token: data.supabase_token, apiBase } as const;
}


