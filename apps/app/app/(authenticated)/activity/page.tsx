import {
  type ActivityCategory,
  type ActivityRecord,
  getActivityData,
} from '@/lib/data/activity';
import { formatCurrency } from '@/lib/utils/format';
import { auth } from '@repo/auth/server';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/design-system/components/ui/card';
import {
  AlertCircleIcon,
  CircleIcon,
  PackageIcon,
  RefreshCwIcon,
  ShoppingBagIcon,
  SquarePenIcon,
} from 'lucide-react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { PageWrapper } from '../components/page-wrapper';
import { PlatformMark } from '../orders/platform-mark';
import { ActivityFilter } from './activity-filter';

export const metadata: Metadata = {
  title: 'Activity | Anorha',
  description: 'Orders, stock, and product updates.',
};

const validCategories = new Set<ActivityCategory>([
  'order',
  'inventory',
  'product',
  'sync',
  'error',
  'other',
]);

function getDateLabel(timestamp: string): string {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const key = date.toLocaleDateString('en-US');
  if (key === today.toLocaleDateString('en-US')) {
    return 'Today';
  }
  if (key === yesterday.toLocaleDateString('en-US')) {
    return 'Yesterday';
  }
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function EventIcon({ category }: { category: ActivityCategory }) {
  if (category === 'order') {
    return <ShoppingBagIcon aria-hidden />;
  }
  if (category === 'inventory') {
    return <PackageIcon aria-hidden />;
  }
  if (category === 'product') {
    return <SquarePenIcon aria-hidden />;
  }
  if (category === 'sync') {
    return <RefreshCwIcon aria-hidden />;
  }
  if (category === 'error') {
    return <AlertCircleIcon aria-hidden />;
  }
  return <CircleIcon aria-hidden />;
}

function ActivityRow({ event }: { event: ActivityRecord }) {
  return (
    <article className="grid grid-cols-[auto_minmax(0,1fr)_auto] gap-3 px-4 py-4 md:px-5">
      <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground [&>svg]:size-4">
        <EventIcon category={event.category} />
      </span>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className="font-semibold text-sm">{event.title}</h3>
          <time className="text-muted-foreground text-xs">
            {new Intl.DateTimeFormat('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            }).format(new Date(event.timestamp))}
          </time>
        </div>
        <p className="mt-0.5 truncate text-sm">{event.subject}</p>
        {event.detail ? (
          <p className="mt-1 line-clamp-2 text-muted-foreground text-xs">
            {event.detail}
          </p>
        ) : null}
      </div>
      <div className="flex items-start gap-3">
        {event.amount !== null && event.amount > 0 ? (
          <span className="hidden font-semibold text-sm tabular-nums sm:block">
            {formatCurrency(event.amount)}
          </span>
        ) : null}
        {event.platform ? (
          <PlatformMark platform={event.platform} showName={false} />
        ) : null}
      </div>
    </article>
  );
}

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const [{ userId, orgId }, params] = await Promise.all([auth(), searchParams]);
  if (!userId) {
    redirect('/sign-in');
  }
  const category =
    params.type && validCategories.has(params.type as ActivityCategory)
      ? (params.type as ActivityCategory)
      : undefined;
  const data = await getActivityData(
    { clerkUserId: userId, clerkOrgId: orgId ?? null },
    { category, limit: 100 }
  );
  const groups = new Map<string, ActivityRecord[]>();
  for (const event of data.events) {
    const label = getDateLabel(event.timestamp);
    groups.set(label, [...(groups.get(label) ?? []), event]);
  }

  return (
    <PageWrapper
      title="Activity"
      description="Orders, stock, and product updates."
    >
      <div className="flex flex-col gap-5">
        <div className="flex justify-end">
          <ActivityFilter
            categories={data.categories}
            value={category ?? 'all'}
          />
        </div>

        {data.loadError && data.events.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Data unavailable</CardTitle>
              <CardDescription>{data.loadError}</CardDescription>
            </CardHeader>
          </Card>
        ) : data.events.length === 0 ? (
          <Card>
            <CardHeader className="items-center py-12 text-center">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <RefreshCwIcon className="size-5" aria-hidden />
              </span>
              <CardTitle>No activity</CardTitle>
              <CardDescription>Updates appear here.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="flex flex-col gap-6">
            {Array.from(groups.entries()).map(([label, events]) => (
              <section key={label} aria-labelledby={`activity-${label}`}>
                <h2
                  id={`activity-${label}`}
                  className="mb-2 font-bold text-muted-foreground text-xs uppercase tracking-[0.1em]"
                >
                  {label}
                </h2>
                <div className="divide-y rounded-2xl border bg-card">
                  {events.map((event) => (
                    <ActivityRow key={event.id} event={event} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
