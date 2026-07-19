'use client';

import type { AnalyticsData } from '@/lib/data/analytics';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@repo/design-system/components/ui/chart';
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';

const config = {
  revenue: {
    label: 'Revenue',
    color: 'var(--primary)',
  },
} satisfies ChartConfig;

function shortDate(value: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${value}T12:00:00.000Z`));
}

export function RevenueChart({
  points,
}: {
  points: AnalyticsData['revenueByDay'];
}) {
  return (
    <ChartContainer config={config} className="aspect-auto h-72 w-full">
      <LineChart
        accessibilityLayer
        data={points}
        margin={{ left: 4, right: 12 }}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={32}
          tickFormatter={shortDate}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={48}
          tickFormatter={(value: number) =>
            `$${Math.round(value).toLocaleString()}`
          }
        />
        <ChartTooltip
          cursor={false}
          content={
            <ChartTooltipContent
              indicator="line"
              labelFormatter={(value) => shortDate(String(value))}
            />
          }
        />
        <Line
          dataKey="revenue"
          type="monotone"
          stroke="var(--color-revenue)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ChartContainer>
  );
}
