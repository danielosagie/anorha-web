'use client';

import type { AnalyticsRange } from '@/lib/data/analytics';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@repo/design-system/components/ui/toggle-group';
import { useRouter } from 'next/navigation';

const options: ReadonlyArray<{ value: AnalyticsRange; label: string }> = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: '1y', label: '1 year' },
];

export function RangeToggle({ value }: { value: AnalyticsRange }) {
  const router = useRouter();
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size="sm"
      value={value}
      onValueChange={(next) => {
        if (next) {
          router.push(`/analytics?range=${next}`);
        }
      }}
      aria-label="Date range"
      className="w-full sm:w-auto"
    >
      {options.map((option) => (
        <ToggleGroupItem key={option.value} value={option.value}>
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
