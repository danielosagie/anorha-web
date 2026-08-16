'use client';

import { BudgetNotice } from '@repo/design-system/components/intake/budget-notice';
import { SellerIdentity } from '@repo/design-system/components/intake/seller-identity';
import type {
  BudgetFailure,
  PublicIntakeLink,
} from '@repo/design-system/components/intake/types';
import { Button } from '@repo/design-system/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/design-system/components/ui/card';
import { Skeleton } from '@repo/design-system/components/ui/skeleton';
import { useParams } from 'next/navigation';
import { type ReactNode, useCallback, useEffect, useState } from 'react';
import { IntakeForm } from './intake-form';

type PageState =
  | { kind: 'loading' }
  | { kind: 'ready'; link: PublicIntakeLink }
  | { kind: 'unavailable' }
  | { kind: 'budget'; failure: BudgetFailure }
  | { kind: 'error' };

function isBudgetFailure(value: unknown): value is BudgetFailure {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as Partial<BudgetFailure>;
  return (
    typeof candidate.code === 'string' &&
    typeof candidate.budget === 'string' &&
    typeof candidate.limit === 'number' &&
    typeof candidate.unit === 'string' &&
    typeof candidate.ask === 'string'
  );
}

function PageFrame({ children }: { children: ReactNode }) {
  return (
    <div className="anorha-intake-page anorha-intake-theme min-h-svh bg-background font-sans text-foreground">
      <main className="mx-auto flex min-h-svh w-full max-w-3xl flex-col gap-8 px-4 py-6 sm:px-6 sm:py-10">
        <div className="font-semibold text-sm tracking-tight">anorha</div>
        {children}
      </main>
    </div>
  );
}

export function PublicIntakePage() {
  const params = useParams<{ token: string }>();
  const [state, setState] = useState<PageState>({ kind: 'loading' });

  const load = useCallback(async () => {
    setState({ kind: 'loading' });
    let response: Response;
    try {
      response = await fetch(`/api/x/${encodeURIComponent(params.token)}`, {
        cache: 'no-store',
      });
    } catch {
      setState({ kind: 'error' });
      return;
    }

    if (response.status === 404) {
      setState({ kind: 'unavailable' });
      return;
    }
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      setState(
        isBudgetFailure(body)
          ? { kind: 'budget', failure: body }
          : { kind: 'error' }
      );
      return;
    }

    if (!body || typeof body !== 'object') {
      setState({ kind: 'error' });
      return;
    }
    setState({ kind: 'ready', link: body as PublicIntakeLink });
  }, [params.token]);

  useEffect(() => {
    load().catch(() => setState({ kind: 'error' }));
  }, [load]);

  if (state.kind === 'loading') {
    return (
      <PageFrame>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-8 w-40" />
        </div>
        <Skeleton className="h-[34rem] w-full rounded-[1.125rem]" />
      </PageFrame>
    );
  }

  if (state.kind === 'unavailable') {
    return (
      <PageFrame>
        <Card>
          <CardHeader>
            <CardTitle>Intake unavailable</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              Ask the seller for a current link.
            </p>
          </CardContent>
        </Card>
      </PageFrame>
    );
  }

  if (state.kind === 'error') {
    return (
      <PageFrame>
        <Card>
          <CardHeader>
            <CardTitle>Could not load</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={load} type="button" variant="outline">
              Try again
            </Button>
          </CardContent>
        </Card>
      </PageFrame>
    );
  }

  if (state.kind === 'budget') {
    return (
      <PageFrame>
        <BudgetNotice failure={state.failure} />
      </PageFrame>
    );
  }

  return (
    <PageFrame>
      <SellerIdentity
        accepting={state.link.accepting}
        displayName={state.link.seller.displayName}
        locationLabel={state.link.seller.locationLabel}
        logoUrl={state.link.seller.logoUrl}
      />
      <div className="flex flex-col gap-6">
        <h1 className="max-w-xl font-bold text-3xl tracking-tight sm:text-4xl">
          Send your items
        </h1>
        {state.link.accepting ? (
          <IntakeForm mediaPolicy={state.link.mediaPolicy} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Not accepting</CardTitle>
            </CardHeader>
          </Card>
        )}
      </div>
    </PageFrame>
  );
}
