'use client';

import { ANDROID_DOWNLOAD_URL, IOS_DOWNLOAD_URL } from '@/lib/mobile-downloads';
import { OrganizationSwitcher, UserButton } from '@repo/auth/client';
import { ModeToggle } from '@repo/design-system/components/mode-toggle';
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
import {
  AppleIcon,
  BoxesIcon,
  CreditCardIcon,
  ExternalLinkIcon,
  LayoutDashboardIcon,
  LinkIcon,
  Settings2Icon,
  SmartphoneIcon,
  UsersIcon,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

type GlobalSidebarProperties = {
  readonly children: ReactNode;
};

type NavItem = {
  readonly title: string;
  readonly url: string;
  readonly icon: LucideIcon;
};

const platformItems: readonly NavItem[] = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboardIcon },
  { title: 'Inventory', url: '/inventory', icon: BoxesIcon },
  { title: 'Intake links', url: '/intake-links', icon: LinkIcon },
];

const accountItems: readonly NavItem[] = [
  { title: 'Billing & usage', url: '/billing', icon: CreditCardIcon },
  { title: 'Team', url: '/team', icon: UsersIcon },
  { title: 'Settings', url: '/settings', icon: Settings2Icon },
];

const downloadItems = [
  {
    title: 'iPhone app',
    detail: 'TestFlight',
    url: IOS_DOWNLOAD_URL,
    icon: AppleIcon,
  },
  {
    title: 'Android app',
    detail: 'Google Play',
    url: ANDROID_DOWNLOAD_URL,
    icon: SmartphoneIcon,
  },
] as const;

function isCurrentRoute(pathname: string, url: string): boolean {
  return url === '/' ? pathname === '/' : pathname.startsWith(url);
}

function NavigationItems({
  items,
  pathname,
}: {
  items: readonly NavItem[];
  pathname: string;
}) {
  return items.map((item) => (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton
        asChild
        isActive={isCurrentRoute(pathname, item.url)}
        tooltip={item.title}
        className={cn(
          'h-9 rounded-lg px-2.5 font-medium text-[0.8125rem] text-sidebar-foreground/72',
          'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
          'data-[active=true]:bg-sidebar-primary data-[active=true]:font-semibold data-[active=true]:text-sidebar-primary-foreground',
          '[&>svg]:size-4 [&>svg]:stroke-[1.8]'
        )}
      >
        <Link href={item.url}>
          <item.icon aria-hidden />
          <span>{item.title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  ));
}

export const GlobalSidebar = ({ children }: GlobalSidebarProperties) => {
  const pathname = usePathname();

  return (
    <>
      <Sidebar variant="inset">
        <SidebarHeader className="px-3 pt-3 pb-2">
          <div className="h-10 overflow-hidden rounded-lg [&>div]:w-full">
            <OrganizationSwitcher
              hidePersonal
              afterSelectOrganizationUrl="/"
              appearance={{
                elements: {
                  rootBox: 'w-full',
                  organizationSwitcherTrigger:
                    'h-10 w-full justify-between rounded-lg px-2 hover:bg-sidebar-accent focus:bg-sidebar-accent',
                  organizationPreview: 'gap-2',
                  organizationPreviewAvatarBox: 'size-6',
                  organizationPreviewTextContainer:
                    'text-sm font-semibold text-sidebar-foreground',
                },
              }}
            />
          </div>
        </SidebarHeader>

        <SidebarContent className="gap-0 px-1 py-2">
          <SidebarGroup>
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                <NavigationItems items={platformItems} pathname={pathname} />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <div className="mt-auto">
            <SidebarGroup>
              <SidebarGroupLabel>Get the mobile app</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="gap-1">
                  {downloadItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        tooltip={`${item.title}, ${item.detail}`}
                        className="h-11 rounded-lg px-2.5 text-sidebar-foreground/72 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground [&>svg]:size-4"
                      >
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <item.icon aria-hidden />
                          <span className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                            <span className="block truncate font-medium text-[0.8125rem]">
                              {item.title}
                            </span>
                            <span className="block text-[0.6875rem] text-sidebar-foreground/50">
                              {item.detail}
                            </span>
                          </span>
                          <ExternalLinkIcon
                            className="size-3.5 opacity-45 group-data-[collapsible=icon]:hidden"
                            aria-hidden
                          />
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="border-sidebar-border border-t pt-2">
              <SidebarGroupContent>
                <SidebarMenu className="gap-1">
                  <NavigationItems items={accountItems} pathname={pathname} />
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </div>
        </SidebarContent>

        <SidebarFooter className="border-sidebar-border border-t px-3 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <div className="min-w-0 flex-1 overflow-hidden">
              <UserButton
                showName
                appearance={{
                  elements: {
                    rootBox: 'flex w-full min-w-0 overflow-hidden',
                    userButtonBox:
                      'flex w-full min-w-0 flex-row-reverse justify-end gap-2',
                    userButtonOuterIdentifier:
                      'min-w-0 flex-1 truncate pl-0 text-left text-sm font-medium text-sidebar-foreground',
                    userButtonTrigger:
                      'min-w-0 rounded-lg hover:bg-sidebar-accent focus:bg-sidebar-accent',
                    avatarBox: 'size-7',
                  },
                }}
              />
            </div>
            <ModeToggle />
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="min-h-svh">{children}</SidebarInset>
    </>
  );
};
