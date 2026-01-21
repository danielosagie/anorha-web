import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseToken } from '../../../../billing/_utils';

export const dynamic = 'force-dynamic';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ poolId: string; locationId: string }> }
) {
  try {
    const { poolId, locationId } = await context.params;
    console.log(`[pools/id/locations/id] DELETE request for location ${locationId} from pool ${poolId}`);

    const { token, apiBase } = await getSupabaseToken();

    const res = await fetch(`${apiBase}/pools/${poolId}/locations/${locationId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    console.log(`[pools/id/locations/id] Backend response status:`, res.status);

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

      console.error(`[pools/id/locations/id] Backend error response:`, {
        status: res.status,
        statusText: res.statusText,
        body: errorBody
      });

      return NextResponse.json(
        { 
          error: errorBody?.message || 'Failed to remove location from pool',
          status: res.status,
          details: errorBody
        },
        { status: res.status }
      );
    }

    const json = await res.json();
    return NextResponse.json(json, { status: res.status });
  } catch (e: any) {
    console.error(`[pools/id/locations/id] Unexpected error:`, e);
    return NextResponse.json(
      { error: e?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

