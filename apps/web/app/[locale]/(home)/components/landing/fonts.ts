import { Caveat, Fraunces, Inter } from 'next/font/google';

export const landingInter = Inter({
  display: 'swap',
  fallback: ['Arial', 'sans-serif'],
  subsets: ['latin'],
  variable: '--landing-inter',
});

export const landingCaveat = Caveat({
  display: 'swap',
  fallback: ['Segoe Print', 'Bradley Hand', 'cursive'],
  subsets: ['latin'],
  variable: '--landing-caveat',
  weight: ['500', '600', '700'],
});

export const landingFraunces = Fraunces({
  display: 'swap',
  fallback: ['Georgia', 'serif'],
  subsets: ['latin'],
  variable: '--landing-fraunces',
  weight: ['500'],
});
