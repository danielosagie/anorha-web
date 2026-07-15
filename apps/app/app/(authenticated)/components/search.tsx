import { Button } from '@repo/design-system/components/ui/button';
import { Input } from '@repo/design-system/components/ui/input';
import { ArrowRightIcon, SearchIcon } from 'lucide-react';

export const Search = () => (
  <form action="/search" className="flex w-full items-center gap-2">
    <div className="relative w-full">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex w-10 items-center justify-center">
        <SearchIcon className="size-4 text-muted-foreground" />
      </div>
      <Input
        type="text"
        name="q"
        placeholder="Search"
        className="h-10 min-h-10 rounded-xl border-sidebar-border bg-card py-2 pr-10 pl-10 text-sm shadow-none focus-visible:border-ring"
      />
      <Button
        variant="ghost"
        size="icon"
        className="absolute inset-y-0 right-0 size-10"
        aria-label="Search"
      >
        <ArrowRightIcon className="text-muted-foreground" />
      </Button>
    </div>
  </form>
);
