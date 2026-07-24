'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { HeroDriftLayer } from './hero-drift-layer';
import { HeroStickerField } from './hero-sticker-field';

// DialKit only loads when actually in dial mode, so it never ships in the
// production landing bundle.
const HeroDialKit = dynamic(
  () => import('./hero-dial-kit').then((m) => m.HeroDialKit),
  { ssr: false, loading: () => null }
);

/**
 * Renders the plain sticker field, or — in development with `?dial` in the URL
 * — the DialKit-driven tuning wrapper. Server always renders the plain field;
 * the dial swap happens after mount to avoid hydration mismatch.
 */
export function HeroFieldMount() {
  const [dialMode, setDialMode] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      return;
    }
    const hasDial = new URLSearchParams(window.location.search).has('dial');
    setDialMode(hasDial);
  }, []);

  if (dialMode) {
    return <HeroDialKit />;
  }

  return (
    <>
      <HeroDriftLayer />
      <HeroStickerField />
    </>
  );
}
