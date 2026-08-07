'use client';

import type { ReactNode } from 'react';
import { Header } from '../components/header';

interface PageWrapperProps {
  children: ReactNode;
  title?: string;
  description?: string;
  actions?: ReactNode;
  onBack?: () => void;
  backButtonText?: string;
}

export function PageWrapper({
  children,
  title,
  description,
  actions,
  onBack,
  backButtonText = 'Back',
}: PageWrapperProps) {
  return (
    <div className="flex min-h-svh w-full flex-col bg-background p-2">
      <div className="flex min-h-[calc(100svh-1rem)] flex-1 flex-col overflow-hidden rounded-[1.125rem] border border-border bg-background p-2">
        <Header
          page={title || ''}
          onBack={onBack}
          backButtonText={backButtonText}
        />
        <main className="flex min-h-0 flex-1 flex-col overflow-auto rounded-[0.875rem] border border-border bg-card px-4 py-5 md:px-6 md:py-6 lg:px-8 lg:py-7">
          <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col">
            {title && (
              <div className="mb-5 flex shrink-0 flex-col gap-4 border-b pb-5 md:mb-6 md:flex-row md:items-center md:justify-between md:pb-6">
                <div className="min-w-0">
                  <h1 className="font-bold text-2xl tracking-[-0.025em] md:text-[1.75rem]">
                    {title}
                  </h1>
                  {description && (
                    <p className="mt-1 max-w-[70ch] font-medium text-muted-foreground text-sm md:text-[0.9375rem]">
                      {description}
                    </p>
                  )}
                </div>
                {actions ? (
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {actions}
                  </div>
                ) : null}
              </div>
            )}
            <div className="min-h-0 flex-1">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
