import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseToken } from '../../billing/_utils';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ poolId: string }> }
) {
  try {
    const { poolId } = await context.params;
    console.log('[pools/id] GET request for pool:', poolId);

    const { token, apiBase } = await getSupabaseToken();

    const res = await fetch(`${apiBase}/pools/${poolId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    console.log('[pools/id] Backend response status:', res.status);

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

      console.error('[pools/id] Backend error response:', {
        status: res.status,
        statusText: res.statusText,
        body: errorBody
      });

      return NextResponse.json(
        { 
          error: errorBody?.message || 'Failed to fetch pool',
          status: res.status,
          details: errorBody
        },
        { status: res.status }
      );
    }

    const json = await res.json();
    return NextResponse.json(json, { status: res.status });
  } catch (e: any) {
    console.error('[pools/id] Unexpected error:', e);
    return NextResponse.json(
      { error: e?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ poolId: string }> }
) {
  try {
    const { poolId } = await context.params;
    console.log('[pools/id] PATCH request for pool:', poolId);

    const { token, apiBase } = await getSupabaseToken();

    const body = await request.json();

    const res = await fetch(`${apiBase}/pools/${poolId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    console.log('[pools/id] Backend response status:', res.status);

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

      console.error('[pools/id] Backend error response:', {
        status: res.status,
        statusText: res.statusText,
        body: errorBody
      });

      return NextResponse.json(
        { 
          error: errorBody?.message || 'Failed to update pool',
          status: res.status,
          details: errorBody
        },
        { status: res.status }
      );
    }

    const json = await res.json();
    return NextResponse.json(json, { status: res.status });
  } catch (e: any) {
    console.error('[pools/id] Unexpected error:', e);
    return NextResponse.json(
      { error: e?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ poolId: string }> }
) {
  try {
    const { poolId } = await context.params;
    console.log('[pools/id] DELETE request for pool:', poolId);

    const { token, apiBase } = await getSupabaseToken();

    const body = await request.json(); // { mergeIntoPoolId?: string }

    const res = await fetch(`${apiBase}/pools/${poolId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    console.log('[pools/id] Backend response status:', res.status);

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

      console.error('[pools/id] Backend error response:', {
        status: res.status,
        statusText: res.statusText,
        body: errorBody
      });

      return NextResponse.json(
        { 
          error: errorBody?.message || 'Failed to delete pool',
          status: res.status,
          details: errorBody
        },
        { status: res.status }
      );
    }

    const json = await res.json();
    return NextResponse.json(json, { status: res.status });
  } catch (e: any) {
    console.error('[pools/id] Unexpected error:', e);
    return NextResponse.json(
      { error: e?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
