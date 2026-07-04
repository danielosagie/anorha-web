import { auth } from '@clerk/nextjs/server';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333').replace(/\/$/, '');

// Proxy → backend inbox decision (SYNC_REBUILD stage 2/3). Body:
// { platformId, choice: 'link'|'create'|'ignore', canonicalId?, valueOverride? }.
// Applies ONE resolution; the rest of the catalog is untouched (non-blocking).
export async function POST(
  request: Request,
  { params }: { params: Promise<{ connectionId: string }> },
) {
  try {
    const { getToken, userId } = await auth();
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const token = await getToken();
    if (!token) return Response.json({ error: 'No token' }, { status: 401 });

    const { connectionId } = await params;
    const body = await request.json().catch(() => ({}));
    const res = await fetch(`${API_BASE}/api/sync/connections/${connectionId}/resolve`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return Response.json({ error: 'Failed to resolve', detail: data }, { status: res.status });
    }
    return Response.json(data);
  } catch (error) {
    console.error('[connections/resolve] Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
