import { NextResponse } from 'next/server';
import { getSupabaseToken } from '../../../billing/_utils';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { orgId: string } }
) {
  try {
    console.log('[pools/org] GET request for org:', params.orgId);

    const { token, apiBase } = await getSupabaseToken();

    const res = await fetch(`${apiBase}/pools/org/${params.orgId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    console.log('[pools/org] Backend response status:', res.status);

    const json = await res.json();
    return NextResponse.json(json, { status: res.status });
  } catch (e: any) {
    console.error('[pools/org] Error:', e);
    return NextResponse.json(
      { error: e?.message || 'Failed to fetch organization pools' },
      { status: 500 }
    );
  }
}
