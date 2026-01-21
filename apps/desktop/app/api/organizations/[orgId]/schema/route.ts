import { NextResponse } from 'next/server';
import { getSupabaseToken } from '../../../billing/_utils';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  context: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await context.params;
    console.log('[organizations/schema] Starting request for org:', orgId);

    const { token, apiBase } = await getSupabaseToken();

    const res = await fetch(`${apiBase}/organizations/${orgId}/schema`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    console.log('[organizations/schema] Backend response status:', res.status);

    const json = await res.json();
    return NextResponse.json(json, { status: res.status });
  } catch (e: any) {
    console.error('[organizations/schema] Error:', e);
    return NextResponse.json(
      { error: e?.message || 'Failed to fetch organization schema' },
      { status: 500 }
    );
  }
}
