import { auth } from '@clerk/nextjs/server';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333').replace(/\/$/, '');

// Proxy → backend disconnect. The connections page already calls
// /api/connections/:id/disconnect; this is the route that backs it (it was
// missing, so disconnect 404'd from the web app). Disconnecting also triggers
// the backend's symmetric cross-org pause.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ connectionId: string }> },
) {
  try {
    const { getToken, userId } = await auth();
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const token = await getToken();
    if (!token) return Response.json({ error: 'No token' }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { connectionId } = await params;
    const res = await fetch(`${API_BASE}/api/platform-connections/${connectionId}/disconnect`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cleanupStrategy: body?.cleanupStrategy || 'soft_delete' }),
      cache: 'no-store',
    });

    if (!res.ok) {
      const detail = await res.json().catch(() => ({}));
      return Response.json({ error: 'Failed to disconnect', detail }, { status: res.status });
    }
    return Response.json({ success: true });
  } catch (error) {
    console.error('[connections/disconnect] Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
