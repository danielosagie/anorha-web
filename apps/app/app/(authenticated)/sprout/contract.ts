import type {
  SproutBootstrap,
  SproutMessage,
  SproutPlan,
  SproutSession,
  SproutThread,
  StreamEvent,
  ToolActivity,
} from './types';

type UnknownRecord = Record<string, unknown>;

const asRecord = (value: unknown): UnknownRecord | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;

export const readString = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined;

const cleanDisplayCopy = (value: string): string =>
  value.replace(/\u2014/g, ',').trim();

const readStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.flatMap((item) => {
        if (typeof item === 'string' && item) {
          return [item];
        }
        const url = readString(asRecord(item)?.url);
        return url ? [url] : [];
      })
    : [];

const parseActivityStatus = (
  value: unknown
): ToolActivity['status'] => {
  const status = readString(value)?.toLowerCase();
  if (status === 'failed' || status === 'error' || status === 'blocked') {
    return 'failed';
  }
  if (status === 'pending' || status === 'running') {
    return 'pending';
  }
  return 'complete';
};

const parseActivity = (
  value: unknown,
  fallbackId: string
): ToolActivity | null => {
  const activity = asRecord(value);
  const label = readString(activity?.label);
  if (!(activity && label)) {
    return null;
  }

  return {
    id: readString(activity.id) || fallbackId,
    label: cleanDisplayCopy(label),
    status: parseActivityStatus(activity.status),
    summary: readString(activity.resultSummary)
      ? cleanDisplayCopy(readString(activity.resultSummary) as string)
      : undefined,
  };
};

const extractImageUrls = (
  message: UnknownRecord,
  metadata: UnknownRecord
): string[] => {
  const candidates = [
    metadata.imageUrls,
    metadata.image_urls,
    metadata.images,
    metadata.photos,
    message.imageUrls,
    message.image_urls,
  ];

  for (const candidate of candidates) {
    const urls = readStringArray(candidate);
    if (urls.length > 0) {
      return urls;
    }
  }

  return [];
};

export const parseMessage = (value: unknown): SproutMessage | null => {
  const message = asRecord(value);
  const sourceRole = readString(message?.role);
  const role = sourceRole === 'tool' ? 'assistant' : sourceRole;
  const id = readString(message?.id);
  if (!(message && id && (role === 'user' || role === 'assistant'))) {
    return null;
  }

  const metadata = asRecord(message.metadata) || {};
  const toolSteps = Array.isArray(metadata.toolSteps)
    ? metadata.toolSteps.flatMap((step, index) => {
        const activity = parseActivity(step, `${id}-activity-${index}`);
        return activity ? [activity] : [];
      })
    : [];

  return {
    id,
    role,
    content: readString(message.content) || '',
    createdAt:
      readString(message.timestamp) ||
      readString(message.createdAt) ||
      new Date().toISOString(),
    deliveryState: 'sent',
    metadata,
    activities: toolSteps,
    imageUrls: extractImageUrls(message, metadata),
    clientMessageId:
      readString(metadata.clientMessageId) ||
      readString(metadata.client_message_id),
    serverMessageId: id,
  };
};

const parsePlan = (value: unknown, threadId?: string): SproutPlan | null => {
  const action = asRecord(value);
  const input = asRecord(action?.input) || action;
  const id =
    readString(action?.id) ||
    readString(input?.pendingActionId) ||
    readString(input?.id);
  const title = readString(input?.title);
  if (!(input && id && title)) {
    return null;
  }

  const steps = Array.isArray(input.steps)
    ? input.steps.flatMap((value) => {
        const step = asRecord(value);
        const stepTitle = readString(step?.title);
        return step && stepTitle
          ? [
              {
                title: cleanDisplayCopy(stepTitle),
                detail: readString(step.detail)
                  ? cleanDisplayCopy(readString(step.detail) as string)
                  : undefined,
              },
            ]
          : [];
      })
    : [];

  return {
    id,
    threadId: readString(action?.threadId) || threadId,
    title: cleanDisplayCopy(title),
    summary: readString(input.summary)
      ? cleanDisplayCopy(readString(input.summary) as string)
      : undefined,
    steps,
  };
};

export const parseStreamPlan = (
  payload: UnknownRecord,
  threadId?: string
): SproutPlan | null => parsePlan(payload.plan, threadId);

export const parseStreamActivity = (
  payload: UnknownRecord,
  fallbackId: string
): ToolActivity =>
  parseActivity(payload, fallbackId) || {
    id: fallbackId,
    label: 'Completed a step',
    status: parseActivityStatus(payload.status),
    summary: readString(payload.resultSummary),
  };

export const parseBootstrap = (value: unknown): SproutBootstrap => {
  const response = asRecord(value) || {};
  const rawSession = asRecord(response.session);
  const rawThread = asRecord(response.thread);
  const sessionId = readString(rawSession?.id);
  const threadId = readString(rawThread?.id);
  const goal = asRecord(rawSession?.goal);

  const session: SproutSession | null = sessionId
    ? {
        id: sessionId,
        status: readString(rawSession?.status),
        goal: goal
          ? {
              targetRevenue:
                typeof goal.targetRevenue === 'number'
                  ? goal.targetRevenue
                  : undefined,
              timeframeDays:
                typeof goal.timeframeDays === 'number'
                  ? goal.timeframeDays
                  : undefined,
            }
          : undefined,
        updatedAt: readString(rawSession?.updatedAt),
        lastActiveAt: readString(rawSession?.lastActiveAt),
      }
    : null;

  const thread: SproutThread | null = threadId
    ? {
        id: threadId,
        title: readString(rawThread?.title),
        status: readString(rawThread?.status),
        isPrimary:
          typeof rawThread?.isPrimary === 'boolean'
            ? rawThread.isPrimary
            : undefined,
        updatedAt: readString(rawThread?.updatedAt),
      }
    : null;

  const messages = Array.isArray(response.messages)
    ? response.messages
        .flatMap((message) => {
          const parsed = parseMessage(message);
          return parsed ? [parsed] : [];
        })
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() -
            new Date(b.createdAt).getTime()
        )
    : [];

  const plan = Array.isArray(response.pendingActions)
    ? response.pendingActions
        .filter((value) => {
          const action = asRecord(value);
          const status = readString(action?.status);
          return (
            readString(action?.toolName) === 'propose_plan' &&
            status !== 'completed' &&
            status !== 'rejected'
          );
        })
        .sort((a, b) => {
          const aDate = readString(asRecord(a)?.createdAt) || '';
          const bDate = readString(asRecord(b)?.createdAt) || '';
          return bDate.localeCompare(aDate);
        })
        .map((action) => parsePlan(action, threadId))
        .find((candidate): candidate is SproutPlan => candidate !== null) ||
      null
    : null;

  return { session, thread, messages, plan };
};

export const parseStreamEvent = (value: string): StreamEvent | null => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return null;
  }

  const event = asRecord(parsed);
  const type = readString(event?.type) || readString(event?.event);
  if (!(event && type)) {
    return null;
  }

  return {
    type,
    payload: asRecord(event.payload) || event,
  };
};
