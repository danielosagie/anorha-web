'use client';

import { useEffect } from 'react';

/**
 * Drives the pinned Sprout stage.
 *
 * The section is a tall runway; the stage inside it is sticky (CSS), so one
 * card stays put while the five beats cross-fade through it — you scroll *into*
 * the feature rather than past it (the bevel.health "Intelligence" pattern).
 *
 * This component only maps scroll progress to the stage's `data-active`
 * attribute. The cross-fade itself is pure CSS keyed off that attribute, so the
 * lit beat is correct from SSR (`data-active="0"`) and never depends on a JS
 * tick to reveal — a GSAP-tween reveal here left the stage blank on first
 * paint. It also means the whole thing degrades gracefully: on narrow screens
 * and under reduced motion the CSS simply doesn't pin or hide anything, so the
 * panels fall back to the stacked layout and `data-active` is inert.
 *
 * ScrollTrigger is used only to read scroll position; it updates on Lenis
 * scroll events (see smooth-scroll.tsx) and on native scroll.
 */
export function SproutScrollSync() {
  useEffect(() => {
    const section = document.querySelector<HTMLElement>('.sprout-features');
    const stage = section?.querySelector<HTMLElement>('.sprout-stage');
    if (!(section && stage)) {
      return;
    }

    const BEATS = section.querySelectorAll('[data-layer]').length;
    if (BEATS === 0) {
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

      const setActive = (n: number) => {
        const next = String(Math.min(BEATS - 1, Math.max(0, n)));
        if (stage.dataset.active !== next) {
          stage.dataset.active = next;
        }
      };

      const trigger = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => setActive(Math.floor(self.progress * BEATS)),
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
