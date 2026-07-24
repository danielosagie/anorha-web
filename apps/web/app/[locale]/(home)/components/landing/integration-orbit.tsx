'use client';

import { useEffect, useRef } from 'react';

/**
 * Marketplace integrations riding the orbit rings.
 *
 * They stream along their ring like a marquee — enter low on the right, arc up
 * and out past the top left, wrap around. Grab one and it PEELS OFF its orbit:
 * the ring lets go and the sticker stays wherever you drop it.
 *
 * Two transform layers so the orbit and the drag never write the same one:
 *   - .orbit-arm   (outer) → orbit position along the ring
 *   - .orbit-chip  (inner) → GSAP Draggable: peel off and place
 *
 * Geometry matches the rings SVG exactly (viewBox 1240x640, centre 240/620,
 * radii 300/440/580), so the chips ride the drawn lines at any panel width.
 */

const VIEW_W = 1240;
const VIEW_H = 640;
const CX = 240;
const CY = 620;

type OrbitItem = { id: string; icon: string; rotate: number };

type Ring = {
  r: number;
  /** seconds for one full pass through the sweep */
  dur: number;
  /**
   * Sweep in degrees, screen space (0 = east, negative = up). Per ring, not
   * shared: each radius leaves the panel's left edge at a different angle, so
   * one range can't wrap cleanly for all three. Start is far enough below the
   * panel and end far enough past the left edge that the wrap happens
   * off-screen and reads as a continuous marquee.
   */
  start: number;
  end: number;
  items: OrbitItem[];
};

const RINGS: Ring[] = [
  {
    r: 300,
    dur: 38,
    start: 13,
    end: -160,
    items: [
      { id: 'clover', icon: 'clover', rotate: 7 },
      { id: 'depop', icon: 'depop', rotate: -6 },
    ],
  },
  {
    r: 440,
    dur: 46,
    start: 9,
    end: -132,
    items: [
      { id: 'facebook', icon: 'facebook', rotate: 4 },
      { id: 'square', icon: 'square', rotate: -5 },
    ],
  },
  {
    r: 580,
    dur: 54,
    start: 7,
    end: -121,
    items: [
      { id: 'ebay', icon: 'ebay', rotate: -8 },
      { id: 'shopify', icon: 'shopify', rotate: 6 },
      { id: 'whatnot', icon: 'whatnot', rotate: 9 },
    ],
  },
];

const ALL_ITEMS = RINGS.flatMap((ring) =>
  ring.items.map((item) => ({ ...item, r: ring.r }))
);

export function IntegrationOrbit() {
  const scopeRef = useRef<HTMLDivElement>(null);
  // ids that have been pulled off their ring — they stay where they're dropped
  const peeledRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const scope = scopeRef.current;
    if (!scope) {
      return;
    }

    let cleanup = () => {
      /* replaced once GSAP loads */
    };
    let cancelled = false;

    (async () => {
      const [{ default: gsap }, { Draggable }, { InertiaPlugin }] =
        await Promise.all([
          import('gsap'),
          import('gsap/dist/Draggable'),
          import('gsap/dist/InertiaPlugin'),
        ]);
      if (cancelled) {
        return;
      }
      gsap.registerPlugin(Draggable, InertiaPlugin);

      const reduce = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;
      const panel = scope.closest('.store-manage-panel') ?? scope;

      const armFor = (id: string) =>
        scope.querySelector<HTMLElement>(`[data-arm="${id}"]`);

      // Place one item on its ring at a given sweep progress (0..1).
      const place = (ring: Ring, id: string, progress: number) => {
        const arm = armFor(id);
        if (!arm || peeledRef.current.has(id)) {
          return;
        }
        const { r } = ring;
        const rect = panel.getBoundingClientRect();
        const angle = ring.start + (ring.end - ring.start) * progress;
        const rad = (angle * Math.PI) / 180;
        const x = ((CX + r * Math.cos(rad)) / VIEW_W) * rect.width;
        const y = ((CY + r * Math.sin(rad)) / VIEW_H) * rect.height;
        gsap.set(arm, { x, y, xPercent: -50, yPercent: -50 });
      };

      const tweens: Array<{ kill: () => void }> = [];

      for (const ring of RINGS) {
        const n = ring.items.length;
        // Seed static positions first so there's no flash before the first tick.
        ring.items.forEach((item, i) => place(ring, item.id, i / n));

        if (reduce) {
          continue;
        }

        // One proxy per ring drives every item on it; each item is offset by
        // i/n so the ring stays evenly populated as they stream through.
        const proxy = { t: 0 };
        tweens.push(
          gsap.to(proxy, {
            t: 1,
            duration: ring.dur,
            ease: 'none',
            repeat: -1,
            onUpdate: () => {
              ring.items.forEach((item, i) => {
                place(ring, item.id, (proxy.t + i / n) % 1);
              });
            },
          })
        );
      }

      // Peel off and place.
      const chips = gsap.utils.toArray<HTMLElement>('.orbit-chip', scope);
      const draggables: Array<{ kill: () => void }> = [];
      for (const chip of chips) {
        const id = chip.dataset.id;
        const [instance] = Draggable.create(chip, {
          type: 'x,y',
          bounds: panel,
          inertia: !reduce,
          dragResistance: 0.06,
          edgeResistance: 0.72,
          allowContextMenu: true,
          zIndexBoost: true,
          cursor: 'grab',
          activeCursor: 'grabbing',
          onPress() {
            if (id) {
              // the ring lets go of it for good
              peeledRef.current.add(id);
            }
            chip.classList.add('is-held', 'is-peeled');
          },
          onRelease() {
            chip.classList.remove('is-held');
          },
        });
        if (instance) {
          draggables.push(instance);
        }
      }

      // Keep un-peeled chips glued to the rings when the panel resizes.
      let resizeTimer: ReturnType<typeof setTimeout>;
      const onResize = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          for (const ring of RINGS) {
            const n = ring.items.length;
            ring.items.forEach((item, i) => place(ring, item.id, i / n));
          }
        }, 200);
      };
      window.addEventListener('resize', onResize);

      cleanup = () => {
        clearTimeout(resizeTimer);
        window.removeEventListener('resize', onResize);
        for (const t of tweens) {
          t.kill();
        }
        for (const d of draggables) {
          d.kill();
        }
      };
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return (
    <div className="orbit-platforms" ref={scopeRef}>
      {ALL_ITEMS.map((item) => (
        <div className="orbit-arm" data-arm={item.id} key={item.id}>
          <span
            className="orbit-chip"
            data-id={item.id}
            style={{ transform: `rotate(${item.rotate}deg)` }}
          >
            {/* Local trusted brand SVGs; next/image blocks SVG by default. */}
            {/* biome-ignore lint/nursery/noImgElement: static brand SVG */}
            <img alt="" className="orbit-icon" src={`/assets/platforms/${item.icon}.svg`} />
          </span>
        </div>
      ))}
    </div>
  );
}
