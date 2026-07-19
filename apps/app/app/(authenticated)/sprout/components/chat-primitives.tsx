'use client';

import { Button } from '@repo/design-system/components/ui/button';
import { cn } from '@repo/design-system/lib/utils';
import { ChevronDownIcon } from 'lucide-react';
import {
  createContext,
  type ComponentProps,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from 'react';
import { useStickToBottom } from '../hooks/use-stick-to-bottom';

type MessageScrollerContextValue = {
  scrollToBottom: (behavior?: ScrollBehavior) => void;
  setContent: (node: HTMLDivElement | null) => void;
  setViewport: (node: HTMLDivElement | null) => void;
  showJumpButton: boolean;
};

const MessageScrollerContext = createContext<MessageScrollerContextValue | null>(
  null
);

const useMessageScrollerContext = () => {
  const value = useContext(MessageScrollerContext);
  if (!value) {
    throw new Error('MessageScroller parts must be inside MessageScroller.');
  }
  return value;
};

export function MessageScroller({
  children,
  className,
  followKey,
}: {
  children: ReactNode;
  className?: string;
  followKey?: string;
}) {
  const [viewport, setViewport] = useState<HTMLDivElement | null>(null);
  const [content, setContent] = useState<HTMLDivElement | null>(null);
  const { scrollToBottom, showJumpButton } = useStickToBottom({
    content,
    followKey,
    viewport,
  });
  const contextValue = useMemo(
    () => ({ scrollToBottom, setContent, setViewport, showJumpButton }),
    [scrollToBottom, showJumpButton]
  );

  return (
    <MessageScrollerContext.Provider value={contextValue}>
      <div className={cn('relative flex min-h-0 flex-1', className)}>
        {children}
      </div>
    </MessageScrollerContext.Provider>
  );
}

export function MessageScrollerViewport({
  className,
  ...props
}: ComponentProps<'div'>) {
  const { setViewport } = useMessageScrollerContext();

  return (
    <div
      ref={setViewport}
      className={cn(
        'min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-smooth',
        className
      )}
      {...props}
    />
  );
}

export function MessageScrollerContent({
  className,
  ...props
}: ComponentProps<'div'>) {
  const { setContent } = useMessageScrollerContext();

  return (
    <div
      ref={setContent}
      className={cn('mx-auto flex w-full max-w-[760px] flex-col', className)}
      {...props}
    />
  );
}

export function MessageScrollerItem({
  className,
  ...props
}: ComponentProps<'div'> & { messageId: string }) {
  const { messageId, ...elementProps } = props;
  return (
    <div
      data-message-id={messageId}
      className={cn('scroll-mt-6', className)}
      {...elementProps}
    />
  );
}

export function MessageScrollerButton() {
  const { scrollToBottom, showJumpButton } = useMessageScrollerContext();

  if (!showJumpButton) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className="absolute right-4 bottom-4 rounded-full bg-background shadow-sm"
      aria-label="Jump to latest"
      onClick={() => scrollToBottom('smooth')}
    >
      <ChevronDownIcon data-icon="inline-start" />
    </Button>
  );
}

export function Message({
  align,
  className,
  ...props
}: ComponentProps<'article'> & { align: 'start' | 'end' }) {
  return (
    <article
      className={cn(
        'flex w-full gap-3',
        align === 'end' ? 'justify-end' : 'justify-start',
        className
      )}
      {...props}
    />
  );
}

export function MessageContent({
  align,
  className,
  ...props
}: ComponentProps<'div'> & { align: 'start' | 'end' }) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-col gap-2',
        align === 'end' ? 'max-w-[82%] items-end' : 'w-full items-start',
        className
      )}
      {...props}
    />
  );
}

export function Bubble({
  align,
  className,
  variant,
  ...props
}: ComponentProps<'div'> & {
  align: 'start' | 'end';
  variant: 'ghost' | 'tinted';
}) {
  return (
    <div
      className={cn(
        'max-w-[70ch] rounded-2xl px-4 py-3 text-sm leading-6',
        variant === 'tinted'
          ? 'rounded-br-md bg-primary/15 text-foreground'
          : 'rounded-bl-md bg-muted/55 text-foreground',
        align === 'end' ? 'self-end' : 'self-start',
        className
      )}
      {...props}
    />
  );
}

export function Marker({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-3" role="separator">
      <span className="h-px flex-1 bg-border" />
      <span className="font-semibold text-muted-foreground text-xs">
        {children}
      </span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}
