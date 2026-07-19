'use client';

import { Button } from '@repo/design-system/components/ui/button';
import { Textarea } from '@repo/design-system/components/ui/textarea';
import { ArrowUpIcon } from 'lucide-react';
import type { FormEvent, KeyboardEvent } from 'react';

type ComposerProps = {
  disabled: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
  value: string;
};

export function Composer({
  disabled,
  onChange,
  onSend,
  value,
}: ComposerProps) {
  const canSend = value.trim().length > 0 && !disabled;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (canSend) {
      onSend();
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (canSend) {
        onSend();
      }
    }
  };

  return (
    <div className="sticky bottom-0 shrink-0 border-t border-border bg-background/95 px-3 py-3 md:px-5 md:py-4">
      <form
        className="mx-auto flex w-full max-w-[760px] items-end gap-2 rounded-2xl border border-input bg-card p-2 shadow-sm focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50"
        onSubmit={submit}
      >
        <label className="sr-only" htmlFor="sprout-message">
          Message Sprout
        </label>
        <Textarea
          id="sprout-message"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Sprout"
          rows={1}
          className="max-h-40 min-h-11 resize-none border-0 bg-transparent px-3 py-2.5 shadow-none focus-visible:border-transparent focus-visible:ring-0"
        />
        <Button
          type="submit"
          size="icon"
          className="shrink-0 rounded-full"
          disabled={!canSend}
          aria-label="Send message"
        >
          <ArrowUpIcon data-icon="inline-start" />
        </Button>
      </form>
    </div>
  );
}
