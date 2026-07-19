import {
  backendUrl,
  getBackendToken,
  proxyErrorResponse,
  SproutProxyError,
} from '../_backend';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type TurnBody = {
  sessionId?: unknown;
  threadId?: unknown;
  clientMessageId?: unknown;
  content?: unknown;
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
    const body = (await request.json()) as TurnBody;
    const sessionId = readRequiredString(body.sessionId);
    const threadId = readRequiredString(body.threadId);
    const clientMessageId = readRequiredString(body.clientMessageId);
    const content = readRequiredString(body.content);

    if (!(sessionId && threadId && clientMessageId && content)) {
      throw new SproutProxyError('Invalid turn', 400);
    }

    const upstream = await fetch(
      backendUrl(
        `/api/agent/sessions/${encodeURIComponent(sessionId)}/turns/stream`
      ),
      {
        method: 'POST',
        cache: 'no-store',
        signal: request.signal,
        headers: {
          Accept: 'text/event-stream',
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          threadId,
          clientMessageId,
          kind: 'message',
          content,
          useSharedMemory: true,
        }),
      }
    );

    if (!upstream.ok || !upstream.body) {
      throw new SproutProxyError('Turn failed', upstream.status || 502);
    }

    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        'Cache-Control': 'no-cache, no-transform',
        'Content-Type':
          upstream.headers.get('Content-Type') || 'text/event-stream',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    return proxyErrorResponse(error);
  }
}
