'use client';

import { useEffect, useRef } from 'react';

/**
 * Marketplace integrations riding the orbit rings.
 *
 * They stream along their ring like a marquee — enter below the panel, arc up
 * and out past the left edge, wrap. Grab one and it peels off: the ring lets go
 * and it stays wherever you drop it. Drop it back near ANY ring and it rejoins
 * the spin from that exact angle.
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
/** how close to a ring (design px) a drop has to land to rejoin the spin */
const SNAP = 58;

type OrbitItem = { id: string; icon: string; rotate: number };

type Ring = {
  r: number;
  /** seconds for one full pass through the sweep */
  dur: number;
  /**
   * Sweep in degrees, screen space (0 = east, negative = up). Per ring, not
   * shared: each radius leaves the panel's left edge at a different angle, so
   * one range can't wrap cleanly for all three. Start sits below the panel and
   * end past the left edge, so the wrap happens off-screen.
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
      { id: 'etsy', icon: 'etsy', rotate: -4 },
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

const ALL_ITEMS = RINGS.flatMap((ring, ringIndex) =>
  ring.items.map((item, i) => ({
    ...item,
    ringIndex,
    offset: i / ring.items.length,
  }))
);

/** Mutable runtime state — an item can change rings or come off entirely. */
type ItemState = { ringIndex: number; offset: number; peeled: boolean };

export function IntegrationOrbit() {
  const scopeRef = useRef<HTMLDivElement>(null);

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

      const state = new Map<string, ItemState>(
        ALL_ITEMS.map((it) => [
          it.id,
          { ringIndex: it.ringIndex, offset: it.offset, peeled: false },
        ])
      );
      // one playhead per ring, kept so a rejoining chip can phase itself in
      const playheads = RINGS.map(() => ({ t: 0 }));

      const armFor = (id: string) =>
        scope.querySelector<HTMLElement>(`[data-arm="${id}"]`);

      /** Place an item on `ring` at sweep progress 0..1. */
      const place = (ring: Ring, id: string, progress: number) => {
        const arm = armFor(id);
        if (!arm) {
          return;
        }
        const rect = panel.getBoundingClientRect();
        const angle = ring.start + (ring.end - ring.start) * progress;
        const rad = (angle * Math.PI) / 180;
        const x = ((CX + ring.r * Math.cos(rad)) / VIEW_W) * rect.width;
        const y = ((CY + ring.r * Math.sin(rad)) / VIEW_H) * rect.height;
        gsap.set(arm, { x, y, xPercent: -50, yPercent: -50 });
      };

      const renderRing = (ringIndex: number) => {
        const ring = RINGS[ringIndex];
        const t = playheads[ringIndex].t;
        for (const [id, s] of state) {
          if (s.ringIndex === ringIndex && !s.peeled) {
            place(ring, id, (t + s.offset) % 1);
          }
        }
      };

      // Seed positions before the first tick so nothing flashes at 0,0.
      RINGS.forEach((_, i) => renderRing(i));

      const tweens: Array<{ kill: () => void }> = [];
      if (!reduce) {
        RINGS.forEach((ring, i) => {
          tweens.push(
            gsap.to(playheads[i], {
              t: 1,
              duration: ring.dur,
              ease: 'none',
              repeat: -1,
              onUpdate: () => renderRing(i),
            })
          );
        });
      }

      /** px position of a ring's sweep point, in the arm's coordinate space. */
      const ringPoint = (ring: Ring, progress: number) => {
        const rect = panel.getBoundingClientRect();
        const angle = ring.start + (ring.end - ring.start) * progress;
        const rad = (angle * Math.PI) / 180;
        return {
          x: ((CX + ring.r * Math.cos(rad)) / VIEW_W) * rect.width,
          y: ((CY + ring.r * Math.sin(rad)) / VIEW_H) * rect.height,
        };
      };

      /**
       * If the chip was dropped near a ring, get pulled back into the spin —
       * like a planet caught by gravity. The chip glides from where it was
       * dropped onto the ring, easing in (slow, then accelerating) and settling
       * smoothly into the orbit's pace, then the ring takes over seamlessly.
       */
      const tryRejoin = (chip: HTMLElement, id: string) => {
        const s = state.get(id);
        const arm = armFor(id);
        if (!(s && arm)) {
          return;
        }
        const pr = panel.getBoundingClientRect();
        const cr = chip.getBoundingClientRect();
        const dx =
          ((cr.left + cr.width / 2 - pr.left) / pr.width) * VIEW_W - CX;
        const dy =
          ((cr.top + cr.height / 2 - pr.top) / pr.height) * VIEW_H - CY;
        const radius = Math.hypot(dx, dy);

        let best = -1;
        let bestDist = Number.POSITIVE_INFINITY;
        RINGS.forEach((ring, i) => {
          const d = Math.abs(radius - ring.r);
          if (d < bestDist) {
            bestDist = d;
            best = i;
          }
        });
        if (best < 0 || bestDist > SNAP) {
          return; // stays where it was dropped
        }

        const ring = RINGS[best];
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        const progress = Math.min(
          1,
          Math.max(0, (angle - ring.start) / (ring.end - ring.start))
        );

        // The arm stays frozen while the chip's own transform glides onto the
        // ring point, so there is no jump. Distance scales the duration a
        // little, so a far drop takes a beat longer to be reeled in.
        const target = ringPoint(ring, progress);
        const armX = Number(gsap.getProperty(arm, 'x'));
        const armY = Number(gsap.getProperty(arm, 'y'));
        const chipX = Number(gsap.getProperty(chip, 'x'));
        const chipY = Number(gsap.getProperty(chip, 'y'));
        const reach = Math.hypot(
          target.x - armX - chipX,
          target.y - armY - chipY
        );
        const duration = Math.min(1.5, 0.7 + reach / 900);

        gsap.to(chip, {
          x: target.x - armX,
          y: target.y - armY,
          duration,
          ease: 'power2.inOut', // slow in, accelerate, settle to orbit pace
          overwrite: true,
          onComplete() {
            // Hand off to the orbit at this angle, no visual jump: the chip is
            // already sitting on the ring point.
            const t = playheads[best].t;
            s.ringIndex = best;
            s.offset = (((progress - t) % 1) + 1) % 1;
            place(ring, id, progress);
            gsap.set(chip, { x: 0, y: 0 });
            s.peeled = false;
            chip.classList.remove('is-peeled');
          },
        });
      };

      const chips = gsap.utils.toArray<HTMLElement>('.orbit-chip', scope);
      const draggables: Array<{ kill: () => void }> = [];
      for (const chip of chips) {
        const id = chip.dataset.id ?? '';
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
            // Interrupt an in-flight re-capture cleanly if grabbed again.
            gsap.killTweensOf(chip);
            const s = state.get(id);
            if (s) {
              s.peeled = true; // the ring lets go
            }
            chip.classList.add('is-held', 'is-peeled');
          },
          onRelease() {
            chip.classList.remove('is-held');
          },
          onDragEnd() {
            // With inertia on, wait for the throw to settle instead.
            if (reduce) {
              tryRejoin(chip, id);
            }
          },
          onThrowComplete() {
            tryRejoin(chip, id);
          },
        });
        if (instance) {
          draggables.push(instance);
        }
      }

      // Keep ringed chips glued to the rings when the panel resizes.
      let resizeTimer: ReturnType<typeof setTimeout>;
      const onResize = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
          RINGS.forEach((_, i) => renderRing(i));
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
            <img
              alt=""
              className="orbit-icon"
              src={`/assets/platforms/${item.icon}.svg`}
            />
          </span>
        </div>
      ))}
    </div>
  );
}
