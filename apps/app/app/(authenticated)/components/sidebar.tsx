'use client';

import { OrganizationSwitcher } from '@repo/auth/client';
import { ModeToggle } from '@repo/design-system/components/mode-toggle';
import { Button } from '@repo/design-system/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@repo/design-system/components/ui/sidebar';
import { cn } from '@repo/design-system/lib/utils';
import { NotificationsTrigger } from '@repo/notifications/components/trigger';
import {
  BoxesIcon,
  CreditCardIcon,
  LayoutDashboardIcon,
  Settings2Icon,
  UserRoundIcon,
  UsersIcon,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { Search } from './search';

type GlobalSidebarProperties = {
  readonly children: ReactNode;
};

type NavItem = {
  readonly title: string;
  readonly url: string;
  readonly icon: LucideIcon;
};

const workspaceItems: readonly NavItem[] = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboardIcon },
  { title: 'Inventory', url: '/inventory', icon: BoxesIcon },
];

const accountItems: readonly NavItem[] = [
  { title: 'Billing & usage', url: '/billing', icon: CreditCardIcon },
  { title: 'Team', url: '/team', icon: UsersIcon },
  { title: 'Profile', url: '/profile', icon: UserRoundIcon },
  { title: 'Settings', url: '/settings', icon: Settings2Icon },
];

function NavigationGroup({
  label,
  items,
  pathname,
}: {
  label: string;
  items: readonly NavItem[];
  pathname: string;
}) {
  return (
    <SidebarGroup className="px-2 py-2">
      <SidebarGroupLabel className="h-7 px-2 font-semibold text-[0.625rem] text-muted-foreground uppercase tracking-[0.12em]">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="gap-0.5">
          {items.map((item) => {
            const active =
              item.url === '/'
                ? pathname === '/'
                : pathname.startsWith(item.url);

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  tooltip={item.title}
                  className={cn(
                    'h-9 rounded-lg px-2.5 font-medium text-[0.8125rem] text-sidebar-foreground/72',
                    'hover:bg-sidebar-accent/65 hover:text-sidebar-accent-foreground',
                    'data-[active=true]:bg-sidebar-accent data-[active=true]:font-semibold data-[active=true]:text-sidebar-accent-foreground',
                    '[&>svg]:size-4 [&>svg]:stroke-[1.8]'
                  )}
                >
                  <Link href={item.url}>
                    <item.icon aria-hidden="true" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export const GlobalSidebar = ({ children }: GlobalSidebarProperties) => {
  const pathname = usePathname();

  return (
    <>
      <Sidebar variant="inset" className="bg-sidebar">
        <SidebarHeader className="gap-2 px-2 pt-2 pb-3">
          <Search />
          <div className="overflow-hidden rounded-xl border border-sidebar-border bg-card [&>div]:w-full">
            <OrganizationSwitcher
              hidePersonal
              afterSelectOrganizationUrl="/"
              appearance={{
                elements: {
                  rootBox: 'w-full',
                  organizationSwitcherTrigger:
                    'h-10 w-full justify-between rounded-xl px-2.5 hover:bg-sidebar-accent/60 focus:bg-sidebar-accent/60',
                  organizationPreview: 'gap-2',
                  organizationPreviewAvatarBox: 'size-6',
                  organizationPreviewTextContainer: 'text-sm font-semibold',
                },
              }}
            />
          </div>
        </SidebarHeader>

        <SidebarContent className="gap-0">
          <NavigationGroup
            label="Workspace"
            items={workspaceItems}
            pathname={pathname}
          />
          <NavigationGroup
            label="Account"
            items={accountItems}
            pathname={pathname}
          />
        </SidebarContent>

        <SidebarFooter className="px-2 pt-2 pb-2">
          <div className="flex items-center gap-1 rounded-xl border border-sidebar-border bg-card p-1">
            <ModeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="size-8 rounded-lg hover:bg-sidebar-accent"
              aria-label="Notifications"
              asChild
            >
              <div className="size-4">
                <NotificationsTrigger />
              </div>
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="min-h-svh bg-background">
        {children}
      </SidebarInset>
    </>
  );
};
