import { getDashboardData } from '@/lib/data/dashboard';
import { formatCurrency, formatDistanceToNow } from '@/lib/utils/format';
import { auth } from '@repo/auth/server';
import { Button } from '@repo/design-system/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/design-system/components/ui/card';
import {
  ArrowRightIcon,
  BoxesIcon,
  CalendarDaysIcon,
  PackagePlusIcon,
  PlugZapIcon,
  TrendingDownIcon,
  TrendingUpIcon,
} from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { DashboardSalesChart } from './components/dashboard-sales-chart';
import { PageWrapper } from './components/page-wrapper';
import { OrderStatus } from './orders/order-status';
import { PlatformMark } from './orders/platform-mark';

export const metadata: Metadata = {
  title: 'Dashboard | Anorha',
  description: 'Sales, orders, and stock across your connected channels.',
  icons: {
    icon: '/favicon.ico',
    apple: '/logo.png',
  },
  manifest: '/manifest.json',
};

const channelColors: Readonly<Record<string, string>> = {
  shopify: 'oklch(0.65 0.13 165)',
  amazon: 'oklch(0.68 0.15 52)',
  square: 'oklch(0.52 0.035 238)',
  clover: 'oklch(0.71 0.14 105)',
  ebay: 'oklch(0.61 0.14 20)',
  facebook: 'oklch(0.58 0.14 252)',
  other: 'oklch(0.63 0.02 100)',
};
const FALLBACK_CHANNEL_COLOR = 'oklch(0.63 0.02 100)';

function channelColor(platform: string): string {
  const normalized = platform.toLowerCase();
  return (
    Object.entries(channelColors).find(([key]) =>
      normalized.includes(key)
    )?.[1] ??
    channelColors.other ??
    FALLBACK_CHANNEL_COLOR
  );
}

function periodLabel(months: Array<{ month: string; label: string }>): string {
  const first = months[0];
  const last = months.at(-1);
  if (!first || !last) {
    return 'Last 12 months';
  }
  return `${first.label} ${first.month.slice(0, 4)} to ${last.label} ${last.month.slice(0, 4)}`;
}

export default async function DashboardPage() {
  const { userId, orgId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  const data = await getDashboardData({
    clerkUserId: userId,
    clerkOrgId: orgId ?? null,
  });
  const maxChannelRevenue = Math.max(
    ...data.channelRevenue.map((channel) => channel.revenue),
    1
  );
  const change = data.revenueChangePercent;

  return (
    <PageWrapper
      title="Dashboard"
      description="Sales, orders, inventory, and connected channels."
      actions={
        <>
          <Button asChild variant="outline">
            <Link href="/connections">
              <PlugZapIcon data-icon="inline-start" />
              Connections
            </Link>
          </Button>
          <Button asChild>
            <Link href="/products/new">
              <PackagePlusIcon data-icon="inline-start" />
              Add product
            </Link>
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-[14px]">
        {data.loadError ? (
          <div className="rounded-xl border border-warning/25 bg-warning/8 px-4 py-3 text-sm">
            <p className="font-semibold">
              Some workspace data is still loading.
            </p>
            <p className="mt-0.5 text-muted-foreground">{data.loadError}</p>
          </div>
        ) : null}

        <section
          aria-label="Sales overview"
          className="grid gap-[14px] xl:grid-cols-[minmax(0,1.7fr)_minmax(19rem,0.8fr)]"
        >
          <Card className="gap-0 overflow-hidden py-0">
            <CardHeader className="border-b px-5 py-5 md:px-6">
              <div>
                <CardTitle>Sales overview</CardTitle>
                <CardDescription>
                  {periodLabel(data.monthlyRevenue)}
                </CardDescription>
              </div>
              <CardAction>
                <span className="inline-flex h-9 items-center gap-2 rounded-full border bg-card px-3 font-medium text-muted-foreground text-xs">
                  <CalendarDaysIcon className="size-3.5" aria-hidden />
                  12 months
                </span>
              </CardAction>
            </CardHeader>
            <CardContent className="px-0">
              <div className="grid divide-y border-b sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                <div className="px-5 py-4 md:px-6">
                  <p className="text-muted-foreground text-xs">Total sales</p>
                  <p className="mt-1 font-bold text-2xl tabular-nums tracking-tight">
                    {formatCurrency(data.salesLastTwelveMonths)}
                  </p>
                </div>
                <div className="px-5 py-4 md:px-6">
                  <p className="text-muted-foreground text-xs">This month</p>
                  <p className="mt-1 font-bold text-xl tabular-nums">
                    {formatCurrency(data.revenue)}
                  </p>
                  {change === null ? (
                    <p className="mt-1 text-muted-foreground text-xs">
                      First month of comparison
                    </p>
                  ) : (
                    <p
                      className={
                        change >= 0
                          ? 'mt-1 inline-flex items-center gap-1 font-medium text-success text-xs'
                          : 'mt-1 inline-flex items-center gap-1 font-medium text-destructive text-xs'
                      }
                    >
                      {change >= 0 ? (
                        <TrendingUpIcon className="size-3.5" aria-hidden />
                      ) : (
                        <TrendingDownIcon className="size-3.5" aria-hidden />
                      )}
                      {Math.abs(change).toFixed(1)}% from last month
                    </p>
                  )}
                </div>
                <div className="px-5 py-4 md:px-6">
                  <p className="text-muted-foreground text-xs">
                    Orders this month
                  </p>
                  <p className="mt-1 font-bold text-xl tabular-nums">
                    {data.orderCount.toLocaleString()}
                  </p>
                  <p className="mt-1 text-muted-foreground text-xs">
                    Across connected channels
                  </p>
                </div>
              </div>
              <div className="px-2 pt-4 pb-3 sm:px-4">
                <DashboardSalesChart points={data.monthlyRevenue} />
              </div>
            </CardContent>
          </Card>

          <Card className="gap-0 overflow-hidden py-0">
            <CardHeader className="border-b px-5 py-5">
              <CardTitle>Sales by channel</CardTitle>
              <CardDescription>Last 12 months</CardDescription>
            </CardHeader>
            <CardContent className="px-5 py-5">
              {data.channelRevenue.length === 0 ? (
                <div className="flex min-h-56 flex-col items-center justify-center text-center">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <PlugZapIcon className="size-5" aria-hidden />
                  </span>
                  <p className="mt-3 font-semibold text-sm">
                    No channel sales yet
                  </p>
                  <p className="mt-1 max-w-56 text-muted-foreground text-xs">
                    New orders will appear here after a connected channel syncs.
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {data.channelRevenue.slice(0, 6).map((channel) => (
                    <div key={channel.platform}>
                      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                        <span className="font-semibold">{channel.label}</span>
                        <span className="text-muted-foreground tabular-nums">
                          {formatCurrency(channel.revenue)}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full min-w-1 rounded-full"
                          style={{
                            backgroundColor: channelColor(channel.platform),
                            width: `${Math.max(3, (channel.revenue / maxChannelRevenue) * 100)}%`,
                          }}
                        />
                      </div>
                      <p className="mt-1.5 text-muted-foreground text-xs tabular-nums">
                        {channel.orders.toLocaleString()} orders
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-[14px] xl:grid-cols-[minmax(0,1.7fr)_minmax(19rem,0.8fr)]">
          <Card className="gap-0 overflow-hidden py-0">
            <CardHeader className="border-b px-5 py-5 md:px-6">
              <CardTitle>Recent orders</CardTitle>
              <CardDescription>Latest sales from every channel</CardDescription>
              <CardAction>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/orders">
                    View all
                    <ArrowRightIcon data-icon="inline-end" />
                  </Link>
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="px-0">
              {data.recentOrders.length === 0 ? (
                <div className="flex min-h-48 flex-col items-center justify-center px-5 text-center">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <BoxesIcon className="size-5" aria-hidden />
                  </span>
                  <p className="mt-3 font-semibold text-sm">No orders yet</p>
                  <p className="mt-1 text-muted-foreground text-xs">
                    Connect a channel to bring recent orders into Anorha.
                  </p>
                </div>
              ) : (
                <div className="divide-y">
                  {data.recentOrders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/orders/${order.id}`}
                      className="grid min-h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-5 py-3 outline-none transition-colors hover:bg-muted/45 focus-visible:bg-muted/45 md:grid-cols-[auto_minmax(0,1fr)_auto_auto] md:px-6"
                    >
                      <PlatformMark
                        platform={order.platform}
                        showName={false}
                      />
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-sm">
                          Order #{order.orderNumber}
                        </span>
                        <span className="block text-muted-foreground text-xs">
                          {order.platformName} ·{' '}
                          {formatDistanceToNow(new Date(order.orderDate))}
                        </span>
                      </span>
                      <span className="hidden md:block">
                        <OrderStatus status={order.status} />
                      </span>
                      <span className="font-semibold text-sm tabular-nums">
                        {formatCurrency(order.totalAmount, order.currency)}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="gap-0 overflow-hidden py-0">
            <CardHeader className="border-b px-5 py-5">
              <CardTitle>Connections</CardTitle>
              <CardDescription>
                {data.connections.length.toLocaleString()} active account
                {data.connections.length === 1 ? '' : 's'}
              </CardDescription>
              <CardAction>
                <Button asChild variant="outline" size="sm">
                  <Link href="/connections">Manage</Link>
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="px-0">
              {data.connections.length === 0 ? (
                <div className="flex min-h-48 flex-col items-center justify-center px-5 text-center">
                  <p className="font-semibold text-sm">
                    Connect your first shop
                  </p>
                  <p className="mt-1 max-w-56 text-muted-foreground text-xs">
                    Keep orders and inventory in one calm workspace.
                  </p>
                  <Button asChild className="mt-4" size="sm">
                    <Link href="/connections">Add connection</Link>
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  {data.connections.slice(0, 6).map((connection) => (
                    <div
                      key={connection.id}
                      className="flex min-h-16 items-center gap-3 px-5 py-3"
                    >
                      <PlatformMark
                        platform={connection.platform}
                        showName={false}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-sm">
                          {connection.name}
                        </span>
                        <span className="block text-muted-foreground text-xs">
                          {connection.productCount.toLocaleString()} product
                          {connection.productCount === 1 ? '' : 's'} synced
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-muted-foreground text-xs">
                        <span className="size-1.5 rounded-full bg-success" />
                        Live
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="inventory-health-heading">
          <div className="grid overflow-hidden rounded-[1.125rem] border bg-card sm:grid-cols-3 sm:divide-x">
            <div className="border-b px-5 py-4 sm:border-b-0">
              <p
                id="inventory-health-heading"
                className="text-muted-foreground text-xs"
              >
                Inventory value
              </p>
              <p className="mt-1 font-bold text-lg tabular-nums">
                {formatCurrency(data.inventoryValue)}
              </p>
            </div>
            <div className="border-b px-5 py-4 sm:border-b-0">
              <p className="text-muted-foreground text-xs">Units in stock</p>
              <p className="mt-1 font-bold text-lg tabular-nums">
                {data.inventoryUnits.toLocaleString()}
              </p>
            </div>
            <Link
              href="/inventory"
              className="group flex min-h-20 items-center justify-between gap-3 px-5 py-4 outline-none transition-colors hover:bg-muted/45 focus-visible:bg-muted/45"
            >
              <span>
                <span className="block font-semibold text-sm">
                  Review inventory
                </span>
                <span className="mt-0.5 block text-muted-foreground text-xs">
                  Prices, stock, and locations
                </span>
              </span>
              <ArrowRightIcon
                className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          </div>
        </section>

        {data.recentActivity.length > 0 ? (
          <section
            aria-labelledby="activity-heading"
            className="flex flex-col gap-3"
          >
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="font-bold text-muted-foreground text-xs uppercase tracking-[0.1em]">
                  Workspace
                </p>
                <h2 id="activity-heading" className="mt-1 font-bold text-lg">
                  Recent activity
                </h2>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/activity">View all</Link>
              </Button>
            </div>
            <div className="divide-y overflow-hidden rounded-[1.125rem] border bg-card">
              {data.recentActivity.slice(0, 3).map((event) => (
                <div
                  key={event.id}
                  className="flex min-h-14 items-center gap-3 px-4 py-3 md:px-5"
                >
                  {event.platform ? (
                    <PlatformMark platform={event.platform} showName={false} />
                  ) : (
                    <span className="flex size-8 items-center justify-center rounded-lg bg-muted">
                      <BoxesIcon
                        className="size-4 text-muted-foreground"
                        aria-hidden
                      />
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-sm">
                      {event.title}
                    </span>
                    <span className="block truncate text-muted-foreground text-xs">
                      {event.subject}
                    </span>
                  </span>
                  <time className="shrink-0 text-muted-foreground text-xs">
                    {formatDistanceToNow(new Date(event.timestamp))}
                  </time>
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </PageWrapper>
  );
}
