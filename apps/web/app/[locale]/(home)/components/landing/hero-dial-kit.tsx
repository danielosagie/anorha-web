'use client';

import { DialRoot, useDialKit } from 'dialkit';
import 'dialkit/styles.css';
import { HeroDriftLayer } from './hero-drift-layer';

/**
 * Dev-only wrapper: drives the hero drift layer from a live DialKit panel so
 * the petals + bee can be dialed in, then hard-coded into
 * hero-drift-config.ts. Never mounts in production (see hero-field-mount).
 */
export function HeroDialKit() {
  const dial = useDialKit(
    'Hero drift',
    {
      drift: true,
      driftSpeed: [1, 0.2, 3, 0.05],
      driftScale: [1, 0.4, 2.5, 0.05],
    },
    { id: 'hero-drift', persist: true }
  );

  return (
    <>
      <HeroDriftLayer
        settings={{
          drift: dial.drift,
          driftSpeed: dial.driftSpeed,
          driftScale: dial.driftScale,
        }}
      />
      <DialRoot defaultOpen position="bottom-right" theme="system" />
    </>
  );
}
