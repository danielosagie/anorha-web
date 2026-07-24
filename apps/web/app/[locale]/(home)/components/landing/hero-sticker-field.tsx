'use client';

import type { CSSProperties } from 'react';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import type {
  Breakpoint,
  HeroFieldSettings,
  StickerItem,
} from './hero-sticker-config';
import {
  HERO_FIELD_SETTINGS,
  HERO_STICKERS,
  placementFor,
  windFor,
} from './hero-sticker-config';

/**
 * Marketplace stickers pinned in the hero margins — grab, throw and place them.
 *
 * Two layers so drag and sway never write the same transform:
 *   - .hero-sticker       (outer) → GSAP Draggable + Inertia: throw & place
 *   - .hero-sticker-sway  (inner) → gentle ambient sway, looped
 *
 * No mouse parallax. Petals + the bee live in the separate drift layer.
 */

export type HeroStickerFieldHandle = {
  /** current placements (base + any drag offset) for the active breakpoint */
  getLayout: () => Array<{ id: string; left: number; top: number }>;
};

type Props = {
  items?: StickerItem[];
  settings?: HeroFieldSettings;
  /** dial kit can force a breakpoint to preview declutter; else auto */
  forcedBreakpoint?: Breakpoint;
};

const bpScale: Record<Breakpoint, number> = {
  desktop: 1,
  tablet: 0.82,
  mobile: 0.72,
};

function useAutoBreakpoint(forced?: Breakpoint): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>(forced ?? 'desktop');
  useEffect(() => {
    if (forced) {
      setBp(forced);
      return;
    }
    const compute = () => {
      const w = window.innerWidth;
      setBp(w <= 560 ? 'mobile' : w <= 900 ? 'tablet' : 'desktop');
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [forced]);
  return bp;
}

export const HeroStickerField = forwardRef<HeroStickerFieldHandle, Props>(
  function HeroStickerField(
    { items = HERO_STICKERS, settings = HERO_FIELD_SETTINGS, forcedBreakpoint },
    ref
  ) {
    const scopeRef = useRef<HTMLDivElement>(null);
    const bp = useAutoBreakpoint(forcedBreakpoint);
    const gsapRef = useRef<typeof import('gsap').default | null>(null);
    const draggableRef = useRef<
      typeof import('gsap/dist/Draggable').Draggable | null
    >(null);
    const [gsapReady, setGsapReady] = useState(false);

    const visible = items.filter((it) => !it.hideOn?.includes(bp));

    useImperativeHandle(
      ref,
      () => ({
        getLayout: () => {
          const gsap = gsapRef.current;
          const scope = scopeRef.current;
          if (!(gsap && scope)) {
            return [];
          }
          const rect = (
            scope.closest('.landing-hero') ?? scope
          ).getBoundingClientRect();
          return visible.map((it) => {
            const base = placementFor(it, bp);
            const el = scope.querySelector<HTMLElement>(`[data-id="${it.id}"]`);
            const dx = el ? Number(gsap.getProperty(el, 'x')) : 0;
            const dy = el ? Number(gsap.getProperty(el, 'y')) : 0;
            return {
              id: it.id,
              left: Math.round((base.left + (dx / rect.width) * 100) * 10) / 10,
              top: Math.round((base.top + (dy / rect.height) * 100) * 10) / 10,
            };
          });
        },
      }),
      [visible, bp]
    );

    // Load GSAP + plugins once (client only).
    useEffect(() => {
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
        gsapRef.current = gsap;
        draggableRef.current = Draggable;
        setGsapReady(true);
      })();
      return () => {
        cancelled = true;
      };
    }, []);

    // Drag + throw + place. Rebuilds only when the rendered set changes.
    useEffect(() => {
      const gsap = gsapRef.current;
      const scope = scopeRef.current;
      const Draggable = draggableRef.current;
      if (!(gsapReady && gsap && scope && Draggable)) {
        return;
      }
      const reduce = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;
      const bounds = scope.closest('.landing-hero') ?? scope;
      const outers = gsap.utils.toArray<HTMLElement>('.hero-sticker', scope);
      const created: Array<{ kill: () => void }> = [];
      for (const outer of outers) {
        const [instance] = Draggable.create(outer, {
          type: 'x,y',
          bounds,
          inertia: !reduce,
          dragResistance: 0.08,
          edgeResistance: 0.72,
          allowContextMenu: true,
          zIndexBoost: true,
          cursor: 'grab',
          activeCursor: 'grabbing',
          onPress() {
            outer.classList.add('is-held');
          },
          onRelease() {
            outer.classList.remove('is-held');
          },
        });
        if (instance) {
          created.push(instance);
        }
      }
      return () => {
        for (const d of created) {
          d.kill();
        }
      };
    }, [gsapReady, bp]);

    // Ambient sway. Rebuilds on bob change WITHOUT touching drag positions
    // (it targets the inner .hero-sticker-sway, drag lives on the outer).
    useEffect(() => {
      const gsap = gsapRef.current;
      const scope = scopeRef.current;
      if (!(gsapReady && gsap && scope)) {
        return;
      }
      const reduce = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;
      if (reduce || !settings.bob || settings.bobIntensity <= 0) {
        return;
      }
      const sways = gsap.utils.toArray<HTMLElement>(
        '.hero-sticker-sway',
        scope
      );
      const tweens = sways.map((sway, i) => {
        const item = visible[i];
        const base = placementFor(item, bp);
        const w = windFor(i, settings.bobIntensity);
        return gsap.fromTo(
          sway,
          { rotation: base.rotate - w.rot, x: -w.x, y: -w.y },
          {
            rotation: base.rotate + w.rot,
            x: w.x,
            y: w.y,
            duration: w.dur,
            delay: w.delay,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
            immediateRender: false,
            transformOrigin: '50% 50%',
          }
        );
      });
      return () => {
        for (const t of tweens) {
          t.kill();
        }
      };
    }, [gsapReady, bp, settings.bob, settings.bobIntensity, visible]);

    const rootStyle = {
      '--hero-chip-size': `${Math.round(settings.chipSize * bpScale[bp])}px`,
    } as CSSProperties;

    return (
      <div
        aria-hidden="true"
        className="hero-sticker-field"
        ref={scopeRef}
        style={rootStyle}
      >
        {visible.map((item) => {
          const p = placementFor(item, bp);
          return (
            <div
              className="hero-sticker"
              data-id={item.id}
              key={item.id}
              style={{ left: `${p.left}%`, top: `${p.top}%` }}
            >
              <div
                className="hero-sticker-sway"
                style={{
                  transform: `rotate(${p.rotate}deg) scale(${p.scale})`,
                }}
              >
                <span className="hero-sticker-chip">
                  {/* Local trusted brand SVGs; next/image blocks SVG by default. */}
                  {/* biome-ignore lint/nursery/noImgElement: static brand SVG */}
                  <img
                    alt=""
                    className="hero-sticker-icon"
                    src={`/assets/platforms/${item.icon}.svg`}
                  />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }
);
