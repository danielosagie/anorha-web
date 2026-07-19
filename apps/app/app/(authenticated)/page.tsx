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
  MessageCircleMoreIcon,
  PackagePlusIcon,
  PlugZapIcon,
  UsersIcon,
} from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PageWrapper } from './components/page-wrapper';
import { TestFlightBanner } from './components/testflight-banner';
import { OrderStatus } from './orders/order-status';
import { PlatformMark } from './orders/platform-mark';

export const metadata: Metadata = {
  title: 'Today | Anorha',
  description: 'Live sales and stock.',
  icons: {
    icon: '/favicon.ico',
    apple: '/logo.png',
  },
  manifest: '/manifest.json',
};

const workspaceActions = [
  {
    title: 'Review inventory',
    description: 'Stock and listings.',
    href: '/inventory',
    icon: BoxesIcon,
  },
  {
    title: 'Connect channel',
    description: 'Add a sales source.',
    href: '/settings',
    icon: PlugZapIcon,
  },
  {
    title: 'Manage team',
    description: 'Members and access.',
    href: '/team',
    icon: UsersIcon,
  },
] as const;

export default async function DashboardPage() {
  const { userId, orgId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }
  const data = await getDashboardData({
    clerkUserId: userId,
    clerkOrgId: orgId ?? null,
  });

  return (
    <PageWrapper title="Today" description="Live sales and stock.">
      <div className="flex flex-col gap-8">
        <section aria-labelledby="summary-heading">
          <Card className="gap-0 overflow-hidden py-0">
            <CardHeader className="border-b py-5">
              <CardTitle id="summary-heading">This month</CardTitle>
              <CardDescription>Current workspace</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-0 px-0 sm:grid-cols-3">
              <div className="flex flex-col gap-1 border-b px-5 py-5 sm:border-r sm:border-b-0">
                <span className="text-muted-foreground text-sm">Revenue</span>
                <strong className="font-bold text-2xl tabular-nums">
                  {formatCurrency(data.revenue)}
                </strong>
              </div>
              <div className="flex flex-col gap-1 border-b px-5 py-5 sm:border-r sm:border-b-0">
                <span className="text-muted-foreground text-sm">Orders</span>
                <strong className="font-bold text-2xl tabular-nums">
                  {data.orderCount.toLocaleString()}
                </strong>
              </div>
              <div className="flex flex-col gap-1 px-5 py-5">
                <span className="text-muted-foreground text-sm">Inventory</span>
                <strong className="font-bold text-2xl tabular-nums">
                  {formatCurrency(data.inventoryValue)}
                </strong>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {data.inventoryUnits.toLocaleString()} units
                </span>
              </div>
            </CardContent>
          </Card>
          {data.loadError ? (
            <p className="mt-2 text-muted-foreground text-xs">
              {data.loadError}
            </p>
          ) : null}
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <Card className="gap-0 overflow-hidden py-0">
            <CardHeader className="border-b py-5">
              <CardTitle>Recent orders</CardTitle>
              <CardDescription>Latest sales</CardDescription>
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
                <p className="px-5 py-10 text-center text-muted-foreground text-sm">
                  No orders yet.
                </p>
              ) : (
                <div className="divide-y">
                  {data.recentOrders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/orders/${order.id}`}
                      className="flex items-center gap-3 px-5 py-4 outline-none transition-colors hover:bg-muted/60 focus-visible:bg-muted/60"
                    >
                      <PlatformMark
                        platform={order.platform}
                        showName={false}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-sm">
                          #{order.orderNumber}
                        </span>
                        <span className="block text-muted-foreground text-xs">
                          {formatDistanceToNow(new Date(order.orderDate))}
                        </span>
                      </span>
                      <OrderStatus status={order.status} />
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
            <CardHeader className="border-b py-5">
              <CardTitle>Recent activity</CardTitle>
              <CardDescription>Latest changes</CardDescription>
              <CardAction>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/activity">
                    View all
                    <ArrowRightIcon data-icon="inline-end" />
                  </Link>
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="px-0">
              {data.recentActivity.length === 0 ? (
                <p className="px-5 py-10 text-center text-muted-foreground text-sm">
                  No activity yet.
                </p>
              ) : (
                <div className="divide-y">
                  {data.recentActivity.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center gap-3 px-5 py-4"
                    >
                      {event.platform ? (
                        <PlatformMark
                          platform={event.platform}
                          showName={false}
                        />
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
                      <time className="text-muted-foreground text-xs">
                        {formatDistanceToNow(new Date(event.timestamp))}
                      </time>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section
          className="flex flex-col gap-4"
          aria-labelledby="quick-heading"
        >
          <div>
            <p className="font-bold text-muted-foreground text-xs uppercase tracking-[0.1em]">
              Quick actions
            </p>
            <h2 id="quick-heading" className="mt-1 font-bold text-lg">
              Keep moving
            </h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-accent-foreground">
                  <PackagePlusIcon className="size-5" aria-hidden />
                </span>
                <CardTitle>Add product</CardTitle>
                <CardDescription>Photo, review, publish.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href="/inventory">
                    Open inventory
                    <ArrowRightIcon data-icon="inline-end" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <span className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <MessageCircleMoreIcon className="size-5" aria-hidden />
                </span>
                <CardTitle>Plan clearout</CardTitle>
                <CardDescription>Use Sprout on mobile.</CardDescription>
              </CardHeader>
            </Card>
          </div>

          <Card className="gap-0 overflow-hidden py-0">
            {workspaceActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="group flex min-h-20 items-center gap-4 border-b px-4 py-4 outline-none transition-colors last:border-b-0 hover:bg-muted/60 focus-visible:bg-muted/60 md:px-5"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors group-hover:bg-primary/15 group-hover:text-accent-foreground">
                  <action.icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-sm">
                    {action.title}
                  </span>
                  <span className="mt-0.5 block text-muted-foreground text-sm">
                    {action.description}
                  </span>
                </span>
                <ArrowRightIcon
                  className="size-4 text-muted-foreground"
                  aria-hidden
                />
              </Link>
            ))}
          </Card>
        </section>

        <TestFlightBanner />
      </div>
    </PageWrapper>
  );
}
