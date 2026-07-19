import './styles.css';
import './(home)/components/landing/landing.css';
// CMS disabled temporarily
import { DesignSystemProvider } from '@repo/design-system';
import { fonts } from '@repo/design-system/lib/fonts';
import { cn } from '@repo/design-system/lib/utils';
import { Toolbar } from '@repo/feature-flags/components/toolbar';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { LandingNav } from './(home)/components/landing/01-nav';
import { LandingFooter } from './(home)/components/landing/13-footer';
import {
  landingCaveat,
  landingFraunces,
  landingInter,
} from './(home)/components/landing/fonts';
import { FooterDownloadLink } from './(home)/components/landing/footer-download-link';

type RootLayoutProperties = {
  readonly children: ReactNode;
  readonly params: Promise<{
    locale: string;
  }>;
};

export const metadata: Metadata = {
  icons: {
    icon: '/favicon.ico',
    apple: '/logo.png',
  },
  manifest: '/manifest.json', // For PWA
  keywords: [
    'inventory management',
    'multi-channel listing',
    'shopify sync',
    'cross-listing app',
  ],
};

const RootLayout = async ({ children, params }: RootLayoutProperties) => {
  const { locale } = await params;
  const fontVariables = `${landingInter.variable} ${landingCaveat.variable} ${landingFraunces.variable}`;

  return (
    <html
      lang={locale}
      className={cn(fonts, 'scroll-smooth')}
      suppressHydrationWarning
    >
      <body className={`marketing-shell ${fontVariables}`}>
        <DesignSystemProvider>
          <div className="site-main-shell">
            <LandingNav locale={locale} />
            <main>{children}</main>
            <LandingFooter locale={locale} />
            <FooterDownloadLink locale={locale} />
          </div>
        </DesignSystemProvider>
        <Toolbar />
      </body>
    </html>
  );
};

export default RootLayout;
