import { auth } from '@clerk/nextjs/server';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333').replace(/\/$/, '');

export async function GET() {
  try {
    const { getToken, userId } = await auth();
    
    if (!userId) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = await getToken();
    if (!token) {
      return Response.json({ error: 'No token' }, { status: 401 });
    }

    // Fetch from backend
    const res = await fetch(`${API_BASE}/api/connections`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return Response.json({ error: 'Failed to fetch connections' }, { status: res.status });
    }

    const data = await res.json();
    return Response.json(data);
  } catch (error) {
    console.error('[connections/route] Error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

