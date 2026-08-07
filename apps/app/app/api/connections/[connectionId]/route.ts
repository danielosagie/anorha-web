import { auth } from '@clerk/nextjs/server';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333').replace(/\/$/, '');

// Proxy → backend hard delete. Unlike disconnect (soft-disable, reactivatable),
// this removes the PlatformConnections row so the same platform can be
// connected to a different account cleanly.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ connectionId: string }> },
) {
  try {
    const { getToken, userId } = await auth();
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const token = await getToken();
    if (!token) return Response.json({ error: 'No token' }, { status: 401 });

    const { connectionId } = await params;
    const res = await fetch(`${API_BASE}/api/platform-connections/${connectionId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });

    if (!res.ok) {
      const detail = await res.json().catch(() => ({}));
      return Response.json({ error: 'Failed to remove', detail }, { status: res.status });
    }
    return Response.json({ success: true });
  } catch (error) {
    console.error('[connections/delete] Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
