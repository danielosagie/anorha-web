'use client';

import type { ReactNode } from 'react';
import { Header } from '../components/header';

interface PageWrapperProps {
  children: ReactNode;
  title?: string;
  description?: string;
  onBack?: () => void;
  backButtonText?: string;
}

export function PageWrapper({
  children,
  title,
  description,
  onBack,
  backButtonText = 'Back',
}: PageWrapperProps) {
  return (
    <div className="flex min-h-[calc(100svh-1rem)] w-full flex-col bg-card">
      <Header
        page={title || ''}
        onBack={onBack}
        backButtonText={backButtonText}
      />
      <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col px-4 pt-4 pb-10 md:px-7 md:pt-5 md:pb-12 lg:px-8">
        {title && (
          <div className="mb-5 flex shrink-0 flex-col gap-1 md:mb-6">
            <h1 className="font-bold text-2xl tracking-[-0.025em] md:text-[1.75rem]">
              {title}
            </h1>
            {description && (
              <p className="max-w-[70ch] font-medium text-muted-foreground text-sm md:text-[0.9375rem]">
                {description}
              </p>
            )}
          </div>
        )}
        <div className="min-h-0 flex-1">{children}</div>
      </main>
    </div>
  );
}
