import {
  corsHeaders,
  getRequestIdentity,
  isAllowedAppOrigin,
  isFounderAllowed,
  listPendingAndroidAccess,
} from '@/lib/android-access';

export const runtime = 'nodejs';

const METHODS = 'GET, OPTIONS';

function json(request: Request, body: unknown, status = 200) {
  return Response.json(body, {
    headers: corsHeaders(request, METHODS),
    status,
  });
}

export function OPTIONS(request: Request) {
  if (!isAllowedAppOrigin(request)) {
    return json(request, { error: 'origin_forbidden' }, 403);
  }

  return new Response(null, {
    headers: corsHeaders(request, METHODS),
    status: 204,
  });
}

export async function GET(request: Request) {
  if (!isAllowedAppOrigin(request)) {
    return json(request, { error: 'origin_forbidden' }, 403);
  }

  try {
    const identity = await getRequestIdentity();
    if (!identity) {
      return json(request, { error: 'unauthorized' }, 401);
    }
    if (!isFounderAllowed(identity)) {
      return json(request, { error: 'founder_forbidden' }, 403);
    }

    const requests = await listPendingAndroidAccess();
    return json(request, { ok: true, requests });
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: Founder API failures need an operator receipt.
    console.error('[android-access/admin] unable to list requests', error);
    return json(request, { error: 'requests_unavailable' }, 502);
  }
}
