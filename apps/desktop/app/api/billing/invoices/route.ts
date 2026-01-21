import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseToken } from '../_utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '12';
    const { token, apiBase } = await getSupabaseToken();
    const res = await fetch(`${apiBase}/billing/invoices?limit=${encodeURIComponent(limit)}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
    const json = await res.json();
    return NextResponse.json(json, { status: res.status });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to fetch invoices' }, { status: 500 });
  }
}


