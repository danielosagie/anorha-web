import { auth } from '@repo/auth/server';

export async function getSupabaseToken() {
  try {
    const { getToken } = await auth();
    if (!getToken) {
      console.error('[getSupabaseToken] Auth not available');
      throw new Error('Auth not available');
    }
    
    const clerkToken = await getToken();
    if (!clerkToken) {
      console.error('[getSupabaseToken] Missing Clerk session token');
      throw new Error('Missing Clerk session token');
    }
    
    const apiBase = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBase) {
      console.error('[getSupabaseToken] NEXT_PUBLIC_API_URL is not set');
      throw new Error('NEXT_PUBLIC_API_URL is not set');
    }
    
    console.log('[getSupabaseToken] Exchanging Clerk token for Supabase token...');
    // Ensure /api prefix is in the URL
    const exchangeUrl = apiBase.endsWith('/api') 
      ? `${apiBase}/auth/exchange`
      : `${apiBase}/api/auth/exchange`;
    
    console.log('[getSupabaseToken] Exchange URL:', exchangeUrl);
    const res = await fetch(exchangeUrl, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${clerkToken}`,
        'Content-Type': 'application/json',
      },
      // Do not cache token exchanges
      cache: 'no-store',
    });
    
    if (!res.ok) {
      const text = await res.text();
      console.error(`[getSupabaseToken] Auth exchange failed: ${res.status} ${text}`);
      throw new Error(`Auth exchange failed: ${res.status} ${text}`);
    }
    
    const data = (await res.json()) as { supabase_token: string };
    if (!data?.supabase_token) {
      console.error('[getSupabaseToken] No supabase_token in exchange response');
      throw new Error('No supabase_token in exchange response');
    }
    
    console.log('[getSupabaseToken] Successfully obtained Supabase token');
    return { token: data.supabase_token, apiBase } as const;
  } catch (error) {
    console.error('[getSupabaseToken] Error:', error);
    throw error;
  }
}

export async function getAuthenticatedBackendHeaders() {
  const { token } = await getSupabaseToken();
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export function handleBackendError(error: any) {
  console.error('Backend request failed:', error);
  return Response.json(
    { error: error?.message || 'Backend request failed' },
    { status: 500 }
  );
}


