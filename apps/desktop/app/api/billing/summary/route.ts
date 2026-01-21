import { NextResponse } from 'next/server';
import { getSupabaseToken } from '../_utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('[billing/summary] Starting request...');
    const { token, apiBase } = await getSupabaseToken();
    console.log('[billing/summary] Got token, making request to:', `${apiBase}/billing/summary`);
    
    const res = await fetch(`${apiBase}/billing/summary`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });
    
    console.log('[billing/summary] Backend response status:', res.status);
    const json = await res.json();
    return NextResponse.json(json, { status: res.status });
  } catch (e: any) {
    console.error('[billing/summary] Error:', e);
    return NextResponse.json({ error: e?.message || 'Failed to fetch summary' }, { status: 500 });
  }
}


