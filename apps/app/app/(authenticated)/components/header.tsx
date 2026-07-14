import { Button } from '@repo/design-system/components/ui/button';
import { Separator } from '@repo/design-system/components/ui/separator';
import { SidebarTrigger } from '@repo/design-system/components/ui/sidebar';
import { ArrowLeftIcon } from 'lucide-react';
import type { ReactNode } from 'react';

type HeaderProps = {
  page: string;
  children?: ReactNode;
  onBack?: () => void;
  backButtonText?: string;
};

export const Header = ({
  page,
  children,
  onBack,
  backButtonText = 'Back',
}: HeaderProps) => (
  <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-3 border-b bg-background/95 px-4 backdrop-blur md:h-16 md:px-8 lg:px-10">
    <div className="flex min-w-0 items-center gap-2">
      <SidebarTrigger className="-ml-2 size-9 rounded-full" />
      <Separator orientation="vertical" className="mx-1 h-5 md:hidden" />
      <div className="truncate font-semibold text-sm md:hidden">{page}</div>
    </div>
    <div className="flex items-center gap-2">
      {onBack && (
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeftIcon data-icon="inline-start" />
          {backButtonText}
        </Button>
      )}
      {children}
    </div>
  </header>
);
