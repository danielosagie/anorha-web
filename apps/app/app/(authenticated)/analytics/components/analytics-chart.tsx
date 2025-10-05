'use client';

import dynamic from 'next/dynamic';

const SalesTrend = dynamic(() =>
  import('../../components/SalesTrend').then((mod) => mod.SalesTrend),
  { ssr: false }
);

export function AnalyticsChart() {
  return <SalesTrend />;
}
