'use client';

import type { ActivityCategory } from '@/lib/data/activity';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/design-system/components/ui/select';
import { useRouter } from 'next/navigation';

const labels: Record<ActivityCategory, string> = {
  order: 'Orders',
  inventory: 'Inventory',
  product: 'Products',
  sync: 'Sync',
  error: 'Errors',
  other: 'Other',
};

export function ActivityFilter({
  categories,
  value,
}: {
  categories: ActivityCategory[];
  value: ActivityCategory | 'all';
}) {
  const router = useRouter();
  return (
    <Select
      value={value}
      onValueChange={(next) =>
        router.push(next === 'all' ? '/activity' : `/activity?type=${next}`)
      }
    >
      <SelectTrigger className="w-full sm:w-44" aria-label="Activity type">
        <SelectValue placeholder="Type" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="all">All activity</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category} value={category}>
              {labels[category]}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
