import {
  AndroidAccessEmailError,
  AndroidAccessStorageError,
  claimAndroidAccessInvite,
  corsHeaders,
  getRequestIdentity,
  isAllowedAppOrigin,
  isFounderAllowed,
  markAndroidAccessInviteSent,
  recordAndroidAccessInviteError,
  sendAndroidAccessInvite,
} from '@/lib/android-access';

export const runtime = 'nodejs';

const METHODS = 'POST, OPTIONS';
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: The route keeps auth, atomic claim, idempotent mail, and error compensation visible together.
export async function POST(
  request: Request,
  context: { params: Promise<{ requestId: string }> }
) {
  if (!isAllowedAppOrigin(request)) {
    return json(request, { error: 'origin_forbidden' }, 403);
  }

  let requestId = 'unresolved';

  try {
    const identity = await getRequestIdentity();
    if (!identity) {
      return json(request, { error: 'unauthorized' }, 401);
    }
    if (!isFounderAllowed(identity)) {
      return json(request, { error: 'founder_forbidden' }, 403);
    }

    ({ requestId } = await context.params);
    if (!UUID_PATTERN.test(requestId)) {
      return json(request, { error: 'invalid_request_id' }, 400);
    }

    const claim = await claimAndroidAccessInvite(requestId);

    if (claim.outcome === 'already_sent') {
      return json(request, {
        emailSent: false,
        idempotent: true,
        ok: true,
        request: claim.request,
      });
    }

    if (claim.outcome === 'in_progress') {
      return json(request, { error: 'invite_in_progress' }, 409);
    }

    try {
      await sendAndroidAccessInvite(claim.request);
    } catch (error) {
      if (
        error instanceof AndroidAccessEmailError &&
        error.code === 'concurrent_idempotent_requests'
      ) {
        return json(request, { error: 'invite_in_progress' }, 409);
      }

      const message = error instanceof Error ? error.message : String(error);
      await recordAndroidAccessInviteError(requestId, message).catch(
        (recordError) => {
          // biome-ignore lint/suspicious/noConsole: A compensation write failure needs an operator receipt.
          console.error(
            '[android-access/admin] unable to record invite error',
            requestId,
            recordError
          );
        }
      );
      // biome-ignore lint/suspicious/noConsole: Mail failures are operator-actionable while the client receives a safe code.
      console.error(
        '[android-access/admin] install email failed',
        requestId,
        error
      );

      const status =
        error instanceof AndroidAccessEmailError &&
        error.code === 'access_url_not_configured'
          ? 503
          : 502;
      return json(request, { error: 'invite_send_failed' }, status);
    }

    const completed = await markAndroidAccessInviteSent(requestId);
    return json(request, {
      emailSent: true,
      idempotent: false,
      ok: true,
      request: completed,
    });
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: Completion failures need an operator receipt.
    console.error(
      '[android-access/admin] unable to complete request',
      requestId,
      error
    );

    if (error instanceof AndroidAccessStorageError && error.status === 404) {
      return json(request, { error: 'request_not_found' }, 404);
    }

    return json(request, { error: 'completion_unavailable' }, 502);
  }
}
