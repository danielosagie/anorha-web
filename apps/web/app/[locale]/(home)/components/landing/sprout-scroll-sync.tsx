'use client';

import { useEffect } from 'react';

/**
 * Drives the pinned Sprout section.
 *
 * One card stays pinned in the middle of the viewport and its whole contents —
 * gradient, copy and phone — cross-fade from beat to beat as you scroll. The
 * copy lives inside the card so it is always composed with the phone; nothing
 * scrolls independently past the card.
 *
 * This sets the stage's `data-active` from the section's scroll progress. The
 * cross-fade itself is pure CSS keyed off that attribute, with an SSR default
 * of `data-active="0"`, so the first beat paints without any JS.
 *
 * A plain scroll listener on purpose: ScrollTrigger caches its bounds at
 * creation, and measuring before the section reaches its final height left the
 * active range wrong so the phone never swapped. Reading live geometry can't go
 * stale. Lenis dispatches native scroll events, so smooth scrolling drives it.
 */
export function SproutScrollSync() {
  useEffect(() => {
    const section = document.querySelector<HTMLElement>('.sprout-features');
    const stage = section?.querySelector<HTMLElement>('.sprout-stage');
    if (!(section && stage)) {
      return;
    }

    const beats = section.querySelectorAll('[data-layer]').length;
    if (beats === 0) {
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
      const rect = section.getBoundingClientRect();
      // The card is pinned while the section spans the viewport top; progress
      // runs 0 -> 1 across exactly that range.
      const range = rect.height - window.innerHeight;
      const progress = range > 0 ? -rect.top / range : 0;
      const index = Math.min(
        beats - 1,
        Math.max(0, Math.floor(progress * beats))
      );
      const next = String(index);
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
