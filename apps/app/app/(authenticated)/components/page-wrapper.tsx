'use client';

import { Button } from '@repo/design-system/components/ui/button';
import { SidebarTrigger } from '@repo/design-system/components/ui/sidebar';
import { ArrowLeftIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface PageWrapperProps {
  children: ReactNode;
  title?: string;
  description?: string;
  actions?: ReactNode;
  onBack?: () => void;
  backButtonText?: string;
}

/**
 * The K-0 content panel. The panel itself is the SidebarInset, so this only
 * lays out inside it: padding 32/36/40, every direct child row full width with
 * a 14px gap, and the page header carrying a 12px bottom pad of its own.
 *
 * It used to nest two more bordered panels inside the inset and put a
 * breadcrumb strip above them. The board has exactly one panel and no
 * breadcrumb: the page title is the header.
 */
export function PageWrapper({
  children,
  title,
  description,
  actions,
  onBack,
  backButtonText = 'Back',
}: PageWrapperProps) {
  return (
    <main className="flex min-h-0 flex-1 flex-col gap-[14px] overflow-auto px-5 pt-6 pb-8 md:px-9 md:pt-8 md:pb-10">
      {/*
        The board puts the actions on the title's baseline. There is no room for
        that on a phone: side by side, the buttons win the width and the title
        collapses to an ellipsis. Below md the header stacks instead.
      */}
      {(title || onBack) && (
        <header className="flex w-full shrink-0 flex-col gap-3 pb-3 md:flex-row md:items-start md:justify-between md:gap-4">
          <div className="flex min-w-0 items-start gap-2">
            <SidebarTrigger className="-ml-1 size-8 shrink-0 rounded-[var(--radius-row)] md:hidden" />
            <div className="flex min-w-0 flex-col gap-1">
              {title && (
                <h1 className="truncate font-semibold text-[22px] text-k0-ink leading-7 tracking-[-0.02em]">
                  {title}
                </h1>
              )}
              {description && (
                <p className="max-w-[70ch] text-[14px] text-k0-ink-2 leading-5">
                  {description}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:shrink-0">
            {onBack && (
              <Button variant="outline" onClick={onBack}>
                <ArrowLeftIcon data-icon="inline-start" />
                {backButtonText}
              </Button>
            )}
            {actions}
          </div>
        </header>
      )}
      {children}
    </main>
  );
}
