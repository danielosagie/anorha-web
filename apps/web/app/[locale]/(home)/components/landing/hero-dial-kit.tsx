'use client';

import { DialRoot, useDialKit } from 'dialkit';
import 'dialkit/styles.css';
import { useCallback, useRef } from 'react';
import { HeroDriftLayer } from './hero-drift-layer';
import type { Breakpoint } from './hero-sticker-config';
import {
  HeroStickerField,
  type HeroStickerFieldHandle,
} from './hero-sticker-field';

/**
 * Dev-only wrapper: drives the hero field from a live DialKit panel so
 * placements + motion can be dialed in, then hard-coded into
 * hero-sticker-config.ts. Never mounts in production (see hero-field-mount).
 *
 * Workflow: drag stickers to place them, tune drift/bob in the panel, hit
 * "Copy layout JSON", and paste the numbers back into HERO_STICKERS.
 */
export function HeroDialKit() {
  const fieldRef = useRef<HeroStickerFieldHandle>(null);

  const dial = useDialKit(
    'Hero field',
    {
      drift: true,
      driftSpeed: [1, 0.2, 3, 0.05],
      driftScale: [1, 0.4, 2.5, 0.05],
      bob: true,
      bobIntensity: [0.55, 0, 1.5, 0.05],
      chipSize: [60, 36, 88, 1],
      breakpoint: {
        type: 'select',
        options: ['desktop', 'tablet', 'mobile'],
        default: 'desktop',
      },
      copyLayout: { type: 'action', label: 'Copy layout JSON' },
    },
    {
      id: 'hero-field',
      persist: true,
      onAction: useCallback((action: string) => {
        if (action !== 'copyLayout') {
          return;
        }
        const layout = fieldRef.current?.getLayout() ?? [];
        const json = JSON.stringify(layout, null, 2);
        // biome-ignore lint/suspicious/noConsole: dev-only dial kit output
        console.log('[hero dial] current layout:\n', json);
        navigator.clipboard?.writeText(json).catch(() => {
          /* clipboard may be blocked; the console copy still works */
        });
      }, []),
    }
  );

  const settings = {
    drift: dial.drift,
    driftSpeed: dial.driftSpeed,
    driftScale: dial.driftScale,
    bob: dial.bob,
    bobIntensity: dial.bobIntensity,
    chipSize: dial.chipSize,
  };

  return (
    <>
      <HeroDriftLayer settings={settings} />
      <HeroStickerField
        forcedBreakpoint={dial.breakpoint as Breakpoint}
        ref={fieldRef}
        settings={settings}
      />
      <DialRoot defaultOpen position="bottom-right" theme="system" />
    </>
  );
}
