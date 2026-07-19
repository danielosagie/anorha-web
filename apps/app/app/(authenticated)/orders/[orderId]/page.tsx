import { getOrder } from '@/lib/data/orders';
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
import { ArrowLeftIcon } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { PageWrapper } from '../../components/page-wrapper';
import { OrderStatus } from '../order-status';
import { PlatformMark } from '../platform-mark';

export const metadata: Metadata = {
  title: 'Order | Anorha',
};

export default async function OrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const [{ userId, orgId }, { orderId }] = await Promise.all([auth(), params]);
  if (!userId) {
    redirect('/sign-in');
  }

  const result = await getOrder(
    { clerkUserId: userId, clerkOrgId: orgId ?? null },
    orderId
  );
  if (!result.order && !result.loadError) {
    notFound();
  }

  if (!result.order) {
    return (
      <PageWrapper title="Order" description="Data unavailable.">
        <Card>
          <CardHeader>
            <CardTitle>Could not load</CardTitle>
            <CardDescription>{result.loadError}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link href="/orders">
                <ArrowLeftIcon data-icon="inline-start" />
                Orders
              </Link>
            </Button>
          </CardContent>
        </Card>
      </PageWrapper>
    );
  }

  const order = result.order;
  return (
    <PageWrapper
      title={`Order #${order.orderNumber}`}
      description="Order details."
    >
      <div className="flex flex-col gap-5">
        <Button asChild variant="ghost" className="self-start">
          <Link href="/orders">
            <ArrowLeftIcon data-icon="inline-start" />
            Orders
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription>
              {new Intl.DateTimeFormat('en-US', {
                dateStyle: 'medium',
                timeStyle: 'short',
              }).format(new Date(order.orderDate))}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col gap-1">
                <dt className="text-muted-foreground text-sm">Channel</dt>
                <dd className="font-semibold">
                  <PlatformMark platform={order.platform} />
                </dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-muted-foreground text-sm">Status</dt>
                <dd>
                  <OrderStatus status={order.status} />
                </dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-muted-foreground text-sm">Customer</dt>
                <dd className="truncate font-semibold">
                  {order.customerEmail ?? 'Not recorded'}
                </dd>
              </div>
              <div className="flex flex-col gap-1">
                <dt className="text-muted-foreground text-sm">Total</dt>
                <dd className="font-bold text-xl tabular-nums">
                  {formatCurrency(order.totalAmount, order.currency)}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card className="gap-0 overflow-hidden py-0">
          <CardHeader className="border-b py-5">
            <CardTitle>Line items</CardTitle>
            <CardDescription>
              {order.itemCount === null
                ? result.loadError
                : `${order.itemCount} units`}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            {order.items.length === 0 ? (
              <p className="px-6 py-10 text-center text-muted-foreground text-sm">
                No line items.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-5">Item</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="pr-5 text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="max-w-80 truncate pl-5 font-semibold">
                        {item.title}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.sku}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(item.price, order.currency)}
                      </TableCell>
                      <TableCell className="pr-5 text-right font-semibold tabular-nums">
                        {formatCurrency(item.total, order.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
}
