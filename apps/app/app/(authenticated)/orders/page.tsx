import { getOrders } from '@/lib/data/orders';
import { formatCurrency } from '@/lib/utils/format';
import { auth } from '@repo/auth/server';
import { Button } from '@repo/design-system/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/design-system/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/design-system/components/ui/table';
import { ArrowLeftIcon, ArrowRightIcon, ReceiptTextIcon } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { PageWrapper } from '../components/page-wrapper';
import { OrderStatus } from './order-status';
import { OrdersFilters } from './orders-filters';
import { PlatformMark } from './platform-mark';

export const metadata: Metadata = {
  title: 'Orders | Anorha',
  description: 'Sales across connected channels.',
};

type SearchParams = {
  platform?: string;
  status?: string;
  start?: string;
  end?: string;
  page?: string;
};

function pageHref(params: SearchParams, page: number): string {
  const query = new URLSearchParams();
  if (params.platform) {
    query.set('platform', params.platform);
  }
  if (params.status) {
    query.set('status', params.status);
  }
  if (params.start) {
    query.set('start', params.start);
  }
  if (params.end) {
    query.set('end', params.end);
  }
  if (page > 1) {
    query.set('page', String(page));
  }
  const value = query.toString();
  return value ? `/orders?${value}` : '/orders';
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const [{ userId, orgId }, params] = await Promise.all([auth(), searchParams]);
  if (!userId) {
    redirect('/sign-in');
  }

  const requestedPage = Math.max(
    1,
    Number.parseInt(params.page ?? '1', 10) || 1
  );
  const data = await getOrders(
    { clerkUserId: userId, clerkOrgId: orgId ?? null },
    {
      platform: params.platform,
      status: params.status,
      startDate: params.start,
      endDate: params.end,
      page: requestedPage,
      pageSize: 25,
    }
  );
  const hasNextPage = data.page * data.pageSize < data.total;

  return (
    <PageWrapper title="Orders" description="Sales across connected channels.">
      <div className="flex flex-col gap-5">
        <OrdersFilters
          platforms={data.platforms}
          statuses={data.statuses}
          initial={{
            platform: params.platform ?? '',
            status: params.status ?? '',
            startDate: params.start ?? '',
            endDate: params.end ?? '',
          }}
        />

        {data.loadError ? (
          <Card>
            <CardHeader>
              <CardTitle>Data unavailable</CardTitle>
              <CardDescription>{data.loadError}</CardDescription>
            </CardHeader>
          </Card>
        ) : data.orders.length === 0 ? (
          <Card>
            <CardHeader className="items-center py-12 text-center">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <ReceiptTextIcon className="size-5" aria-hidden />
              </span>
              <CardTitle>No orders</CardTitle>
              <CardDescription>Connected sales appear here.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <Card className="gap-0 overflow-hidden py-0">
            <CardHeader className="border-b py-5">
              <CardTitle>Order history</CardTitle>
              <CardDescription>
                {data.total.toLocaleString()} orders
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-5">Order</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="pr-5 text-right">
                      <span className="sr-only">View</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="pl-5 font-semibold">
                        <Link
                          href={`/orders/${order.id}`}
                          className="rounded-sm outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          #{order.orderNumber}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(order.orderDate)}
                      </TableCell>
                      <TableCell>
                        <PlatformMark platform={order.platform} />
                      </TableCell>
                      <TableCell>
                        {order.itemCount === null
                          ? 'Not available'
                          : order.itemCount}
                      </TableCell>
                      <TableCell>
                        <OrderStatus status={order.status} />
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">
                        {formatCurrency(order.totalAmount, order.currency)}
                      </TableCell>
                      <TableCell className="pr-5 text-right">
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/orders/${order.id}`}>
                            View
                            <ArrowRightIcon data-icon="inline-end" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {data.total > data.pageSize ? (
          <nav
            className="flex items-center justify-between"
            aria-label="Orders pages"
          >
            <p className="text-muted-foreground text-sm tabular-nums">
              Page {data.page}
            </p>
            <div className="flex items-center gap-2">
              <Button
                asChild
                variant="outline"
                size="sm"
                disabled={data.page <= 1}
              >
                <Link
                  href={pageHref(params, Math.max(1, data.page - 1))}
                  aria-disabled={data.page <= 1}
                  tabIndex={data.page <= 1 ? -1 : undefined}
                >
                  <ArrowLeftIcon data-icon="inline-start" />
                  Previous
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                disabled={!hasNextPage}
              >
                <Link
                  href={pageHref(params, data.page + 1)}
                  aria-disabled={!hasNextPage}
                  tabIndex={hasNextPage ? undefined : -1}
                >
                  Next
                  <ArrowRightIcon data-icon="inline-end" />
                </Link>
              </Button>
            </div>
          </nav>
        ) : null}
      </div>
    </PageWrapper>
  );
}
