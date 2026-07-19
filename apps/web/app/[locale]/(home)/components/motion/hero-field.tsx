'use client';

import dynamic from 'next/dynamic';
import type { HeroFieldClientProps } from './hero-field-client';

const HeroFieldClient = dynamic(
  () => import('./hero-field-client').then((module) => module.HeroFieldClient),
  { loading: () => null, ssr: false }
);

export type HeroFieldProps = HeroFieldClientProps;

export function HeroField(props: HeroFieldProps) {
  return <HeroFieldClient {...props} />;
}
