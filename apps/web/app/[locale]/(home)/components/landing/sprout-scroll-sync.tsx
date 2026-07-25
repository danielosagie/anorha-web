'use client';

import { useEffect } from 'react';

/**
 * Drives the pinned Sprout scene (the bevel.health "Intelligence" pattern):
 * the phone stays anchored while the copy scrolls up beside it, and the phone
 * screen swaps to whichever beat you're reading.
 *
 * Sets the stage's `data-active` to the copy beat nearest the viewport centre.
 * The cross-fade itself is pure CSS keyed off that attribute, with an SSR
 * default of `data-active="0"`, so the first beat paints without any JS.
 *
 * Deliberately a plain scroll listener rather than ScrollTrigger: ScrollTrigger
 * caches trigger bounds at creation, and if it measures before the section has
 * its final height the active range is wrong and onUpdate never fires where it
 * matters — which is exactly what stopped the phone from swapping. A listener
 * reading live getBoundingClientRect can't go stale. Lenis dispatches native
 * scroll events, so smooth scrolling drives this too.
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

    // Only the pinned desktop layout uses data-active; on mobile every card is
    // shown stacked and the attribute is inert.
    const pinned = window.matchMedia(
      '(min-width: 901px) and (prefers-reduced-motion: no-preference)'
    );

    let frame = 0;

    const sync = () => {
      frame = 0;
      if (!pinned.matches) {
        return;
      }
      const mid = window.innerHeight / 2;
      let nearest = 0;
      let best = Number.POSITIVE_INFINITY;
      for (const [i, beat] of beats.entries()) {
        const rect = beat.getBoundingClientRect();
        const dist = Math.abs(rect.top + rect.height / 2 - mid);
        if (dist < best) {
          best = dist;
          nearest = i;
        }
      }
      const next = String(nearest);
      if (stage.dataset.active !== next) {
        stage.dataset.active = next;
      }
    };

    // Coalesce to one measurement per frame.
    const onScroll = () => {
      if (!frame) {
        frame = requestAnimationFrame(sync);
      }
    };

    sync();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    pinned.addEventListener('change', sync);

    return () => {
      if (frame) {
        cancelAnimationFrame(frame);
      }
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      pinned.removeEventListener('change', sync);
    };
  }, []);

  return null;
}
