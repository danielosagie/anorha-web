import { GeistMono } from '@repo/design-system/lib/fonts';
import { cn } from '@repo/design-system/lib/utils';
import { Inter_Tight } from 'next/font/google';

// K-0 sets the app in Inter Tight, with Geist Mono for column labels, IDs and
// numerics. The other apps in the monorepo keep Geist Sans. Publishing under
// --font-geist-sans keeps the shared design-system font mapping working without
// forking its CSS.
const interTight = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-geist-sans',
});

export const fonts = cn(
  interTight.variable,
  GeistMono.variable,
  'touch-manipulation font-sans antialiased'
);
