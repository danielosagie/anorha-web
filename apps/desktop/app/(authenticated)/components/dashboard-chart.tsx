'use client';

import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/design-system/components/ui/card';

const SalesTrend = dynamic(() =>
  import('./SalesTrend').then((mod) => mod.SalesTrend),
  { ssr: false }
);

export function DashboardChart() {
  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Sales Trends</CardTitle>
        <CardDescription>Daily/Weekly/Monthly Revenue</CardDescription>
      </CardHeader>
      <CardContent>
        <SalesTrend />
      </CardContent>
    </Card>
  );
}
