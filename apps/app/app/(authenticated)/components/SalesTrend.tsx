"use client";

import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@repo/design-system/components/ui/chart';
import { Line, LineChart, XAxis, YAxis } from 'recharts';

const data = [
  { d: 'Mon', revenue: 0 },
  { d: 'Tue', revenue: 0 },
  { d: 'Wed', revenue: 0 },
  { d: 'Thu', revenue: 0 },
  { d: 'Fri', revenue: 0 },
  { d: 'Sat', revenue: 0 },
  { d: 'Sun', revenue: 0 },
];

export function SalesTrend() {
  return (
    <ChartContainer config={{ revenue: { label: 'Revenue', color: 'oklch(0.646 0.222 41.116)' } }}>
      <LineChart data={data}>
        <XAxis dataKey="d" hide tickLine={false} axisLine={false} />
        <YAxis hide tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={2} dot={false} />
      </LineChart>
    </ChartContainer>
  );
}
