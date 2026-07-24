'use client';

import { useEffect } from 'react';

/**
 * Drives the pinned Sprout stage.
 *
 * The section is a tall runway; the stage inside it is sticky, so one card
 * stays put while the five beats cross-fade through it — you scroll *into* the
 * feature rather than past it (the bevel.health "Intelligence" pattern).
 *
 * Renders nothing: it only wires ScrollTrigger to markup the server already
 * rendered, so the panels stay server-side and this ships ~nothing.
 *
 * Bails out entirely under reduced motion or on narrow screens, where the CSS
 * falls back to the plain stacked layout and every panel is simply visible.
 */
export function SproutScrollSync() {
  useEffect(() => {
    const section = document.querySelector<HTMLElement>('.sprout-features');
    if (!section) {
      return;
    }

    const media = window.matchMedia(
      '(min-width: 901px) and (prefers-reduced-motion: no-preference)'
    );

    let cleanup = () => {
      /* replaced once GSAP loads */
    };
    let cancelled = false;

    (async () => {
      const [{ default: gsap }, { ScrollTrigger }] = await Promise.all([
        import('gsap'),
        import('gsap/dist/ScrollTrigger'),
      ]);
      if (cancelled) {
        return;
      }
      gsap.registerPlugin(ScrollTrigger);

      const build = () => {
        const layers = gsap.utils.toArray<HTMLElement>(
          '[data-layer]',
          section
        );
        const dots = gsap.utils.toArray<HTMLElement>('[data-dot]', section);
        if (layers.length === 0) {
          return () => {
            /* nothing built */
          };
        }

        // Stacked layout (mobile / reduced motion): show everything, no pin.
        if (!media.matches) {
          gsap.set(layers, { clearProps: 'all' });
          for (const dot of dots) {
            dot.classList.remove('is-active');
          }
          return () => {
            /* nothing to tear down */
          };
        }

        let active = -1;
        const show = (next: number) => {
          if (next === active) {
            return;
          }
          active = next;
          layers.forEach((layer, i) => {
            const on = i === next;
            gsap.to(layer, {
              autoAlpha: on ? 1 : 0,
              duration: on ? 0.45 : 0.3,
              ease: on ? 'power2.out' : 'power1.in',
              // incoming rises slightly — reads as depth, not a slideshow
              scale: on ? 1 : 0.985,
              y: on ? 0 : 14,
              overwrite: 'auto',
            });
            layer.style.pointerEvents = on ? 'auto' : 'none';
          });
          dots.forEach((dot, i) => {
            dot.classList.toggle('is-active', i === next);
          });
        };

        gsap.set(layers, { autoAlpha: 0, scale: 0.985, y: 14 });
        show(0);

        const trigger = ScrollTrigger.create({
          trigger: section,
          start: 'top top',
          end: 'bottom bottom',
          onUpdate: (self) => {
            // Split the runway evenly across the beats.
            const raw = Math.floor(self.progress * layers.length);
            show(Math.min(layers.length - 1, Math.max(0, raw)));
          },
        });

        return () => {
          trigger.kill();
          gsap.set(layers, { clearProps: 'all' });
        };
      };

      let teardown = build();
      const rebuild = () => {
        teardown();
        teardown = build();
        ScrollTrigger.refresh();
      };
      media.addEventListener('change', rebuild);

      cleanup = () => {
        media.removeEventListener('change', rebuild);
        teardown();
      };
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return null;
}
