'use client';

import { useEffect } from 'react';

/**
 * Lenis smooth scroll for the landing page, wired to GSAP so ScrollTrigger
 * reads the smoothed position. This is what gives the pinned Sprout section
 * (and every scroll reveal) the bevel.health glide instead of a raw wheel jump.
 *
 * Renders nothing. Skipped under reduced motion, where native scroll is left
 * untouched. Everything loads dynamically so it never blocks first paint.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    let cleanup = () => {
      /* replaced once loaded */
    };
    let cancelled = false;

    (async () => {
      const [{ default: Lenis }, { default: gsap }, { ScrollTrigger }] =
        await Promise.all([
          import('lenis'),
          import('gsap'),
          import('gsap/dist/ScrollTrigger'),
        ]);
      if (cancelled) {
        return;
      }
      gsap.registerPlugin(ScrollTrigger);

      const lenis = new Lenis({
        duration: 1.1,
        // gentle, natural deceleration — not floaty
        easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
        smoothWheel: true,
      });

      // Lenis drives ScrollTrigger; GSAP's ticker drives Lenis.
      lenis.on('scroll', ScrollTrigger.update);
      const raf = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);

      cleanup = () => {
        gsap.ticker.remove(raf);
        gsap.ticker.lagSmoothing(500, 33);
        lenis.destroy();
      };
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return null;
}
