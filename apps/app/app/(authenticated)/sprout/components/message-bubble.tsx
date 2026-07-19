import {
  Avatar,
  AvatarFallback,
} from '@repo/design-system/components/ui/avatar';
import { Spinner } from '@repo/design-system/components/ui/spinner';
import { ActivityCard } from './activity-card';
import {
  Bubble,
  Message,
  MessageContent,
} from './chat-primitives';
import { SproutDisclaimer } from './sprout-disclaimer';
import type { SproutMessage } from '../types';

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
});

const cleanAssistantCopy = (value: string) =>
  value.replace(/\u2014/g, ',').trim();

export function MessageBubble({
  message,
  showDisclaimer,
}: {
  message: SproutMessage;
  showDisclaimer: boolean;
}) {
  const isUser = message.role === 'user';
  const content = isUser
    ? message.content
    : cleanAssistantCopy(message.content);
  const date = new Date(message.createdAt);
  const timestamp = Number.isNaN(date.getTime())
    ? ''
    : timeFormatter.format(date);

  return (
    <Message align={isUser ? 'end' : 'start'}>
      {isUser ? null : (
        <Avatar className="mt-1">
          <AvatarFallback className="bg-primary/15 font-bold text-accent-foreground text-xs">
            S
          </AvatarFallback>
        </Avatar>
      )}
      <MessageContent align={isUser ? 'end' : 'start'}>
        <div className="flex items-center gap-2 px-1">
          <span className="font-semibold text-xs">
            {isUser ? 'You' : 'Sprout'}
          </span>
          {timestamp ? (
            <time className="text-muted-foreground text-xs" dateTime={message.createdAt}>
              {timestamp}
            </time>
          ) : null}
        </div>

        {content ? (
          <Bubble
            align={isUser ? 'end' : 'start'}
            variant={isUser ? 'tinted' : 'ghost'}
          >
            <p className="whitespace-pre-wrap break-words">{content}</p>
          </Bubble>
        ) : message.deliveryState === 'streaming' ? (
          <Bubble align="start" variant="ghost">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Spinner className="size-4" />
              Working
            </span>
          </Bubble>
        ) : null}

        {message.imageUrls.length ? (
          <div className="flex max-w-full flex-wrap gap-2">
            {message.imageUrls.map((url, index) => (
              <img
                alt="Attached photo"
                className="size-28 rounded-xl border border-border object-cover"
                height={112}
                key={`${url}-${index}`}
                loading="lazy"
                referrerPolicy="no-referrer"
                src={url}
                width={112}
              />
            ))}
          </div>
        ) : null}

        {message.activities.map((activity) => (
          <ActivityCard activity={activity} key={activity.id} />
        ))}

        {message.deliveryState === 'failed' ? (
          <p className="px-1 text-destructive text-xs">Reply interrupted.</p>
        ) : null}

        {showDisclaimer && message.deliveryState === 'sent' ? (
          <SproutDisclaimer />
        ) : null}
      </MessageContent>
    </Message>
  );
}
