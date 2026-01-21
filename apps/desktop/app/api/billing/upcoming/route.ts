import { NextResponse } from 'next/server';
import { getSupabaseToken } from '../_utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { token, apiBase } = await getSupabaseToken();
    const res = await fetch(`${apiBase}/billing/upcoming`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const json = await res.json();
    return NextResponse.json(json, { status: res.status });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to fetch upcoming invoice' }, { status: 500 });
  }
}


