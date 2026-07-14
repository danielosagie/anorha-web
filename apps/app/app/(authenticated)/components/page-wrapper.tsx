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
    <div className="flex min-h-svh w-full flex-col bg-background">
      <Header
        page={title || ''}
        onBack={onBack}
        backButtonText={backButtonText}
      />
      <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col px-4 pt-3 pb-10 md:px-8 md:pb-12 lg:px-10">
        {title && (
          <div className="mb-6 flex shrink-0 flex-col gap-1 md:mb-8">
            <h1 className="font-extrabold text-2xl tracking-[-0.025em] md:text-[1.875rem]">
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
