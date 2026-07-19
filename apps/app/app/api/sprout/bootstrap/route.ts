import {
  getBackendToken,
  proxyErrorResponse,
  requestBackendJson,
} from '../_backend';

export const dynamic = 'force-dynamic';

type Session = {
  id: string;
  status?: string;
  goal?: { targetRevenue?: number; timeframeDays?: number };
  updatedAt?: string;
  lastActiveAt?: string;
};

type Thread = {
  id: string;
  title?: string;
  status?: string;
  isPrimary?: boolean;
  updatedAt?: string;
};

type Message = {
  id: string;
  role: string;
  content?: string;
  timestamp?: string;
  metadata?: Record<string, unknown>;
};

type PendingAction = {
  id: string;
  threadId?: string;
  toolName?: string;
  input?: Record<string, unknown>;
  status?: string;
  createdAt?: string;
};

const dateValue = (value?: string): number => {
  const parsed = value ? Date.parse(value) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
};

export async function GET() {
  try {
    const token = await getBackendToken();
    const sessionResponse = await requestBackendJson<{
      sessions?: Session[];
    }>(
      token,
      '/api/agent/sessions?type=liquidation&status=active,waiting_user,paused,completed,failed'
    );

    const sessions = [...(sessionResponse.sessions || [])].sort(
      (a, b) =>
        dateValue(b.lastActiveAt || b.updatedAt) -
        dateValue(a.lastActiveAt || a.updatedAt)
    );
    const session = sessions[0];

    if (!session) {
      return Response.json({
        session: null,
        thread: null,
        messages: [],
        pendingActions: [],
      });
    }

    const threadResponse = await requestBackendJson<{
      threads?: Thread[];
      primaryThreadId?: string;
    }>(token, `/api/agent/sessions/${encodeURIComponent(session.id)}/threads`);

    const threads = [...(threadResponse.threads || [])].sort(
      (a, b) => dateValue(b.updatedAt) - dateValue(a.updatedAt)
    );
    const thread =
      threads[0] ||
      threads.find((candidate) => candidate.id === threadResponse.primaryThreadId) ||
      null;

    if (!thread) {
      return Response.json({
        session,
        thread: null,
        messages: [],
        pendingActions: [],
      });
    }

    const encodedSessionId = encodeURIComponent(session.id);
    const encodedThreadId = encodeURIComponent(thread.id);
    const [messageResponse, pendingResponse] = await Promise.all([
      requestBackendJson<{ messages?: Message[] }>(
        token,
        `/api/agent/sessions/${encodedSessionId}/messages?threadId=${encodedThreadId}`
      ),
      requestBackendJson<{ pendingActions?: PendingAction[] }>(
        token,
        `/api/agent/sessions/${encodedSessionId}/pending-actions?threadId=${encodedThreadId}`
      ).catch(() => ({ pendingActions: [] })),
    ]);

    return Response.json({
      session,
      thread,
      messages: messageResponse.messages || [],
      pendingActions: pendingResponse.pendingActions || [],
    });
  } catch (error) {
    return proxyErrorResponse(error);
  }
}
