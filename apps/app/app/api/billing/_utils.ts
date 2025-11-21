import { auth } from '@repo/auth/server';

export async function getSupabaseToken() {
  try {
    const { getToken } = await auth();
    if (!getToken) {
      console.error('[getSupabaseToken] Auth not available');
      throw new Error('Auth not available');
    }

    // Get Clerk JWT directly (backend SupabaseAuthGuard handles Clerk JWTs)
    const clerkToken = await getToken({ template: 'supabase' });
    if (!clerkToken) {
      console.error('[getSupabaseToken] Missing Clerk session token');
      throw new Error('Missing Clerk session token');
    }

    const apiBase = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBase) {
      console.error('[getSupabaseToken] NEXT_PUBLIC_API_URL is not set');
      throw new Error('NEXT_PUBLIC_API_URL is not set');
    }

    console.log('[getSupabaseToken] Using Clerk JWT directly (no exchange needed)');

    // Normalize API URL to ensure it points to the API root (e.g. ending in /api)
    let finalApiBase = apiBase;
    if (finalApiBase.endsWith('/')) finalApiBase = finalApiBase.slice(0, -1);
    if (!finalApiBase.endsWith('/api')) finalApiBase = `${finalApiBase}/api`;

    return { token: clerkToken, apiBase: finalApiBase } as const;
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


