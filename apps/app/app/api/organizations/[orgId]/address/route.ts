import { NextResponse } from 'next/server';
import { auth } from '@repo/auth/server';

export const dynamic = 'force-dynamic';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333').replace(/\/$/, '');

/**
 * GET /api/organizations/[orgId]/address
 * Fetch the organization's business address from the backend
 */
export async function GET(
    request: Request,
    context: { params: Promise<{ orgId: string }> }
) {
    try {
        const { orgId } = await context.params;
        const { getToken, orgRole } = await auth();

        if (!orgRole) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const token = await getToken();

        const response = await fetch(`${API_BASE}/api/organizations/${orgId}/address`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[address/GET] Backend error:', errorText);
            return NextResponse.json(
                { error: 'Failed to fetch address' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[address/GET] Error:', error);
        return NextResponse.json(
            { error: error?.message || 'Failed to fetch address' },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/organizations/[orgId]/address
 * Update the organization's business address in the backend
 */
export async function PATCH(
    request: Request,
    context: { params: Promise<{ orgId: string }> }
) {
    try {
        const { orgId } = await context.params;
        const { getToken, orgRole } = await auth();

        if (!orgRole) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const token = await getToken();

        const response = await fetch(`${API_BASE}/api/organizations/${orgId}/address`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[address/PATCH] Backend error:', errorText);
            return NextResponse.json(
                { error: 'Failed to update address' },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('[address/PATCH] Error:', error);
        return NextResponse.json(
            { error: error?.message || 'Failed to update address' },
            { status: 500 }
        );
    }
}
