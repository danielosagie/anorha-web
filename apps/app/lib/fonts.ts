import { GeistMono } from '@repo/design-system/lib/fonts';
import { cn } from '@repo/design-system/lib/utils';
import { Inter } from 'next/font/google';

// The app matches the mobile design system (Inter), unlike the other apps in
// the monorepo which keep Geist. Publishing under --font-geist-sans keeps the
// shared design-system font mapping working without forking its CSS.
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-geist-sans',
});

export const fonts = cn(
  inter.variable,
  GeistMono.variable,
  'touch-manipulation font-sans antialiased'
);
