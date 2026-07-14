'use client';

import { OrganizationSwitcher, UserButton } from '@repo/auth/client';
import { ModeToggle } from '@repo/design-system/components/mode-toggle';
import { Button } from '@repo/design-system/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@repo/design-system/components/ui/collapsible';
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
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
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
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import anorhaLogo from '../../assets/anorha_logo.png';
import { Search } from './search';

type GlobalSidebarProperties = {
  readonly children: ReactNode;
};

type SubNavItem = {
  readonly title: string;
  readonly url: string;
};

type NavItem = {
  readonly title: string;
  readonly url: string;
  readonly icon: LucideIcon;
  readonly items?: readonly SubNavItem[];
};

const data: {
  readonly user: {
    readonly name: string;
    readonly email: string;
    readonly avatar: string;
  };
  readonly navMain: readonly NavItem[];
  readonly navSecondary: readonly NavItem[];
  readonly projects: readonly unknown[];
} = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
  navMain: [
    { title: 'Dashboard', url: '/', icon: LayoutDashboardIcon },
    { title: 'Inventory', url: '/inventory', icon: BoxesIcon },
  ],
  navSecondary: [
    { title: 'Billing/Usage', url: '/billing', icon: CreditCardIcon },
    { title: 'Team', url: '/team', icon: UsersIcon },
    { title: 'Profile', url: '/profile', icon: UserRoundIcon },
    { title: 'Settings', url: '/settings', icon: Settings2Icon },
  ],
  projects: [],
};

export const GlobalSidebar = ({ children }: GlobalSidebarProperties) => {
  const sidebar = useSidebar();
  const pathname = usePathname();

  return (
    <>
      <Sidebar variant="inset" className="bg-background p-2 pr-0">
        <SidebarHeader className="gap-3 border-sidebar-border border-b px-3 pt-3 pb-4">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-2xl px-1 py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
          >
            <Image
              src={anorhaLogo}
              alt=""
              className="size-9 rounded-xl object-cover"
              priority
            />
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <div className="font-extrabold text-[0.9375rem] tracking-[-0.02em]">
                Anorha
              </div>
              <div className="font-medium text-muted-foreground text-xs">
                Seller workspace
              </div>
            </div>
          </Link>
          <SidebarMenu>
            <SidebarMenuItem>
              <div
                className={cn(
                  'h-10 overflow-hidden rounded-xl bg-muted/70 transition-all [&>div]:w-full',
                  sidebar.open ? '' : '-mx-1'
                )}
              >
                <OrganizationSwitcher
                  hidePersonal
                  afterSelectOrganizationUrl="/"
                  appearance={{
                    elements: {
                      organizationSwitcherTrigger:
                        'h-10 w-full rounded-xl px-2 hover:bg-accent focus:bg-accent',
                    },
                  }}
                />
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <div className="py-3">
          <Search />
        </div>
        <SidebarContent>
          <SidebarGroup className="px-3">
            <SidebarGroupLabel className="px-2 font-bold text-[0.6875rem] text-muted-foreground uppercase tracking-[0.09em]">
              Workspace
            </SidebarGroupLabel>
            <SidebarMenu>
              {data.navMain.map((item) => (
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen={
                    item.url === '/'
                      ? pathname === '/'
                      : pathname.startsWith(item.url)
                  }
                >
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      className={cn(
                        'h-11 rounded-xl px-3 font-semibold text-sidebar-foreground/75 text-sm',
                        'hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground focus:bg-sidebar-accent/70',
                        'data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground'
                      )}
                      isActive={
                        item.url === '/'
                          ? pathname === '/'
                          : pathname.startsWith(item.url)
                      }
                    >
                      <Link href={item.url}>
                        <span className="flex size-7 items-center justify-center rounded-lg bg-muted/80 group-data-[collapsible=icon]:bg-transparent">
                          <item.icon />
                        </span>
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                    {item.items?.length ? (
                      <>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuAction className="hover:bg-black/10 focus:bg-black/10 data-[state=open]:rotate-90">
                            <span className="sr-only">Toggle {item.title}</span>
                          </SidebarMenuAction>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub className="border-sidebar-border">
                            {item.items?.map((subItem: SubNavItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton
                                  asChild
                                  className="hover:bg-black/10 focus:bg-black/10"
                                >
                                  <Link href={subItem.url}>
                                    <span>{subItem.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </>
                    ) : null}
                  </SidebarMenuItem>
                </Collapsible>
              ))}
            </SidebarMenu>
          </SidebarGroup>
          {/* Projects group removed */}
          <SidebarGroup className="mt-auto px-3">
            <SidebarGroupLabel className="px-2 font-bold text-[0.6875rem] text-muted-foreground uppercase tracking-[0.09em]">
              Account
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {data.navSecondary.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={cn(
                        'h-11 rounded-xl px-3 font-semibold text-sidebar-foreground/75 text-sm',
                        'hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground focus:bg-sidebar-accent/70',
                        'data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground'
                      )}
                      isActive={pathname.startsWith(item.url)}
                    >
                      <Link href={item.url}>
                        <span className="flex size-7 items-center justify-center rounded-lg bg-muted/80 group-data-[collapsible=icon]:bg-transparent">
                          <item.icon />
                        </span>
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-sidebar-border border-t p-3">
          <SidebarMenu>
            <SidebarMenuItem className="flex items-center gap-2 rounded-xl bg-muted/60 p-1.5">
              <UserButton
                showName
                appearance={{
                  elements: {
                    rootBox: 'flex overflow-hidden w-full',
                    userButtonBox: 'flex-row-reverse',
                    userButtonOuterIdentifier: 'truncate pl-0',
                    userButtonTrigger:
                      'rounded-lg hover:bg-accent focus:bg-accent',
                  },
                }}
              />
              <div className="flex shrink-0 items-center gap-px">
                <ModeToggle />
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 hover:bg-accent focus:bg-accent"
                  asChild
                >
                  <div className="size-4">
                    <NotificationsTrigger />
                  </div>
                </Button>
              </div>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="min-h-svh bg-background md:rounded-l-[1.5rem] md:border md:border-border md:shadow-none">
        {children}
      </SidebarInset>
    </>
  );
};
