'use client';

import { useEffect } from 'react';

/**
 * Drives the cart sheet on the Photo card.
 *
 * The sheet starts up and slides down as the section centres, so scrolling into
 * it reveals the camera underneath. One card shows both halves of the step, the
 * cart it lands in and the shot itself.
 *
 * Writes one custom property, `--cf-cart` (0 down, 1 fully up), and nothing
 * else. CSS owns the actual movement, so under reduced motion the sheet simply
 * rests at its open position and never animates.
 */
export function CoreFeaturesCart() {
  useEffect(() => {
    const section = document.querySelector<HTMLElement>('.core-features');
    if (!section) {
      return;
    }

    const calm = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;

    const clamp = (value: number) => Math.min(1, Math.max(0, value));
    // Smoothstep, so the sheet eases at both ends instead of tracking linearly.
    const ease = (value: number) => {
      const t = clamp(value);
      return t * t * (3 - 2 * t);
    };

    const paint = () => {
      frame = 0;
      const rect = section.getBoundingClientRect();
      const viewport = window.innerHeight;

      // How centred the section is: 1 when its middle meets the viewport's
      // middle, falling to 0 by the time it is a full half-viewport away.
      const middle = rect.top + rect.height / 2;
      const offset = Math.abs(middle - viewport / 2);
      const reach = viewport * 0.62;
      // Inverted on purpose: the cart starts up and slides DOWN as the section
      // centres, so scrolling in reveals the camera underneath rather than
      // burying it. 1 is up, 0 is down.
      const openness = 1 - ease(1 - offset / reach);

      section.style.setProperty('--cf-cart', openness.toFixed(4));
    };

    const queue = () => {
      if (calm.matches) {
        section.style.removeProperty('--cf-cart');
        return;
      }
      if (!frame) {
        frame = requestAnimationFrame(paint);
      }
    };

    queue();
    window.addEventListener('scroll', queue, { passive: true });
    window.addEventListener('resize', queue, { passive: true });
    calm.addEventListener('change', queue);

    return () => {
      if (frame) {
        cancelAnimationFrame(frame);
      }
      section.style.removeProperty('--cf-cart');
      window.removeEventListener('scroll', queue);
      window.removeEventListener('resize', queue);
      calm.removeEventListener('change', queue);
    };
  }, []);

  return null;
}
