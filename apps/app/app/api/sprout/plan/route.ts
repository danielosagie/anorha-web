import {
  getBackendToken,
  proxyErrorResponse,
  requestBackendJson,
  SproutProxyError,
} from '../_backend';

type PlanBody = {
  action?: unknown;
  planId?: unknown;
  sessionId?: unknown;
  threadId?: unknown;
};

const readRequiredString = (value: unknown): string | null => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

export async function POST(request: Request) {
  try {
    const token = await getBackendToken();
    const body = (await request.json()) as PlanBody;
    const action = body.action === 'accept' ? 'accept' : body.action === 'revise' ? 'revise' : null;
    const planId = readRequiredString(body.planId);
    const sessionId = readRequiredString(body.sessionId);
    const threadId = readRequiredString(body.threadId);

    if (!(action && planId && sessionId && threadId)) {
      throw new SproutProxyError('Invalid plan action', 400);
    }

    const encodedSessionId = encodeURIComponent(sessionId);
    const encodedPlanId = encodeURIComponent(planId);

    if (action === 'accept') {
      await requestBackendJson(
        token,
        `/api/agent/sessions/${encodedSessionId}/pending-actions/${encodedPlanId}/approve`,
        { method: 'POST', body: JSON.stringify({}) }
      );
    } else {
      await requestBackendJson(
        token,
        `/api/agent/sessions/${encodedSessionId}/pending-actions/${encodedPlanId}/reject`,
        { method: 'POST', body: JSON.stringify({}) }
      );
      await requestBackendJson(
        token,
        `/api/agent/sessions/${encodedSessionId}/messages`,
        {
          method: 'POST',
          body: JSON.stringify({
            content:
              'Please revise the strategy with a more conservative execution path.',
            threadId,
          }),
        }
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    return proxyErrorResponse(error);
  }
}
