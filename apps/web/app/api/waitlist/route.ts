import { env } from '@/env';

export const runtime = 'nodejs';

export async function GET() {
  return Response.json({ ok: true });
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: 'Invalid email' }, { status: 400 });
    }

    if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
      const res = await fetch(`${env.SUPABASE_URL}/rest/v1/waitlist_signups`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
          Prefer: 'return=representation',
        },
        body: JSON.stringify({ email, created_at: new Date().toISOString() }),
      });

      if (!res.ok) {
        const msg = await res.text();
        return Response.json({ error: `Supabase insert failed: ${msg}` }, { status: 502 });
      }

      const data = await res.json();
      return Response.json({ ok: true, data: Array.isArray(data) ? data[0] : data });
    }

    return Response.json({ error: 'Waitlist storage not configured' }, { status: 501 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}




