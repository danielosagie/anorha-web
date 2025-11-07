import { Separator } from '@repo/design-system/components/ui/separator';
import { SidebarTrigger } from '@repo/design-system/components/ui/sidebar';
import { type ReactNode } from 'react';

type HeaderProps = {
  page: string;
  children?: ReactNode;
};

export const Header = ({ page, children }: HeaderProps) => (
  <header className="flex h-16 shrink-0 items-center justify-between gap-2">
    <div className="flex items-center gap-2 px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <div className="font-medium text-sm">{page}</div>
    </div>
    {children}
  </header>
);
