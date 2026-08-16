import {
  AndroidAccessStorageError,
  type PendingNotificationResult,
  corsHeaders,
  getAndroidAccessForUser,
  getRequestIdentity,
  isAllowedAppOrigin,
  requestAndroidAccess,
  sendPendingAndroidAccessNotifications,
} from '@/lib/android-access';

export const runtime = 'nodejs';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const METHODS = 'GET, POST, OPTIONS';

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

    const androidRequest = await getAndroidAccessForUser(identity.userId);
    return json(request, { ok: true, request: androidRequest });
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: Authenticated read failures need an operator receipt.
    console.error('[android-access] unable to read request', error);
    return json(request, { error: 'request_unavailable' }, 502);
  }
}

export async function POST(request: Request) {
  if (!isAllowedAppOrigin(request)) {
    return json(request, { error: 'origin_forbidden' }, 403);
  }

  let savedRequest: Awaited<ReturnType<typeof requestAndroidAccess>> | null =
    null;

  try {
    const identity = await getRequestIdentity();
    if (!identity) {
      return json(request, { error: 'unauthorized' }, 401);
    }
    if (!identity.accountEmail) {
      return json(request, { error: 'account_email_missing' }, 422);
    }

    let body: { email?: unknown };
    try {
      body = (await request.json()) as { email?: unknown };
    } catch {
      return json(request, { error: 'invalid_json' }, 400);
    }
    const playEmail =
      typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!EMAIL_PATTERN.test(playEmail)) {
      return json(request, { error: 'invalid_play_email' }, 400);
    }

    savedRequest = await requestAndroidAccess({
      accountEmail: identity.accountEmail,
      playEmail,
      userId: identity.userId,
    });

    if (savedRequest.request.inviteSentAt) {
      return json(request, {
        notifications: null,
        ok: true,
        request: savedRequest.request,
        saved: true,
      });
    }

    let notifications: PendingNotificationResult = {
      founder: 'failed',
      pendingEmail: 'failed',
    };

    try {
      notifications = await sendPendingAndroidAccessNotifications(
        savedRequest.request
      );
    } catch (notificationError) {
      // biome-ignore lint/suspicious/noConsole: The request is saved, so operators must see a failed notification update.
      console.error(
        '[android-access] request saved but notification state update failed',
        savedRequest.request.id,
        notificationError
      );
    }

    return json(request, {
      notifications,
      ok: true,
      request: savedRequest.request,
      saved: true,
    });
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: Storage failures need details in server logs, not in the client response.
    console.error('[android-access] unable to save request', error);

    if (error instanceof AndroidAccessStorageError && error.code === '23505') {
      return json(request, { error: 'play_email_already_requested' }, 409);
    }

    if (savedRequest) {
      return json(request, {
        notifications: {
          founder: 'failed',
          pendingEmail: 'failed',
        },
        ok: true,
        request: savedRequest.request,
        saved: true,
      });
    }

    return json(request, { error: 'request_not_saved' }, 502);
  }
}
