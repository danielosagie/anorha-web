'use client';

import { useEffect, useRef } from 'react';
import type { Drifter, HeroFieldSettings } from './hero-sticker-config';
import {
  HERO_DRIFTERS,
  HERO_FIELD_SETTINGS,
  PETAL_FILLS,
  PETAL_PATHS,
  pathFor,
} from './hero-sticker-config';

/**
 * Ambient drift layer — tiny petals and a bee that flow left → right across the
 * hero, marquee style. Sparse and slow on purpose.
 *
 * Two transform layers so nothing fights:
 *   - .hero-drifter        (outer) → x travel across the hero, linear + looping
 *   - .hero-drifter-float  (inner) → gentle y float + slow tumble
 *
 * Not interactive (pointer-events: none) — the grabbable stickers are a
 * separate layer. Under reduced motion the items are simply placed, unmoving.
 */

type Props = {
  items?: Drifter[];
  settings?: HeroFieldSettings;
};

function PetalGlyph({ shape, fill }: { shape: 1 | 2; fill: string }) {
  return (
    <svg className="hero-petal" viewBox="0 0 24 32">
      <path d={PETAL_PATHS[shape]} fill={fill} />
      <path
        d="M12 6 C11 14 11 22 12 28"
        fill="none"
        stroke="rgba(255,255,255,.45)"
        strokeLinecap="round"
        strokeWidth="1"
      />
    </svg>
  );
}

function BeeGlyph() {
  return (
    <svg className="hero-bee" viewBox="0 0 34 24">
      <g className="hero-bee-wings">
        <ellipse
          cx="15"
          cy="7"
          fill="rgba(255,255,255,.8)"
          rx="6.2"
          ry="3.6"
          stroke="rgba(28,27,23,.2)"
          strokeWidth=".7"
        />
        <ellipse
          cx="21.5"
          cy="7.8"
          fill="rgba(255,255,255,.65)"
          rx="4.8"
          ry="2.9"
          stroke="rgba(28,27,23,.16)"
          strokeWidth=".7"
        />
      </g>
      <clipPath id="anorha-hero-bee-body">
        <ellipse cx="18" cy="14" rx="8.6" ry="5.8" />
      </clipPath>
      <ellipse cx="18" cy="14" fill="#e9a63f" rx="8.6" ry="5.8" />
      <g
        clipPath="url(#anorha-hero-bee-body)"
        stroke="#3a2f1b"
        strokeWidth="2.5"
      >
        <path d="M15 7 L15 21" />
        <path d="M20 7 L20 21" />
      </g>
      <circle cx="26" cy="13.2" fill="#3a2f1b" r="3.5" />
      <path
        d="M27.6 9.8 C29 8 30.2 7.4 31.2 7.2"
        fill="none"
        stroke="#3a2f1b"
        strokeLinecap="round"
        strokeWidth="1"
      />
      <path
        d="M9.4 14 C7.6 13.4 6.6 13.8 6 14.6"
        fill="none"
        stroke="#3a2f1b"
        strokeLinecap="round"
        strokeWidth="1.2"
      />
    </svg>
  );
}

export function HeroDriftLayer({
  items = HERO_DRIFTERS,
  settings = HERO_FIELD_SETTINGS,
}: Props) {
  const scopeRef = useRef<HTMLDivElement>(null);
  const { drift, driftSpeed } = settings;

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
      const [{ default: gsap }, { MotionPathPlugin }] = await Promise.all([
        import('gsap'),
        import('gsap/dist/MotionPathPlugin'),
      ]);
      if (cancelled) {
        return;
      }
      gsap.registerPlugin(MotionPathPlugin);

      const reduce = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;
      const outers = gsap.utils.toArray<HTMLElement>('.hero-drifter', scope);
      const inners = gsap.utils.toArray<HTMLElement>(
        '.hero-drifter-float',
        scope
      );

      const build = () => {
        gsap.killTweensOf([...outers, ...inners]);
        const width = window.innerWidth;

        outers.forEach((outer, i) => {
          const item = items[i];
          if (!item) {
            return;
          }
          // Reduced motion (or drift off): just place them, no travel.
          if (reduce || !drift) {
            gsap.set(outer, { x: width * (0.12 + i * 0.12) });
            return;
          }
          // Each drifter rides its OWN gentle wandering path across the hero.
          const points = pathFor(item, i, width);
          // Seed at the first waypoint, otherwise MotionPath prepends a
          // phantom segment from x0/y0 and the bee starts flying backwards.
          gsap.set(outer, { x: points[0].x, y: points[0].y });
          const travel = gsap.to(outer, {
            motionPath: {
              path: points,
              curviness: 1.35,
              autoRotate: item.kind === 'bee',
            },
            duration: item.dur / Math.max(driftSpeed, 0.05),
            ease: 'none',
            repeat: -1,
          });
          // Phase-shift across the loop so the gaps stay wide and even.
          travel.progress(i / outers.length);
        });

        if (reduce || !drift) {
          return;
        }

        inners.forEach((inner, i) => {
          const item = items[i];
          if (!item) {
            return;
          }
          // Secondary float on a deliberately non-harmonic period so the loop
          // never settles into a visible rhythm. y and rotation are separate
          // transform channels — no conflict.
          gsap.to(inner, {
            y: item.bob,
            duration: 2.3 + i * 0.47,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
          });
          if (item.spin) {
            gsap.to(inner, {
              rotation: 360 * item.spin,
              duration: (item.dur * 0.55) / Math.max(driftSpeed, 0.05),
              ease: 'none',
              repeat: -1,
            });
          }
        });
      };

      build();

      let resizeTimer: ReturnType<typeof setTimeout>;
      const onResize = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(build, 200);
      };
      window.addEventListener('resize', onResize);

      cleanup = () => {
        clearTimeout(resizeTimer);
        window.removeEventListener('resize', onResize);
        gsap.killTweensOf([...outers, ...inners]);
      };
    })();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [items, drift, driftSpeed]);

  return (
    <div aria-hidden="true" className="hero-drift-layer" ref={scopeRef}>
      {items.map((item) => {
        const size = item.size * settings.driftScale;
        const style =
          item.kind === 'bee'
            ? { width: `${size}px`, height: `${(size * 24) / 34}px` }
            : { width: `${(size * 24) / 32}px`, height: `${size}px` };
        return (
          <div
            className="hero-drifter"
            key={item.id}
            style={{ top: `${item.top}%` }}
          >
            <div className="hero-drifter-float" style={style}>
              {item.kind === 'bee' ? (
                <BeeGlyph />
              ) : (
                <PetalGlyph
                  fill={PETAL_FILLS[item.fill ?? 0] ?? PETAL_FILLS[0]}
                  shape={item.shape ?? 1}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
