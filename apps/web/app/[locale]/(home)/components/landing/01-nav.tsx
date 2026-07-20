'use client';

import { env } from '@/env';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@repo/design-system/components/ui/sheet';
import { Menu } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DownloadMenu } from './download-menu';

type LandingNavProps = {
  locale: string;
};

const linkItems = [
  ['Features', '#product'],
  ['Pricing', '#pricing'],
] as const;

export function LandingNav({ locale }: LandingNavProps) {
  const home = `/${locale}`;
  const pathname = usePathname();
  const isLandingHome = pathname === home || pathname === `${home}/`;
  const getHref = (href: string) => {
    if (!href.startsWith('#')) {
      return `${home}/${href}`;
    }

    return isLandingHome ? href : `${home}/${href}`;
  };

  return (
    <header className="landing-nav-section">
      <nav aria-label="Main navigation" className="landing-nav-pill">
        <Link aria-label="Anorha home" className="landing-brand" href={home}>
          <span className="landing-brand-mark">
            <Image
              alt=""
              height={26}
              priority
              src="/assets/landing/nav-logo.png"
              width={26}
            />
          </span>
          <span>anorha</span>
        </Link>

        <div className="landing-nav-links">
          {linkItems.map(([label, href]) => (
            <Link href={getHref(href)} key={label}>
              {label}
            </Link>
          ))}
        </div>

        <div className="landing-nav-actions">
          <Link
            className="landing-nav-signup"
            href={`${env.NEXT_PUBLIC_APP_URL}/sign-up`}
          >
            Sign up
          </Link>
          <DownloadMenu locale={locale} />
          <Link
            className="landing-nav-primary"
            href={`${env.NEXT_PUBLIC_APP_URL}/sign-in`}
          >
            Log in
          </Link>
          <div className="landing-mobile-menu">
            <Sheet>
              <SheetTrigger asChild>
                <button
                  aria-label="Open menu"
                  className="mobile-menu-trigger"
                  type="button"
                >
                  <Menu aria-hidden="true" size={21} />
                </button>
              </SheetTrigger>
              <SheetContent className="marketing-nav-sheet" side="right">
                <SheetHeader className="marketing-nav-sheet-header">
                  <SheetTitle>Menu</SheetTitle>
                  <SheetDescription>Explore Anorha.</SheetDescription>
                </SheetHeader>
                <nav
                  aria-label="Mobile navigation"
                  className="marketing-mobile-links"
                >
                  {linkItems.map(([label, href]) => (
                    <SheetClose asChild key={label}>
                      <Link href={getHref(href)}>{label}</Link>
                    </SheetClose>
                  ))}
                  <SheetClose asChild>
                    <Link href={`${home}/download`}>Download</Link>
                  </SheetClose>
                </nav>
                <div className="marketing-mobile-auth">
                  <a
                    className="marketing-mobile-signup"
                    href={`${env.NEXT_PUBLIC_APP_URL}/sign-up`}
                  >
                    Sign up
                  </a>
                  <a
                    className="marketing-mobile-login"
                    href={`${env.NEXT_PUBLIC_APP_URL}/sign-in`}
                  >
                    Log in
                  </a>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </header>
  );
}
