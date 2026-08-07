import { cn } from '@repo/design-system/lib/utils';
import { GeistMono } from 'geist/font/mono';
import { GeistSans } from 'geist/font/sans';

export const fonts = cn(
  GeistSans.variable,
  GeistMono.variable,
  'touch-manipulation font-sans antialiased'
);

// For apps that swap the sans face but keep the shared mono (e.g. apps/app
// uses Inter to match the mobile design system).
export { GeistMono };
