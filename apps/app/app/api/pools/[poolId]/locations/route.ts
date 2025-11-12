import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseToken } from '../../../billing/_utils';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ poolId: string }> }
) {
  try {
    const { poolId } = await context.params;
    console.log('[pools/id/locations] GET request for pool locations:', poolId);

    const { token, apiBase } = await getSupabaseToken();

    const res = await fetch(`${apiBase}/pools/${poolId}/locations`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    console.log('[pools/id/locations] Backend response status:', res.status);

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

      console.error('[pools/id/locations] Backend error response:', {
        status: res.status,
        statusText: res.statusText,
        body: errorBody
      });

      return NextResponse.json(
        { 
          error: errorBody?.message || 'Failed to fetch pool locations',
          status: res.status,
          details: errorBody
        },
        { status: res.status }
      );
    }

    const json = await res.json();
    return NextResponse.json(json, { status: res.status });
  } catch (e: any) {
    console.error('[pools/id/locations] Unexpected error:', e);
    return NextResponse.json(
      { error: e?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ poolId: string }> }
) {
  try {
    const { poolId } = await context.params;
    console.log('[pools/id/locations] POST request to add locations to pool:', poolId);

    const { token, apiBase } = await getSupabaseToken();

    const body = await request.json(); // Expect { location_ids: string[] }

    const res = await fetch(`${apiBase}/pools/${poolId}/locations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    console.log('[pools/id/locations] Backend response status:', res.status);

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

      console.error('[pools/id/locations] Backend error response:', {
        status: res.status,
        statusText: res.statusText,
        body: errorBody
      });

      return NextResponse.json(
        { 
          error: errorBody?.message || 'Failed to add locations to pool',
          status: res.status,
          details: errorBody
        },
        { status: res.status }
      );
    }

    const json = await res.json();
    return NextResponse.json(json, { status: res.status });
  } catch (e: any) {
    console.error('[pools/id/locations] Unexpected error:', e);
    return NextResponse.json(
      { error: e?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

