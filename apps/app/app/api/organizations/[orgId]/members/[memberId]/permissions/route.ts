import { NextResponse } from 'next/server';
import { getSupabaseToken } from '../../../../../billing/_utils'; 

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  context: { params: Promise<{ orgId: string; memberId: string }> }
) {
  try {
    const { orgId, memberId } = await context.params;
    console.log('[organizations/members/permissions] GET request for org:', orgId, 'member:', memberId);

    const { token, apiBase } = await getSupabaseToken();

    const res = await fetch(`${apiBase}/organizations/${orgId}/members/${memberId}/permissions`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    console.log('[organizations/members/permissions] Backend response status:', res.status);

    const json = await res.json();
    return NextResponse.json(json, { status: res.status });
  } catch (e: any) {
    console.error('[organizations/members/permissions] Error:', e);
    return NextResponse.json(
      { error: e?.message || 'Failed to fetch member permissions' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ orgId: string; memberId: string }> }
) {
  try {
    const { orgId, memberId } = await context.params;
    console.log('[organizations/members/permissions] PATCH request for org:', orgId, 'member:', memberId);

    const { token, apiBase } = await getSupabaseToken();
    const body = await request.json();

    const res = await fetch(`${apiBase}/organizations/${orgId}/members/${memberId}/permissions`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    console.log('[organizations/members/permissions] Backend response status:', res.status);

    const json = await res.json();
    return NextResponse.json(json, { status: res.status });
  } catch (e: any) {
    console.error('[organizations/members/permissions] Error:', e);
    return NextResponse.json(
      { error: e?.message || 'Failed to update member permissions' },
      { status: 500 }
    );
  }
}
