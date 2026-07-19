import { type AnalyticsRange, getAnalyticsData } from '@/lib/data/analytics';
import {
  formatCurrency,
  formatNumber,
  formatPercent,
} from '@/lib/utils/format';
import { auth } from '@repo/auth/server';
import { Badge } from '@repo/design-system/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/design-system/components/ui/card';
import { Progress } from '@repo/design-system/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/design-system/components/ui/table';
import { BarChart3Icon } from 'lucide-react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { PageWrapper } from '../components/page-wrapper';
import { PlatformMark } from '../orders/platform-mark';
import { RangeToggle } from './components/range-toggle';
import { RevenueChart } from './components/revenue-chart';

export const metadata: Metadata = {
  title: 'Analytics | Anorha',
  description: 'Sales by time, channel, and product.',
};

const ranges = new Set<AnalyticsRange>(['7d', '30d', '90d', '1y']);

function Trend({ value }: { value: number | null }) {
  if (value === null) {
    return <Badge variant="outline">No prior data</Badge>;
  }
  return (
    <Badge variant={value < 0 ? 'destructive' : 'secondary'}>
      {formatPercent(value)}
    </Badge>
  );
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const [{ userId, orgId }, params] = await Promise.all([auth(), searchParams]);
  if (!userId) {
    redirect('/sign-in');
  }
  const range =
    params.range && ranges.has(params.range as AnalyticsRange)
      ? (params.range as AnalyticsRange)
      : '30d';
  const data = await getAnalyticsData(
    { clerkUserId: userId, clerkOrgId: orgId ?? null },
    range
  );

  return (
    <PageWrapper
      title="Analytics"
      description="Sales by time, channel, and product."
    >
      <div className="flex flex-col gap-6">
        <div className="flex justify-end">
          <RangeToggle value={range} />
        </div>

        {data.loadError ? (
          <Card>
            <CardHeader>
              <CardTitle>Data unavailable</CardTitle>
              <CardDescription>{data.loadError}</CardDescription>
            </CardHeader>
          </Card>
        ) : data.metrics.totalOrders === 0 ? (
          <Card>
            <CardHeader className="items-center py-14 text-center">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <BarChart3Icon className="size-5" aria-hidden />
              </span>
              <CardTitle>No sales data</CardTitle>
              <CardDescription>Orders appear after sync.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <>
            <Card className="gap-0 overflow-hidden py-0">
              <CardHeader className="border-b py-5">
                <CardTitle>Performance</CardTitle>
                <CardDescription>Previous period</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-0 px-0 sm:grid-cols-3">
                <div className="flex flex-col gap-2 border-b px-5 py-5 sm:border-r sm:border-b-0">
                  <span className="text-muted-foreground text-sm">Revenue</span>
                  <strong className="font-bold text-2xl tabular-nums">
                    {formatCurrency(data.metrics.totalRevenue)}
                  </strong>
                  <Trend value={data.metrics.trends.revenue} />
                </div>
                <div className="flex flex-col gap-2 border-b px-5 py-5 sm:border-r sm:border-b-0">
                  <span className="text-muted-foreground text-sm">Orders</span>
                  <strong className="font-bold text-2xl tabular-nums">
                    {formatNumber(data.metrics.totalOrders)}
                  </strong>
                  <Trend value={data.metrics.trends.orders} />
                </div>
                <div className="flex flex-col gap-2 px-5 py-5">
                  <span className="text-muted-foreground text-sm">Average</span>
                  <strong className="font-bold text-2xl tabular-nums">
                    {formatCurrency(data.metrics.avgOrderValue)}
                  </strong>
                  <Trend value={data.metrics.trends.average} />
                </div>
              </CardContent>
            </Card>

            <section className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.5fr)]">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue trend</CardTitle>
                  <CardDescription>Daily sales</CardDescription>
                </CardHeader>
                <CardContent>
                  <RevenueChart points={data.revenueByDay} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Channels</CardTitle>
                  <CardDescription>Revenue split</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-5">
                  {data.channelPerformance.map((channel) => (
                    <div key={channel.channel} className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <PlatformMark platform={channel.channel} />
                        <span className="font-semibold tabular-nums">
                          {formatCurrency(channel.revenue)}
                        </span>
                      </div>
                      <Progress value={channel.percentage} />
                      <div className="flex justify-between text-muted-foreground text-xs tabular-nums">
                        <span>{channel.orders} orders</span>
                        <span>{channel.percentage.toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>

            {data.orderItemsAvailable && data.topProducts.length > 0 ? (
              <Card className="gap-0 overflow-hidden py-0">
                <CardHeader className="border-b py-5">
                  <CardTitle>Top products</CardTitle>
                  <CardDescription>By revenue</CardDescription>
                </CardHeader>
                <CardContent className="px-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="pl-5">Product</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead className="text-right">Units</TableHead>
                        <TableHead className="pr-5 text-right">
                          Revenue
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.topProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell className="max-w-96 truncate pl-5 font-semibold">
                            {product.title}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {product.sku}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {formatNumber(product.units)}
                          </TableCell>
                          <TableCell className="pr-5 text-right font-semibold tabular-nums">
                            {formatCurrency(product.revenue)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : null}
          </>
        )}
      </div>
    </PageWrapper>
  );
}
