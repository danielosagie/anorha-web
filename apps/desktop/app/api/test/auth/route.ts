import { NextResponse } from 'next/server';
import { getSupabaseToken } from '../../billing/_utils';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('[test/auth] Starting auth test...');
    const { token, apiBase } = await getSupabaseToken();
    console.log('[test/auth] Got token, making request to:', `${apiBase}/test/auth`);
    
    const res = await fetch(`${apiBase}/test/auth`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });
    
    console.log('[test/auth] Backend response status:', res.status);
    const json = await res.json();
    return NextResponse.json(json, { status: res.status });
  } catch (e: any) {
    console.error('[test/auth] Error:', e);
    return NextResponse.json({ error: e?.message || 'Auth test failed' }, { status: 500 });
  }
}
