import { env } from '@/env';
import './styles.css';
import { DesignSystemProvider } from '@repo/design-system';
import { fonts } from '@repo/design-system/lib/fonts';
import { Toolbar } from '@repo/feature-flags/components/toolbar';
import type { ReactNode } from 'react';
import { Analytics } from "@vercel/analytics/next"
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'Anorha',
    template: '%s | Anorha',
  },
  description: 'Manage your inventory, sync across platforms, and grow your business with Anorha.',
  icons: {
    icon: '/favicon.ico',
    apple: '/logo.png',
  },
  manifest: '/manifest.json',
};

type RootLayoutProperties = {
  readonly children: ReactNode;
};

const RootLayout = ({ children }: RootLayoutProperties) => (
  <html lang="en" className={fonts} suppressHydrationWarning>
    <body>
      <Analytics/>
      <DesignSystemProvider
        privacyUrl={new URL(
          '/legal/privacy',
          env.NEXT_PUBLIC_WEB_URL
        ).toString()}
        termsUrl={new URL('/legal/terms', env.NEXT_PUBLIC_WEB_URL).toString()}
        helpUrl={env.NEXT_PUBLIC_DOCS_URL}
      >
        {children}
      </DesignSystemProvider>
      <Toolbar />
    </body>
  </html>
);

export default RootLayout;
