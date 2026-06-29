import { auth } from '@clerk/nextjs/server';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333').replace(/\/$/, '');

// Proxy → backend initial scan. The connections page fires this automatically
// right after OAuth so web matches mobile: connect → scan → (auto-pilot) sync,
// no manual "Start Scan" tap.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ connectionId: string }> },
) {
  try {
    const { getToken, userId } = await auth();
    if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const token = await getToken();
    if (!token) return Response.json({ error: 'No token' }, { status: 401 });

    const { connectionId } = await params;
    const res = await fetch(`${API_BASE}/api/sync/connections/${connectionId}/start-scan`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return Response.json({ error: 'Failed to start scan', detail: data }, { status: res.status });
    }
    return Response.json(data);
  } catch (error) {
    console.error('[connections/start-scan] Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
