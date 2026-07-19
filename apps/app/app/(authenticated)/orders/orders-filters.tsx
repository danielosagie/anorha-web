'use client';

import { Button } from '@repo/design-system/components/ui/button';
import { Input } from '@repo/design-system/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/design-system/components/ui/select';
import { RotateCcwIcon, SearchIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type FormEvent, useState } from 'react';

const LABEL_SEPARATOR = /[\s_-]/;

function label(value: string): string {
  if (value.length <= 4) {
    return value.toUpperCase();
  }
  return value
    .split(LABEL_SEPARATOR)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function OrdersFilters({
  platforms,
  statuses,
  initial,
}: {
  platforms: string[];
  statuses: string[];
  initial: {
    platform: string;
    status: string;
    startDate: string;
    endDate: string;
  };
}) {
  const router = useRouter();
  const [platform, setPlatform] = useState(initial.platform || 'all');
  const [status, setStatus] = useState(initial.status || 'all');
  const [startDate, setStartDate] = useState(initial.startDate);
  const [endDate, setEndDate] = useState(initial.endDate);

  const apply = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (platform !== 'all') {
      params.set('platform', platform);
    }
    if (status !== 'all') {
      params.set('status', status);
    }
    if (startDate) {
      params.set('start', startDate);
    }
    if (endDate) {
      params.set('end', endDate);
    }
    const query = params.toString();
    router.push(query ? `/orders?${query}` : '/orders');
  };

  return (
    <form
      onSubmit={apply}
      className="flex flex-col gap-3 rounded-2xl border bg-card p-3 md:flex-row md:items-center"
    >
      <Select value={platform} onValueChange={setPlatform}>
        <SelectTrigger className="w-full md:w-40" aria-label="Platform">
          <SelectValue placeholder="Platform" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="all">All platforms</SelectItem>
            {platforms.map((item) => (
              <SelectItem key={item} value={item}>
                {label(item)}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Select value={status} onValueChange={setStatus}>
        <SelectTrigger className="w-full md:w-40" aria-label="Status">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="all">All statuses</SelectItem>
            {statuses.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Input
        type="date"
        value={startDate}
        onChange={(event) => setStartDate(event.target.value)}
        aria-label="Start date"
        className="w-full md:w-40"
      />
      <Input
        type="date"
        value={endDate}
        onChange={(event) => setEndDate(event.target.value)}
        aria-label="End date"
        className="w-full md:w-40"
      />
      <div className="flex items-center gap-2 md:ml-auto">
        <Button type="submit" className="flex-1 md:flex-none">
          <SearchIcon data-icon="inline-start" />
          Apply
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push('/orders')}
          aria-label="Clear filters"
        >
          <RotateCcwIcon data-icon="inline-start" />
          Clear
        </Button>
      </div>
    </form>
  );
}
