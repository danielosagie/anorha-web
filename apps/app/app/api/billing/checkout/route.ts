import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseToken } from '../_utils';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { token, apiBase } = await getSupabaseToken();
    const res = await fetch(`${apiBase}/billing/checkout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text }, { status: res.status });
    }
    const { url } = await res.json();
    return NextResponse.redirect(url, { status: 303 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to create checkout' }, { status: 500 });
  }
}


