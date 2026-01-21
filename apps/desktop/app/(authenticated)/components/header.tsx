import { Separator } from '@repo/design-system/components/ui/separator';
import { SidebarTrigger } from '@repo/design-system/components/ui/sidebar';
import { type ReactNode } from 'react';
import { Button } from '@repo/design-system/components/ui/button';
import { ArrowLeft } from 'lucide-react';

type HeaderProps = {
  page: string;
  children?: ReactNode;
  onBack?: () => void;
  backButtonText?: string;
};

export const Header = ({ page, children, onBack, backButtonText = 'Back' }: HeaderProps) => (
  <header className="flex h-16 shrink-0 items-center justify-between gap-2">
    <div className="flex items-center gap-2 px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <div className="font-medium text-sm">{page}</div>
    </div>
    <div className="flex items-center gap-2 px-4">
      {onBack && (
        <>
          <Separator orientation="vertical" className="h-4" />
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="h-8 px-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            {backButtonText}
          </Button>
        </>
      )}
    {children}
    </div>
  </header>
);
