'use client';

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@repo/design-system/components/ui/alert';
import { Badge } from '@repo/design-system/components/ui/badge';
import { Button } from '@repo/design-system/components/ui/button';
import { AlertCircleIcon, RefreshCwIcon } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChatList } from './components/chat-list';
import { Composer } from './components/composer';
import type {
  PlanStep,
  SproutBootstrap,
  SproutMessage,
  SproutPlan,
  SproutSession,
  SproutThread,
  StreamEvent,
  ToolActivity,
} from './types';

type RecordValue = Record<string, unknown>;

const isRecord = (value: unknown): value is RecordValue =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const readString = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined;

const cleanDisplayCopy = (value: string): string =>
  value.replace(/\u2014/g, ',').trim();

const normalizeActivityStatus = (
  value: unknown
): ToolActivity['status'] => {
  if (value === 'failed' || value === 'blocked' || value === 'error') {
    return 'failed';
  }
  if (value === 'pending' || value === 'syncing' || value === 'running') {
    return 'pending';
  }
  return 'complete';
};

const extractImageUrls = (metadata: RecordValue): string[] => {
  const candidates = [
    metadata.imageUrls,
    metadata.image_urls,
    metadata.images,
    metadata.photos,
  ];

  for (const candidate of candidates) {
    if (!Array.isArray(candidate)) {
      continue;
    }

    const urls = candidate.flatMap((item) => {
      const url =
        typeof item === 'string'
          ? item
          : isRecord(item)
            ? readString(item.url)
            : undefined;
      return url && /^https?:\/\//i.test(url) ? [url] : [];
    });
    if (urls.length) {
      return urls;
    }
  }

  return [];
};

const extractActivities = (
  metadata: RecordValue,
  messageId: string
): ToolActivity[] => {
  const activities: ToolActivity[] = [];

  if (Array.isArray(metadata.activities)) {
    metadata.activities.forEach((item, index) => {
      if (!isRecord(item)) {
        return;
      }
      const label = readString(item.title) || readString(item.label);
      if (!label) {
        return;
      }
      activities.push({
        id: readString(item.id) || `${messageId}-activity-${index}`,
        label: cleanDisplayCopy(label),
        status: normalizeActivityStatus(item.status),
      });
    });
  }

  if (Array.isArray(metadata.toolSteps)) {
    metadata.toolSteps.forEach((item, index) => {
      if (!isRecord(item)) {
        return;
      }
      const label = readString(item.label);
      if (!label) {
        return;
      }
      activities.push({
        id: `${messageId}-step-${index}`,
        label: cleanDisplayCopy(label),
        status: normalizeActivityStatus(item.status),
        summary: readString(item.resultSummary)
          ? cleanDisplayCopy(readString(item.resultSummary) as string)
          : undefined,
      });
    });
  }

  return activities.filter(
    (activity, index, list) =>
      list.findIndex(
        (candidate) =>
          candidate.label === activity.label &&
          candidate.summary === activity.summary
      ) === index
  );
};

const parseMessage = (value: unknown): SproutMessage | null => {
  if (!isRecord(value)) {
    return null;
  }

  const id = readString(value.id);
  const rawRole = readString(value.role);
  const role = rawRole === 'tool' ? 'assistant' : rawRole;
  if (!(id && (role === 'user' || role === 'assistant'))) {
    return null;
  }

  const metadata = isRecord(value.metadata) ? value.metadata : {};
  const content = readString(value.content) || '';
  const createdAt =
    readString(value.timestamp) ||
    readString(value.createdAt) ||
    new Date().toISOString();
  const activities = extractActivities(metadata, id);
  const imageUrls = extractImageUrls({
    ...metadata,
    imageUrls: metadata.imageUrls ?? value.imageUrls,
    image_urls: metadata.image_urls ?? value.image_urls,
  });

  if (!(content.trim() || activities.length || imageUrls.length)) {
    return null;
  }

  return {
    id,
    role,
    content,
    createdAt,
    deliveryState: 'sent',
    metadata,
    activities,
    imageUrls,
    clientMessageId:
      readString(metadata.clientMessageId) ||
      readString(metadata.client_message_id),
    serverMessageId: id,
  };
};

const parsePlanSteps = (value: unknown): PlanStep[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((step) => {
    if (!isRecord(step)) {
      return [];
    }
    const title = readString(step.title);
    if (!title) {
      return [];
    }
    return [
      {
        title: cleanDisplayCopy(title),
        detail: readString(step.detail)
          ? cleanDisplayCopy(readString(step.detail) as string)
          : undefined,
      },
    ];
  });
};

const parsePlan = (
  value: unknown,
  activeThreadId?: string
): SproutPlan | null => {
  if (!Array.isArray(value)) {
    return null;
  }

  const pending = [...value]
    .filter(isRecord)
    .filter(
      (action) =>
        action.status !== 'completed' && action.status !== 'rejected'
    )
    .sort((a, b) => {
      const threadPriority =
        Number(readString(b.threadId) === activeThreadId) -
        Number(readString(a.threadId) === activeThreadId);
      if (threadPriority !== 0) {
        return threadPriority;
      }
      return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
    })
    .find((action) => {
      if (action.toolName !== 'propose_plan' || !isRecord(action.input)) {
        return false;
      }
      return typeof action.input.title === 'string';
    });

  if (!(pending && isRecord(pending.input))) {
    return null;
  }

  const id = readString(pending.id);
  const title = readString(pending.input.title);
  if (!(id && title)) {
    return null;
  }

  return {
    id,
    threadId: readString(pending.threadId),
    title: cleanDisplayCopy(title),
    summary: readString(pending.input.summary)
      ? cleanDisplayCopy(readString(pending.input.summary) as string)
      : undefined,
    steps: parsePlanSteps(pending.input.steps),
  };
};

const parseBootstrap = (value: unknown): SproutBootstrap => {
  const root = isRecord(value) ? value : {};
  const rawSession = isRecord(root.session) ? root.session : null;
  const rawThread = isRecord(root.thread) ? root.thread : null;

  const session: SproutSession | null =
    rawSession && readString(rawSession.id)
      ? {
          id: readString(rawSession.id) as string,
          status: readString(rawSession.status),
          goal: isRecord(rawSession.goal)
            ? {
                targetRevenue:
                  typeof rawSession.goal.targetRevenue === 'number'
                    ? rawSession.goal.targetRevenue
                    : undefined,
                timeframeDays:
                  typeof rawSession.goal.timeframeDays === 'number'
                    ? rawSession.goal.timeframeDays
                    : undefined,
              }
            : undefined,
          updatedAt: readString(rawSession.updatedAt),
          lastActiveAt: readString(rawSession.lastActiveAt),
        }
      : null;

  const thread: SproutThread | null =
    rawThread && readString(rawThread.id)
      ? {
          id: readString(rawThread.id) as string,
          title: readString(rawThread.title),
          status: readString(rawThread.status),
          isPrimary:
            typeof rawThread.isPrimary === 'boolean'
              ? rawThread.isPrimary
              : undefined,
          updatedAt: readString(rawThread.updatedAt),
        }
      : null;

  const messages = Array.isArray(root.messages)
    ? root.messages
        .map(parseMessage)
        .filter((message): message is SproutMessage => message !== null)
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
    : [];

  return {
    session,
    thread,
    messages,
    plan: parsePlan(root.pendingActions, thread?.id),
  };
};

const fetchBootstrap = async (signal?: AbortSignal): Promise<SproutBootstrap> => {
  const response = await fetch('/api/sprout/bootstrap', {
    cache: 'no-store',
    signal,
  });
  if (!response.ok) {
    throw new Error('Conversation unavailable');
  }
  return parseBootstrap(await response.json());
};

const parseStreamBlock = (block: string): StreamEvent | null => {
  const data = block
    .split(/\r?\n/)
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trimStart())
    .join('\n');

  if (!data || data === '[DONE]') {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(data);
    if (!isRecord(parsed)) {
      return null;
    }
    const type = readString(parsed.type) || readString(parsed.event);
    if (!type) {
      return null;
    }
    return {
      type,
      payload: isRecord(parsed.payload) ? parsed.payload : parsed,
    };
  } catch {
    return null;
  }
};

const consumeEventStream = async (
  response: Response,
  onEvent: (event: StreamEvent) => void
) => {
  if (!response.body) {
    throw new Error('Reply unavailable');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });

    const blocks = buffer.split(/\r?\n\r?\n/);
    buffer = blocks.pop() || '';
    for (const block of blocks) {
      const event = parseStreamBlock(block);
      if (event) {
        onEvent(event);
      }
    }

    if (done) {
      const event = parseStreamBlock(buffer);
      if (event) {
        onEvent(event);
      }
      return;
    }
  }
};

const getSessionTitle = (session: SproutSession | null): string => {
  const target = session?.goal?.targetRevenue;
  const days = session?.goal?.timeframeDays;
  if (target && days) {
    return `Clearout $${target.toLocaleString()} in ${days} days`;
  }
  return 'Clearout plan';
};

const wait = (duration: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, duration));

export function SproutThreadView() {
  const [session, setSession] = useState<SproutSession | null>(null);
  const [thread, setThread] = useState<SproutThread | null>(null);
  const [messages, setMessages] = useState<SproutMessage[]>([]);
  const [plan, setPlan] = useState<SproutPlan | null>(null);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingPlanAction, setPendingPlanAction] = useState<
    'accept' | 'revise' | null
  >(null);

  const applyBootstrap = useCallback((next: SproutBootstrap) => {
    setSession(next.session);
    setThread(next.thread);
    setMessages(next.messages);
    setPlan(next.plan);
  }, []);

  const refresh = useCallback(
    async (options?: { signal?: AbortSignal; silent?: boolean }) => {
      if (!options?.silent) {
        setLoading(true);
      }
      try {
        const next = await fetchBootstrap(options?.signal);
        applyBootstrap(next);
        setError(null);
        return next;
      } finally {
        if (!options?.silent) {
          setLoading(false);
        }
      }
    },
    [applyBootstrap]
  );

  useEffect(() => {
    const controller = new AbortController();
    refresh({ signal: controller.signal }).catch((refreshError: unknown) => {
      if ((refreshError as { name?: string })?.name !== 'AbortError') {
        setError('Conversation unavailable.');
        setLoading(false);
      }
    });
    return () => controller.abort();
  }, [refresh]);

  const recoverTurn = useCallback(
    async (knownAssistantIds: Set<string>) => {
      for (let attempt = 0; attempt < 6; attempt += 1) {
        await wait(attempt === 0 ? 700 : 1300);
        const next = await fetchBootstrap().catch(() => null);
        const recovered = next?.messages.find(
          (message) =>
            message.role === 'assistant' &&
            !knownAssistantIds.has(message.id) &&
            message.content.trim().length > 0
        );
        if (next && recovered) {
          applyBootstrap(next);
          return true;
        }
      }
      return false;
    },
    [applyBootstrap]
  );

  const sendMessage = useCallback(async () => {
    const content = draft.trim();
    if (!(content && session && thread) || streaming) {
      return;
    }

    const clientMessageId = crypto.randomUUID();
    const userId = `user-${clientMessageId}`;
    const assistantId = `assistant-${clientMessageId}`;
    const createdAt = new Date().toISOString();
    const knownAssistantIds = new Set(
      messages
        .filter((message) => message.role === 'assistant')
        .map((message) => message.id)
    );
    let accepted = false;
    let completed = false;
    let activityCount = 0;

    setDraft('');
    setError(null);
    setNotice(null);
    setStreaming(true);
    setMessages((current) => [
      ...current,
      {
        id: userId,
        role: 'user',
        content,
        createdAt,
        deliveryState: 'sending',
        metadata: {},
        activities: [],
        imageUrls: [],
        clientMessageId,
      },
      {
        id: assistantId,
        role: 'assistant',
        content: '',
        createdAt,
        deliveryState: 'streaming',
        metadata: {},
        activities: [],
        imageUrls: [],
      },
    ]);

    try {
      const response = await fetch('/api/sprout/turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: session.id,
          threadId: thread.id,
          clientMessageId,
          content,
        }),
      });
      if (!response.ok) {
        throw new Error('Reply unavailable');
      }

      await consumeEventStream(response, (event) => {
        if (event.type === 'message.ack') {
          accepted = true;
          const serverMessageId =
            readString(event.payload.serverMessageId) ||
            readString(event.payload.messageId);
          setMessages((current) =>
            current.map((message) =>
              message.id === userId
                ? {
                    ...message,
                    deliveryState: 'sent',
                    serverMessageId,
                  }
                : message
            )
          );
          return;
        }

        if (event.type === 'assistant.started') {
          accepted = true;
          return;
        }

        if (event.type === 'assistant.delta') {
          accepted = true;
          const delta =
            readString(event.payload.delta) ||
            readString(event.payload.content) ||
            '';
          if (!delta) {
            return;
          }
          setMessages((current) =>
            current.map((message) =>
              message.id === assistantId
                ? { ...message, content: `${message.content}${delta}` }
                : message
            )
          );
          return;
        }

        if (event.type === 'tool.completed') {
          accepted = true;
          const label = readString(event.payload.label);
          if (!label) {
            return;
          }
          activityCount += 1;
          const activity: ToolActivity = {
            id: `${assistantId}-activity-${activityCount}`,
            label: cleanDisplayCopy(label),
            status: normalizeActivityStatus(event.payload.status),
            summary: readString(event.payload.resultSummary)
              ? cleanDisplayCopy(
                  readString(event.payload.resultSummary) as string
                )
              : undefined,
          };
          setMessages((current) =>
            current.map((message) =>
              message.id === assistantId
                ? {
                    ...message,
                    activities: [...message.activities, activity],
                  }
                : message
            )
          );
          return;
        }

        if (event.type === 'assistant.completed') {
          completed = true;
          const finalContent = readString(event.payload.content);
          setMessages((current) =>
            current.map((message) =>
              message.id === assistantId
                ? {
                    ...message,
                    content: finalContent || message.content,
                    deliveryState: 'sent',
                  }
                : message
            )
          );
          return;
        }

        if (event.type === 'error') {
          throw new Error('Reply unavailable');
        }
      });

      if (!completed) {
        throw new Error('Reply interrupted');
      }

      await refresh({ silent: true });
    } catch {
      const recovered = accepted
        ? await recoverTurn(knownAssistantIds)
        : false;
      if (!recovered) {
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantId
              ? { ...message, deliveryState: 'failed' }
              : message.id === userId
                ? { ...message, deliveryState: 'sent' }
                : message
          )
        );
        setError('Reply interrupted. Try again.');
      }
    } finally {
      setStreaming(false);
    }
  }, [draft, messages, recoverTurn, refresh, session, streaming, thread]);

  const handlePlanAction = useCallback(
    async (action: 'accept' | 'revise') => {
      if (!(plan && session && thread) || pendingPlanAction) {
        return;
      }

      setPendingPlanAction(action);
      setError(null);
      setNotice(null);
      try {
        const response = await fetch('/api/sprout/plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action,
            planId: plan.id,
            sessionId: session.id,
            threadId: thread.id,
          }),
        });
        if (!response.ok) {
          throw new Error('Plan unavailable');
        }
        setNotice(action === 'accept' ? 'Plan accepted.' : 'Revision requested.');
        await refresh({ silent: true });
      } catch {
        setError('Plan could not be updated.');
      } finally {
        setPendingPlanAction(null);
      }
    },
    [pendingPlanAction, plan, refresh, session, thread]
  );

  const sessionTitle = useMemo(() => getSessionTitle(session), [session]);

  if (!loading && !session) {
    return (
      <div className="mx-auto flex min-h-[34rem] w-full max-w-[760px] flex-col items-center justify-center gap-2 rounded-2xl border border-border bg-background text-center">
        <h2 className="font-bold text-lg">No clearout yet</h2>
        <p className="max-w-sm text-muted-foreground text-sm">
          Start one in the mobile app.
        </p>
      </div>
    );
  }

  return (
    <section className="mx-auto flex h-[calc(100svh-10rem)] min-h-[34rem] w-full max-w-[760px] flex-col overflow-hidden rounded-2xl border border-border bg-background">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-4 py-3 md:px-5">
        <div className="min-w-0">
          <h2 className="truncate font-bold text-sm">{sessionTitle}</h2>
          <p className="truncate text-muted-foreground text-xs">
            {thread?.title || 'Primary chat'}
          </p>
        </div>
        {streaming ? <Badge variant="secondary">Working</Badge> : null}
      </header>

      {error ? (
        <div className="shrink-0 px-3 pt-3 md:px-5">
          <Alert variant="destructive">
            <AlertCircleIcon aria-hidden="true" />
            <AlertTitle>{error}</AlertTitle>
            <AlertDescription>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => refresh().catch(() => undefined)}
              >
                <RefreshCwIcon data-icon="inline-start" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      ) : null}

      <div className="sr-only" aria-live="polite">
        {notice}
      </div>

      <ChatList
        loading={loading}
        messages={messages}
        onPlanAction={handlePlanAction}
        pendingPlanAction={pendingPlanAction}
        plan={plan}
        unavailable={!thread}
      />

      <Composer
        disabled={streaming || !session || !thread}
        onChange={setDraft}
        onSend={sendMessage}
        value={draft}
      />
    </section>
  );
}
