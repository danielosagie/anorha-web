'use client';

import { env } from '@/env';
import { OrganizationSwitcher, UserButton } from '@repo/auth/client';
import { ModeToggle } from '@repo/design-system/components/mode-toggle';
import {
  Sidebar,
  SidebarInset,
} from '@repo/design-system/components/ui/sidebar';
import { cn } from '@repo/design-system/lib/utils';
import {
  CreditCardIcon,
  ExternalLinkIcon,
  LayoutDashboardIcon,
  LinkIcon,
  PackageIcon,
  PlugIcon,
  SettingsIcon,
  ShoppingBagIcon,
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

// Board 2SAU-0 groups Platform as Dashboard, Inventory, Orders, Connections.
// Intake links is a shipped surface with its own board (2UHG-0) and sits with
// them; it postdates the shell board.
const platformItems: readonly NavItem[] = [
  { title: 'Dashboard', url: '/', icon: LayoutDashboardIcon },
  { title: 'Inventory', url: '/inventory', icon: PackageIcon },
  { title: 'Orders', url: '/orders', icon: ShoppingBagIcon },
  { title: 'Connections', url: '/connections', icon: PlugIcon },
  { title: 'Intake links', url: '/intake-links', icon: LinkIcon },
];

const accountItems: readonly NavItem[] = [
  { title: 'Billing', url: '/billing', icon: CreditCardIcon },
  { title: 'Team', url: '/team', icon: UsersIcon },
  { title: 'Settings', url: '/settings', icon: SettingsIcon },
];

const MOBILE_APP_URL = new URL('/download', env.NEXT_PUBLIC_WEB_URL).toString();

function isCurrentRoute(pathname: string, url: string): boolean {
  return url === '/' ? pathname === '/' : pathname.startsWith(url);
}

// Board: 38px row, 10px radius, 10px inline padding, 10px icon-to-label gap,
// icon 16 at strokeWidth 1.9, label 15/18 weight 500 and 600 when active.
const navRow =
  'flex h-[38px] w-full items-center gap-[10px] rounded-[var(--radius-row)] px-[10px] text-[15px] leading-[18px] transition-colors [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:[stroke-width:1.9]';

function NavRow({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isCurrentRoute(pathname, item.url);

  return (
    <Link
      href={item.url}
      aria-current={active ? 'page' : undefined}
      className={cn(
        navRow,
        active
          ? 'bg-k0-accent-wash font-semibold text-k0-accent-ink'
          : 'font-medium text-k0-ink-2 hover:bg-k0-hairline hover:text-k0-ink'
      )}
    >
      <item.icon aria-hidden />
      <span className="min-w-0 flex-1 truncate">{item.title}</span>
    </Link>
  );
}

export const GlobalSidebar = ({ children }: GlobalSidebarProperties) => {
  const pathname = usePathname();

  return (
    <>
      <Sidebar variant="inset" className="p-0 py-[10px] pl-[10px]">
        <div className="flex h-full w-full flex-col gap-[6px] px-2 py-[10px]">
          {/* Head */}
          <div className="flex w-full flex-col gap-2 pb-[6px]">
            <div className="h-[42px] w-full overflow-hidden rounded-[var(--radius-control)] border border-k0-border bg-k0-surface [&>div]:w-full">
              <OrganizationSwitcher
                hidePersonal
                afterSelectOrganizationUrl="/"
                appearance={{
                  elements: {
                    rootBox: 'w-full',
                    organizationSwitcherTrigger:
                      'h-[40px] w-full justify-between rounded-[var(--radius-control)] px-[9px] pl-[10px] hover:bg-k0-hairline focus:bg-k0-hairline',
                    organizationPreview: 'gap-[9px]',
                    organizationPreviewAvatarBox:
                      'size-[26px] rounded-[var(--radius-chip)]',
                    organizationPreviewTextContainer:
                      'text-[14px] font-semibold leading-[18px] text-k0-ink',
                  },
                }}
              />
            </div>
          </div>

          {/* Platform */}
          <div className="flex w-full flex-col gap-[2px]">
            <div className="flex h-7 shrink-0 items-center pl-[10px] font-medium text-[13px] text-k0-ink-3 leading-4">
              Platform
            </div>
            {platformItems.map((item) => (
              <NavRow key={item.url} item={item} pathname={pathname} />
            ))}
          </div>

          <div className="min-h-0 w-full flex-1" />

          {/* Mobile app */}
          <a
            href={MOBILE_APP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              navRow,
              'font-medium text-k0-ink-2 hover:bg-k0-hairline hover:text-k0-ink'
            )}
          >
            <SmartphoneIcon aria-hidden />
            <span className="min-w-0 flex-1 truncate">Mobile app</span>
            <ExternalLinkIcon
              aria-hidden
              className="size-[13px] shrink-0 text-k0-ink-3 [stroke-width:2]"
            />
          </a>

          {/* Account. The board gives this group no label; the divider carries
              the grouping instead. */}
          <div className="flex w-full flex-col gap-[2px] border-k0-hairline border-t pt-3">
            {accountItems.map((item) => (
              <NavRow key={item.url} item={item} pathname={pathname} />
            ))}
          </div>

          {/* Profile footer. The board puts a kebab in the trailing slot; the
              theme toggle takes it, because dark mode has to stay reachable and
              the board is light-only. */}
          <div className="flex h-[46px] w-full shrink-0 items-center gap-2 border-k0-border border-t px-[9px]">
            <div className="min-w-0 flex-1 overflow-hidden">
              <UserButton
                showName
                appearance={{
                  elements: {
                    rootBox: 'flex w-full min-w-0 overflow-hidden',
                    userButtonBox:
                      'flex w-full min-w-0 flex-row-reverse justify-end gap-2',
                    userButtonOuterIdentifier:
                      'min-w-0 flex-1 truncate pl-0 text-left text-[14px] font-semibold leading-[18px] text-k0-ink',
                    userButtonTrigger:
                      'min-w-0 rounded-[var(--radius-row)] hover:bg-k0-hairline focus:bg-k0-hairline',
                    avatarBox: 'size-7',
                  },
                }}
              />
            </div>
            <ModeToggle />
          </div>
        </div>
      </Sidebar>

      {/*
        Board shell: the content is an inset white panel floating on the grey
        page, 16px radius with a 1px rule, 8px from the rail and 10px from every
        other edge. Below md the rail becomes a sheet, so the panel goes full
        bleed.
      */}
      <SidebarInset
        className={cn(
          'min-h-svh overflow-hidden bg-k0-surface',
          // Same modifier prefixes as the shadcn inset classes, so these replace
          // them rather than racing them on source order.
          'md:peer-data-[variant=inset]:my-[10px] md:peer-data-[variant=inset]:mr-[10px] md:peer-data-[variant=inset]:ml-2',
          // Pinned to the viewport so the panel's corners stay on screen and the
          // content scrolls inside it, the way the board frames it.
          'md:peer-data-[variant=inset]:h-[calc(100svh-20px)] md:peer-data-[variant=inset]:min-h-0',
          'md:peer-data-[variant=inset]:rounded-[var(--radius-content)]',
          'md:peer-data-[variant=inset]:border md:peer-data-[variant=inset]:border-k0-border',
          'md:peer-data-[variant=inset]:shadow-none'
        )}
      >
        {children}
      </SidebarInset>
    </>
  );
};
