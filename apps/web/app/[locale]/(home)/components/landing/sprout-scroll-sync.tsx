'use client';

import { useEffect } from 'react';

/**
 * Drives the pinned Sprout scene (the bevel.health "Intelligence" pattern).
 *
 * The phone is anchored in a sticky scene on the right while the copy scrolls
 * up the left. This sets the stage's `data-active` to whichever copy beat is
 * nearest the viewport centre; a pure-CSS cross-fade (keyed off that attribute)
 * swaps the phone screen + floating badges to match. The reveal is CSS + an SSR
 * default of `data-active="0"`, so it never depends on a JS tick to paint.
 *
 * ScrollTrigger is used only to sample scroll position — it updates on Lenis
 * scroll events (see smooth-scroll.tsx) and on native scroll. Bails on narrow
 * screens / reduced motion, where the CSS drops the pin and the panels fall
 * back to the stacked layout with their own in-panel copy.
 */
export function SproutScrollSync() {
  useEffect(() => {
    const section = document.querySelector<HTMLElement>('.sprout-features');
    const stage = section?.querySelector<HTMLElement>('.sprout-stage');
    if (!(section && stage)) {
      return;
    }

    const beats = Array.from(
      section.querySelectorAll<HTMLElement>('.sprout-copy-beat')
    );
    if (beats.length === 0) {
      return;
    }

    let cleanup = () => {
      /* replaced once GSAP loads */
    };
    let cancelled = false;

    (async () => {
      const { ScrollTrigger } = await import('gsap/dist/ScrollTrigger');
      const { default: gsap } = await import('gsap');
      if (cancelled) {
        return;
      }
      gsap.registerPlugin(ScrollTrigger);

      const sync = () => {
        const mid = window.innerHeight / 2;
        let nearest = 0;
        let best = Number.POSITIVE_INFINITY;
        beats.forEach((beat, i) => {
          const rect = beat.getBoundingClientRect();
          const dist = Math.abs(rect.top + rect.height / 2 - mid);
          if (dist < best) {
            best = dist;
            nearest = i;
          }
        });
        const next = String(nearest);
        if (stage.dataset.active !== next) {
          stage.dataset.active = next;
        }
      };

      const trigger = ScrollTrigger.create({
        trigger: section,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: sync,
        onRefresh: sync,
      });

      cleanup = () => {
        trigger.kill();
      };
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return null;
}
