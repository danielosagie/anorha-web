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
  <header className="flex h-13 shrink-0 items-center justify-between gap-3 px-2 md:h-14 md:px-3">
    <div className="flex min-w-0 items-center gap-2">
      <SidebarTrigger className="size-8 rounded-lg" />
      <Separator orientation="vertical" className="mx-1 h-5" />
      <div className="truncate font-medium text-muted-foreground text-sm">
        {page}
      </div>
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
