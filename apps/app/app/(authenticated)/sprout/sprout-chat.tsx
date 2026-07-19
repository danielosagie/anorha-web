'use client';

import {
  Alert,
  AlertDescription,
} from '@repo/design-system/components/ui/alert';
import { toast } from 'sonner';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChatList } from './components/chat-list';
import { Composer } from './components/composer';
import {
  parseBootstrap,
  parseStreamActivity,
  parseStreamEvent,
  parseStreamPlan,
  readString,
} from './contract';
import type {
  SproutBootstrap,
  SproutMessage,
  StreamEvent,
} from './types';

const EMPTY_BOOTSTRAP: SproutBootstrap = {
  session: null,
  thread: null,
  messages: [],
  plan: null,
};

const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, milliseconds));

const responseError = async (response: Response, fallback: string) => {
  const body = (await response.json().catch(() => null)) as {
    error?: unknown;
  } | null;
  return typeof body?.error === 'string' ? body.error : fallback;
};

const createClientId = () =>
  typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `message-${Date.now()}`;

export function SproutChat() {
  const [chat, setChat] = useState<SproutBootstrap>(EMPTY_BOOTSTRAP);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [pendingPlanAction, setPendingPlanAction] = useState<
    'accept' | 'revise' | null
  >(null);
  const chatRef = useRef(chat);

  useEffect(() => {
    chatRef.current = chat;
  }, [chat]);

  const fetchBootstrap = useCallback(async () => {
    const response = await fetch('/api/sprout/bootstrap', {
      cache: 'no-store',
    });
    if (!response.ok) {
      throw new Error(await responseError(response, 'Could not load Sprout.'));
    }
    return parseBootstrap(await response.json());
  }, []);

  const refresh = useCallback(
    async (showLoading = false) => {
      if (showLoading) {
        setLoading(true);
      }
      try {
        const next = await fetchBootstrap();
        setChat(next);
        setError(null);
        return next;
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [fetchBootstrap]
  );

  useEffect(() => {
    let active = true;
    fetchBootstrap()
      .then((next) => {
        if (active) {
          setChat(next);
          setError(null);
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(
            reason instanceof Error ? reason.message : 'Could not load Sprout.'
          );
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [fetchBootstrap]);

  const updateAssistant = useCallback(
    (
      assistantId: string,
      updater: (message: SproutMessage) => SproutMessage
    ) => {
      setChat((current) => ({
        ...current,
        messages: current.messages.map((message) =>
          message.id === assistantId ? updater(message) : message
        ),
      }));
    },
    []
  );

  const recoverCompletedTurn = useCallback(
    async (assistantIdsBeforeTurn: Set<string>, sentAt: number) => {
      for (let attempt = 0; attempt < 6; attempt += 1) {
        await wait(attempt === 0 ? 700 : 1300);
        const next = await fetchBootstrap().catch(() => null);
        if (!next) {
          continue;
        }
        const recovered = [...next.messages].reverse().find((message) => {
          if (message.role !== 'assistant' || !message.content.trim()) {
            return false;
          }
          return (
            !assistantIdsBeforeTurn.has(message.id) ||
            new Date(message.createdAt).getTime() >= sentAt
          );
        });
        if (recovered) {
          setChat(next);
          return true;
        }
      }
      return false;
    },
    [fetchBootstrap]
  );

  const send = useCallback(async () => {
    const content = draft.trim();
    const { session, thread } = chatRef.current;
    if (!(content && session && thread) || streaming) {
      return;
    }

    const clientMessageId = createClientId();
    const assistantId = `assistant-${clientMessageId}`;
    const createdAt = new Date().toISOString();
    const sentAt = Date.now();
    const assistantIdsBeforeTurn = new Set(
      chatRef.current.messages
        .filter((message) => message.role === 'assistant')
        .map((message) => message.id)
    );
    let accepted = false;
    let completed = false;
    let activityIndex = 0;

    const userMessage: SproutMessage = {
      id: clientMessageId,
      clientMessageId,
      role: 'user',
      content,
      createdAt,
      deliveryState: 'sending',
      metadata: {},
      activities: [],
      imageUrls: [],
    };
    const assistantMessage: SproutMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      createdAt,
      deliveryState: 'streaming',
      metadata: {},
      activities: [],
      imageUrls: [],
    };

    setDraft('');
    setError(null);
    setStreaming(true);
    setChat((current) => ({
      ...current,
      messages: [...current.messages, userMessage, assistantMessage],
    }));

    const handleEvent = (event: StreamEvent) => {
      const { payload, type } = event;
      if (type === 'message.ack') {
        accepted = true;
        const serverMessageId =
          readString(payload.serverMessageId) ||
          readString(payload.messageId);
        setChat((current) => ({
          ...current,
          messages: current.messages.map((message) =>
            message.id === clientMessageId
              ? { ...message, deliveryState: 'sent', serverMessageId }
              : message
          ),
        }));
        return;
      }
      if (type === 'assistant.started') {
        accepted = true;
        return;
      }
      if (type === 'assistant.delta') {
        accepted = true;
        const delta =
          readString(payload.delta) || readString(payload.content) || '';
        updateAssistant(assistantId, (message) => ({
          ...message,
          content: `${message.content}${delta}`,
        }));
        return;
      }
      if (type === 'tool.completed') {
        accepted = true;
        const activity = parseStreamActivity(
          payload,
          `${assistantId}-activity-${activityIndex}`
        );
        activityIndex += 1;
        updateAssistant(assistantId, (message) => ({
          ...message,
          activities: [...message.activities, activity],
        }));
        const nextPlan = parseStreamPlan(payload, thread.id);
        if (nextPlan) {
          setChat((current) => ({ ...current, plan: nextPlan }));
        }
        return;
      }
      if (type === 'assistant.completed') {
        completed = true;
        const finalContent = readString(payload.content);
        updateAssistant(assistantId, (message) => ({
          ...message,
          content: finalContent || message.content,
          deliveryState: 'sent',
        }));
        return;
      }
      if (type === 'error') {
        throw new Error(readString(payload.message) || 'Reply interrupted.');
      }
    };

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
      if (!(response.ok && response.body)) {
        throw new Error(await responseError(response, 'Could not send message.'));
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const result = await reader.read();
        buffer += decoder.decode(result.value, { stream: !result.done });
        const blocks = buffer.split(/\r?\n\r?\n/);
        buffer = blocks.pop() || '';

        for (const block of blocks) {
          const data = block
            .split(/\r?\n/)
            .filter((line) => line.startsWith('data:'))
            .map((line) => line.slice(5).trimStart())
            .join('\n');
          if (!data || data === '[DONE]') {
            continue;
          }
          const event = parseStreamEvent(data);
          if (event) {
            handleEvent(event);
          }
        }

        if (result.done) {
          break;
        }
      }

      if (!completed) {
        throw new Error('Reply interrupted.');
      }

      await refresh().catch(() => undefined);
    } catch (reason) {
      const recovered = accepted
        ? await recoverCompletedTurn(assistantIdsBeforeTurn, sentAt)
        : false;
      if (!recovered) {
        const message =
          reason instanceof Error ? reason.message : 'Reply interrupted.';
        setError(message);
        setChat((current) => ({
          ...current,
          messages: current.messages
            .map((item) =>
              item.id === clientMessageId
                ? { ...item, deliveryState: 'failed' as const }
                : item.id === assistantId
                  ? { ...item, deliveryState: 'failed' as const }
                  : item
            )
            .filter(
              (item) => item.id !== assistantId || Boolean(item.content.trim())
            ),
        }));
      }
    } finally {
      setStreaming(false);
    }
  }, [draft, recoverCompletedTurn, refresh, streaming, updateAssistant]);

  const handlePlanAction = useCallback(
    async (action: 'accept' | 'revise') => {
      const { plan, session, thread } = chatRef.current;
      if (!(plan && session && thread) || pendingPlanAction) {
        return;
      }

      setPendingPlanAction(action);
      setError(null);
      try {
        const response = await fetch('/api/sprout/plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action,
            planId: plan.id,
            sessionId: session.id,
            threadId: plan.threadId || thread.id,
          }),
        });
        if (!response.ok) {
          throw new Error(
            await responseError(response, 'Could not update the plan.')
          );
        }
        setChat((current) => ({ ...current, plan: null }));
        toast.success(action === 'accept' ? 'Plan accepted.' : 'Revision sent.');
        await refresh().catch(() => undefined);
      } catch (reason) {
        setError(
          reason instanceof Error
            ? reason.message
            : 'Could not update the plan.'
        );
      } finally {
        setPendingPlanAction(null);
      }
    },
    [pendingPlanAction, refresh]
  );

  const unavailable = !loading && !(chat.session && chat.thread);

  return (
    <div className="mx-auto flex h-[calc(100svh-13.5rem)] min-h-[32rem] w-full max-w-[760px] flex-col overflow-hidden rounded-2xl border bg-background">
      <ChatList
        loading={loading}
        messages={chat.messages}
        onPlanAction={handlePlanAction}
        pendingPlanAction={pendingPlanAction}
        plan={chat.plan}
        unavailable={unavailable}
      />
      {error ? (
        <div className="mx-auto w-full max-w-[760px] px-3 pb-2 md:px-5">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      ) : null}
      <Composer
        disabled={streaming || unavailable}
        onChange={setDraft}
        onSend={send}
        value={draft}
      />
    </div>
  );
}
