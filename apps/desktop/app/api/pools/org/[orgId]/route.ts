import { NextResponse } from 'next/server';
import { getSupabaseToken } from '../../../billing/_utils';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  context: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await context.params;
    console.log('[pools/org] GET request for org:', orgId);

    const { token, apiBase } = await getSupabaseToken();

    const res = await fetch(`${apiBase}/pools/org/${orgId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    console.log('[pools/org] Backend response status:', res.status);

    if (!res.ok) {
      let errorBody = null;
      try {
        const text = await res.text();
        try {
          errorBody = JSON.parse(text);
        } catch {
          errorBody = { message: text || 'Unknown error' };
        }
      } catch (e) {
        errorBody = { message: `HTTP ${res.status}: ${res.statusText}` };
      }

      console.error('[pools/org] Backend error response:', {
        status: res.status,
        statusText: res.statusText,
        body: errorBody
      });

      return NextResponse.json(
        { 
          error: errorBody?.message || 'Failed to fetch organization pools',
          status: res.status,
          details: errorBody
        },
        { status: res.status }
      );
    }

    const json = await res.json();
    return NextResponse.json(json, { status: res.status });
  } catch (e: any) {
    console.error('[pools/org] Unexpected error:', e);
    return NextResponse.json(
      { error: e?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
