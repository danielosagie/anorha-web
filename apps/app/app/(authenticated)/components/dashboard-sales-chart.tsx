'use client';

import type { DashboardData } from '@/lib/data/dashboard';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@repo/design-system/components/ui/chart';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';

const chartConfig = {
  revenue: {
    label: 'Sales',
    color: 'var(--anorhaAccentDeep)',
  },
} satisfies ChartConfig;

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export function DashboardSalesChart({
  points,
}: {
  points: DashboardData['monthlyRevenue'];
}) {
  return (
    <ChartContainer
      config={chartConfig}
      className="aspect-auto h-56 w-full sm:h-64"
    >
      <LineChart
        accessibilityLayer
        data={points}
        margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
      >
        <CartesianGrid vertical={false} strokeDasharray="3 5" />
        <XAxis
          axisLine={false}
          dataKey="label"
          minTickGap={20}
          tickLine={false}
          tickMargin={10}
        />
        <YAxis
          axisLine={false}
          tickFormatter={(value: number) =>
            value >= 1000 ? `$${Math.round(value / 1000)}k` : `$${value}`
          }
          tickLine={false}
          tickMargin={8}
          width={48}
        />
        <ChartTooltip
          cursor={{ stroke: 'var(--border)', strokeDasharray: '3 3' }}
          content={
            <ChartTooltipContent
              indicator="line"
              labelFormatter={(_, payload) =>
                String(payload[0]?.payload?.month ?? '')
              }
              formatter={(value) => (
                <div className="flex min-w-32 items-center justify-between gap-4">
                  <span className="text-muted-foreground">Sales</span>
                  <span className="font-semibold tabular-nums">
                    {currencyFormatter.format(Number(value))}
                  </span>
                </div>
              )}
            />
          }
        />
        <Line
          activeDot={{ r: 4, fill: 'var(--card)', strokeWidth: 2 }}
          dataKey="revenue"
          dot={false}
          stroke="var(--color-revenue)"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.25}
          type="monotone"
        />
      </LineChart>
    </ChartContainer>
  );
}
