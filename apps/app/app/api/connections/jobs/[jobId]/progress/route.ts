import { auth } from '@clerk/nextjs/server';

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'
).replace(/\/$/, '');

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { getToken, userId } = await auth();
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = await getToken();
    if (!token) {
      return Response.json({ error: 'No token' }, { status: 401 });
    }

    const { jobId } = await params;
    const response = await fetch(
      `${API_BASE}/api/sync/jobs/${encodeURIComponent(jobId)}/progress`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    );
    const data: unknown = await response.json().catch(() => ({}));

    if (!response.ok) {
      return Response.json(
        { error: 'Progress unavailable', detail: data },
        { status: response.status }
      );
    }

    return Response.json(data);
  } catch (error) {
    console.error('[connections/progress] Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
