import { auth } from '@clerk/nextjs/server';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333').replace(/\/$/, '');

// Proxy → backend inbox read (SYNC_REBUILD stage 2/3). Returns ResolveResult:
// { autoLink[], autoCreate[], needsAttention[], summary{...} }. The app renders
// needsAttention as the async inbox; nothing here blocks sync.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ connectionId: string }> },
) {
  try {
    const { getToken, userId } = await auth();
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const token = await getToken();
    if (!token) return Response.json({ error: 'No token' }, { status: 401 });

    const { connectionId } = await params;
    const res = await fetch(`${API_BASE}/api/sync/connections/${connectionId}/resolution`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return Response.json({ error: 'Failed to load resolution', detail: data }, { status: res.status });
    }
    return Response.json(data);
  } catch (error) {
    console.error('[connections/resolution] Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
