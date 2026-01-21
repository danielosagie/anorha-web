import { auth } from '@clerk/nextjs/server';

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333').replace(/\/$/, '');

export const dynamic = 'force-dynamic';

/**
 * GET /api/organizations/[orgId]/address
 * Proxy to backend to get organization business address
 */
export async function GET(
    request: Request,
    context: { params: Promise<{ orgId: string }> }
) {
    try {
        const { orgId } = await context.params;
        const { getToken, userId } = await auth();

        if (!userId) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = await getToken();
        if (!token) {
            return Response.json({ error: 'No token' }, { status: 401 });
        }

        const res = await fetch(`${API_BASE}/api/organizations/${orgId}/address`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            return Response.json(
                { error: errorData.message || 'Failed to get business address' },
                { status: res.status }
            );
        }

        const data = await res.json();
        return Response.json(data);
    } catch (error: any) {
        console.error('[address/GET] Error:', error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * PATCH /api/organizations/[orgId]/address
 * Proxy to backend to update organization business address
 */
export async function PATCH(
    request: Request,
    context: { params: Promise<{ orgId: string }> }
) {
    try {
        const { orgId } = await context.params;
        const { getToken, userId } = await auth();

        if (!userId) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const token = await getToken();
        if (!token) {
            return Response.json({ error: 'No token' }, { status: 401 });
        }

        const body = await request.json();

        const res = await fetch(`${API_BASE}/api/organizations/${orgId}/address`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            return Response.json(
                { error: errorData.message || 'Failed to update business address' },
                { status: res.status }
            );
        }

        const data = await res.json();
        return Response.json(data);
    } catch (error: any) {
        console.error('[address/PATCH] Error:', error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}
