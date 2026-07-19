import { Skeleton } from '@repo/design-system/components/ui/skeleton';
import { MessageBubble } from './message-bubble';
import {
  Marker,
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerViewport,
} from './chat-primitives';
import { PlanCard } from './plan-card';
import type { SproutMessage, SproutPlan } from '../types';

const dayFormatter = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const dayKey = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }
  return dayFormatter.format(date);
};

type ChatListProps = {
  loading: boolean;
  messages: SproutMessage[];
  onPlanAction: (action: 'accept' | 'revise') => void;
  pendingPlanAction: 'accept' | 'revise' | null;
  plan: SproutPlan | null;
  unavailable: boolean;
};

export function ChatList({
  loading,
  messages,
  onPlanAction,
  pendingPlanAction,
  plan,
  unavailable,
}: ChatListProps) {
  const latestAssistantId = [...messages]
    .reverse()
    .find((message) => message.role === 'assistant')?.id;
  const latestUserId = [...messages]
    .reverse()
    .find((message) => message.role === 'user')?.id;

  return (
    <MessageScroller followKey={latestUserId}>
      <MessageScrollerViewport aria-label="Sprout conversation">
        <MessageScrollerContent className="gap-5 px-3 py-6 md:px-5 md:py-8">
          {loading ? <ConversationSkeleton /> : null}

          {loading || messages.length || plan ? null : (
            <div className="flex min-h-80 flex-col items-center justify-center gap-2 text-center">
              <h2 className="font-bold text-lg">
                {unavailable ? 'No conversation yet' : 'Start the conversation'}
              </h2>
              <p className="max-w-sm text-muted-foreground text-sm">
                {unavailable
                  ? 'Start a clearout on mobile to begin.'
                  : 'Ask Sprout what to do next.'}
              </p>
            </div>
          )}

          {messages.map((message, index) => {
            const currentDay = dayKey(message.createdAt);
            const previousDay =
              index > 0 ? dayKey(messages[index - 1].createdAt) : null;

            return (
              <MessageScrollerItem key={message.id} messageId={message.id}>
                <div className="flex flex-col gap-5">
                  {currentDay !== previousDay ? <Marker>{currentDay}</Marker> : null}
                  <MessageBubble
                    message={message}
                    showDisclaimer={message.id === latestAssistantId}
                  />
                </div>
              </MessageScrollerItem>
            );
          })}

          {plan ? (
            <MessageScrollerItem messageId={`plan-${plan.id}`}>
              <PlanCard
                onAction={onPlanAction}
                pendingAction={pendingPlanAction}
                plan={plan}
              />
            </MessageScrollerItem>
          ) : null}
        </MessageScrollerContent>
      </MessageScrollerViewport>
      <MessageScrollerButton />
    </MessageScroller>
  );
}

function ConversationSkeleton() {
  return (
    <div className="flex flex-col gap-7" aria-label="Loading conversation">
      <div className="flex items-start gap-3">
        <Skeleton className="size-8 rounded-full" />
        <Skeleton className="h-20 w-[72%] rounded-2xl" />
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-14 w-[56%] rounded-2xl" />
      </div>
      <div className="flex items-start gap-3">
        <Skeleton className="size-8 rounded-full" />
        <Skeleton className="h-28 w-[78%] rounded-2xl" />
      </div>
    </div>
  );
}
