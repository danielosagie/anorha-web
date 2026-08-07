'use client';

import { useEffect, useRef } from 'react';

/**
 * "One item, start to ready."
 *
 * The shot is driven by `phase`, which the section sets from scroll position:
 * 0 holds tight on an item going through the scanner, 1 pulls back to show its
 * completed pass. The camera eases between the two and never overshoots. While
 * an item is inside a gate the crate goes translucent and its contents show
 * through, and the tag that follows names that same item.
 *
 * Belts run from one rAF loop that writes attributes straight to the DOM, so
 * React never re-renders while it animates.
 */

export type BulkConveyorProps = {
  className?: string;
  rows?: number;
  itemsPerRow?: number;
  /** which shot to be on: 0 tight on one item, 1 wide on every belt */
  phase?: 0 | 1;
  /** seconds the move between the two shots takes */
  pullSeconds?: number;
};

const VIEW_W = 1280;
const VIEW_H = 720;

const ISO_RATIO = 0.5;
const N = Math.hypot(1, ISO_RATIO);
const EX = [1 / N, -ISO_RATIO / N] as const;
const EY = [1 / N, ISO_RATIO / N] as const;
const PERP = 0.8;

const U_SPAN = 1200;
const U_BELT = 1500;
const SCAN_U = 40;
const GATE_HALF_U = 62;

const CUBE_R = 30;
const CUBE_H = 38;
const BELT_HALF_W = 52;
const ROW_GAP = 150;
const STRIPE_SPACING = 96;

const TAG_HOLD = 2.9;
const TAG_FADE = 0.55;

type Item = { name: string; price: string; kind: 'sneaker' | 'mug' | 'camera' };

const CATALOG: Item[] = [
  { kind: 'camera', name: 'EP-133 sampler', price: '$249' },
  { kind: 'camera', name: 'Canon AE-1', price: '$120' },
  { kind: 'mug', name: 'Stoneware mug', price: '$14' },
  { kind: 'sneaker', name: 'Jordan 1 mid', price: '$96' },
  { kind: 'camera', name: 'Pentax K1000', price: '$135' },
  { kind: 'mug', name: 'Diner mug set', price: '$22' },
];

const itemFor = (r: number, k: number) =>
  CATALOG[(r * 2 + k * 3) % CATALOG.length];

const iso = (u: number, w: number) =>
  [
    VIEW_W / 2 + EX[0] * u + EY[0] * w,
    VIEW_H / 2 + EX[1] * u + EY[1] * w,
  ] as const;

const pts = (p: readonly (readonly [number, number])[]) =>
  p.map(([x, y]) => `${x},${y}`).join(' ');

const wrap01 = (v: number) => ((v % 1) + 1) % 1;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
// settles instead of overshooting
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;

/** Compact contents glyphs, drawn centred inside a crate. */
function Contents({ kind, color }: { kind: Item['kind']; color: string }) {
  if (kind === 'sneaker') {
    return (
      <path
        d="M-16 6 L-16 -1 C-16 -5 -13 -7 -9 -8 L-2 -9 C1 -10 4 -12 6 -15 C8 -17 11 -17 13 -15 L16 -11 C18 -9 18 -7 18 -4 L18 6 Z"
        fill="none"
        stroke={color}
        strokeLinejoin="round"
        strokeWidth="2"
      />
    );
  }
  if (kind === 'mug') {
    return (
      <g fill="none" stroke={color} strokeWidth="2">
        <path d="M-9 -10 L-9 6 L9 6 L9 -10 Z" strokeLinejoin="round" />
        <path d="M9 -6 C16 -6 16 2 9 2" />
      </g>
    );
  }
  return (
    <g fill="none" stroke={color} strokeWidth="2">
      <rect
        height="18"
        rx="3"
        width="30"
        x="-15"
        y="-8"
        strokeLinejoin="round"
      />
      <circle cx="0" cy="1" r="6" />
      <path d="M-7 -8 L-4 -12 L4 -12 L7 -8" strokeLinejoin="round" />
    </g>
  );
}

export function BulkConveyor({
  className,
  rows = 7,
  itemsPerRow = 5,
  phase = 0,
  pullSeconds = 1.4,
}: BulkConveyorProps) {
  const host = useRef<SVGSVGElement>(null);
  const camera = useRef<SVGGElement>(null);
  const cubeRefs = useRef<(SVGGElement | null)[][]>([]);
  const shellRefs = useRef<(SVGGElement | null)[][]>([]);
  const innerRefs = useRef<(SVGGElement | null)[][]>([]);
  const rowRefs = useRef<(SVGGElement | null)[]>([]);
  const stripeRefs = useRef<(SVGGElement | null)[]>([]);
  const tagRefs = useRef<(SVGGElement | null)[]>([]);
  const tagNameRefs = useRef<(SVGTextElement | null)[]>([]);
  const tagPriceRefs = useRef<(SVGTextElement | null)[]>([]);
  // read by the loop so a phase change never restarts the effect
  const targetRef = useRef<0 | 1>(phase);

  const heroRow = Math.floor(rows / 2);

  useEffect(() => {
    const svg = host.current;
    const cam = camera.current;
    if (!(svg && cam)) {
      return;
    }

    const reduce = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)'
    )?.matches;

    const heroPoint = iso(SCAN_U, 0);
    const gridHeight =
      (rows - 1) * ROW_GAP * PERP + BELT_HALF_W * 2 * PERP + 120;
    const fit = Math.min(1, VIEW_H / gridHeight);
    const tight = 1.45;

    let inView = false;
    let raf = 0;
    // eased tween between the two shots: these hold intermediate values, so
    // they are plain numbers rather than the 0 | 1 the target is
    let shown: number = targetRef.current;
    let from: number = shown;
    let tweenStart = 0;
    let lastTarget: 0 | 1 = targetRef.current;

    const markInView = () => {
      if (inView) {
        return;
      }
      const r = svg.getBoundingClientRect();
      const vh = window.innerHeight || document.documentElement.clientHeight;
      if (r.height && r.top < vh * 0.92 && r.bottom > 0) {
        inView = true;
      }
    };
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting) {
          markInView();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(svg);
    const poll = window.setInterval(markInView, 320);
    window.addEventListener('scroll', markInView, { passive: true });
    markInView();

    const rowSpeed = (r: number) => 0.055 * (1 + ((r * 5) % 3) * 0.08);
    const rowScan = (r: number) =>
      r === heroRow ? SCAN_U : SCAN_U + (((r * 2) % 3) - 1) * 380;

    /** Position of one item along its belt. */
    const itemU = (r: number, k: number, t: number) => {
      const phase = r === heroRow ? 0.34 : wrap01(r * 0.37 + 0.12);
      return lerp(
        -U_SPAN,
        U_SPAN,
        wrap01(t * rowSpeed(r) + phase + k / itemsPerRow)
      );
    };

    /** Moves one crate, swaps it to x-ray inside the gate, returns exit age. */
    const stepItem = (r: number, k: number, t: number) => {
      const g = cubeRefs.current[r]?.[k];
      if (!g) {
        return Number.POSITIVE_INFINITY;
      }
      const u = itemU(r, k, t);
      const [x, y] = iso(u, (r - heroRow) * ROW_GAP);
      g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);

      const scanU = rowScan(r);
      const d = Math.abs(u - scanU);
      // fades between solid crate and see-through crate at the gate mouth
      const xray = clamp01((GATE_HALF_U + 6 - d) / 26);
      shellRefs.current[r]?.[k]?.setAttribute(
        'opacity',
        (1 - xray * 0.72).toFixed(3)
      );
      innerRefs.current[r]?.[k]?.setAttribute('opacity', xray.toFixed(3));

      const uPerSecond = rowSpeed(r) * 2 * U_SPAN;
      const since = (u - (scanU + GATE_HALF_U)) / uPerSecond;
      return since > 0 ? since : Number.POSITIVE_INFINITY;
    };

    /** Names the item that just cleared this row's gate, and fades the tag. */
    const updateTag = (r: number, k: number, age: number) => {
      const tag = tagRefs.current[r];
      if (!tag) {
        return;
      }
      if (k < 0 || age > TAG_HOLD + TAG_FADE) {
        tag.setAttribute('opacity', '0');
        return;
      }
      const item = itemFor(r, k);
      const name = tagNameRefs.current[r];
      const price = tagPriceRefs.current[r];
      if (name && name.textContent !== item.name) {
        name.textContent = item.name;
      }
      if (price && price.textContent !== item.price) {
        price.textContent = item.price;
      }
      const inFade = clamp01(age / 0.28);
      const outFade = clamp01((TAG_HOLD + TAG_FADE - age) / TAG_FADE);
      tag.setAttribute('opacity', (inFade * outFade).toFixed(3));
    };

    const stepRow = (r: number, t: number) => {
      const stripes = stripeRefs.current[r];
      if (stripes) {
        const march = wrap01(t * rowSpeed(r)) * STRIPE_SPACING;
        const [sx, sy] = [EX[0] * march, EX[1] * march];
        stripes.setAttribute('transform', `translate(${sx} ${sy})`);
      }

      let bestK = -1;
      let bestAge = Number.POSITIVE_INFINITY;
      for (let k = 0; k < itemsPerRow; k++) {
        const age = stepItem(r, k, t);
        if (age < bestAge) {
          bestAge = age;
          bestK = k;
        }
      }

      updateTag(r, bestK, bestAge);
    };

    /** Eases toward whichever shot the section asked for. */
    const pullAt = (now: number) => {
      if (reduce) {
        return targetRef.current;
      }
      const target = targetRef.current;
      if (target !== lastTarget) {
        from = shown;
        tweenStart = now;
        lastTarget = target;
      }
      if (tweenStart === 0) {
        shown = target;
        return shown;
      }
      const p = clamp01((now - tweenStart) / (pullSeconds * 1000));
      shown = lerp(from, target, easeInOutCubic(p));
      return shown;
    };

    /**
     * Holds on the one belt at the tight shot and brings the rest in as the
     * camera pulls back, nearest first, so "one item" reads as one item.
     */
    const paintRows = (eased: number) => {
      for (let r = 0; r < rows; r++) {
        const g = rowRefs.current[r];
        if (!g || r === heroRow) {
          continue;
        }
        const stagger = Math.abs(r - heroRow) * 0.07;
        g.setAttribute('opacity', clamp01((eased - stagger) / 0.45).toFixed(3));
      }
    };

    const frame = (now: number) => {
      const t = now / 1000;
      // belts keep running even before the section is reached
      const pull = inView ? pullAt(now) : targetRef.current;
      const eased = clamp01(pull);

      const scale = lerp(tight, fit, eased);
      const fx = lerp(heroPoint[0], VIEW_W / 2, eased);
      const fy = lerp(heroPoint[1] - CUBE_H * 0.6, VIEW_H / 2, eased);
      cam.setAttribute(
        'transform',
        `translate(${VIEW_W / 2} ${VIEW_H / 2}) scale(${scale.toFixed(4)}) translate(${(-fx).toFixed(2)} ${(-fy).toFixed(2)})`
      );

      paintRows(eased);
      for (let r = 0; r < rows; r++) {
        stepRow(r, t);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.clearInterval(poll);
      window.removeEventListener('scroll', markInView);
    };
  }, [rows, itemsPerRow, pullSeconds, heroRow]);

  // keep the loop's target in sync without tearing down the animation
  useEffect(() => {
    targetRef.current = phase;
  }, [phase]);

  const q = CUBE_R * ISO_RATIO;
  const outline = pts([
    [-CUBE_R, -q],
    [0, 0],
    [CUBE_R, -q],
    [CUBE_R, -q - CUBE_H],
    [0, -2 * q - CUBE_H],
    [-CUBE_R, -q - CUBE_H],
  ]);
  const topFace = pts([
    [0, -CUBE_H],
    [CUBE_R, -q - CUBE_H],
    [0, -2 * q - CUBE_H],
    [-CUBE_R, -q - CUBE_H],
  ]);

  const stripeCount = Math.ceil((2 * U_BELT) / STRIPE_SPACING) + 2;
  const gateHalfW = CUBE_R + 20;
  const gateTop = CUBE_H + q * 2 + 20;

  const heroPoint = iso(SCAN_U, 0);
  const initialCam = `translate(${VIEW_W / 2} ${VIEW_H / 2}) scale(1.45) translate(${-heroPoint[0]} ${-(heroPoint[1] - CUBE_H * 0.6)})`;

  return (
    <svg
      aria-label="One item moving from photo to a ready listing"
      className={className}
      ref={host}
      role="img"
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
    >
      <g ref={camera} transform={initialCam}>
        {Array.from({ length: rows }).map((_, r) => {
          const w = (r - heroRow) * ROW_GAP;
          const a = iso(-U_BELT, w - BELT_HALF_W);
          const b = iso(U_BELT, w - BELT_HALF_W);
          const c = iso(U_BELT, w + BELT_HALF_W);
          const d = iso(-U_BELT, w + BELT_HALF_W);
          const gate = iso(
            r === heroRow ? SCAN_U : SCAN_U + (((r * 2) % 3) - 1) * 380,
            w
          );
          const clipId = `bulk-belt-${r}`;

          return (
            <g
              key={`row-${r}`}
              opacity={r === heroRow ? 1 : 0}
              ref={(el) => {
                rowRefs.current[r] = el;
              }}
            >
              <clipPath id={clipId}>
                <polygon points={pts([a, b, c, d])} />
              </clipPath>
              <polygon
                fill="#E1E4EA"
                points={pts([
                  [a[0], a[1] + 4],
                  [b[0], b[1] + 4],
                  [c[0], c[1] + 4],
                  [d[0], d[1] + 4],
                ])}
              />
              <polygon fill="#ECEEF2" points={pts([a, b, c, d])} />
              <g clipPath={`url(#${clipId})`}>
                <g
                  ref={(el) => {
                    stripeRefs.current[r] = el;
                  }}
                >
                  {Array.from({ length: stripeCount }).map((__, s) => {
                    const u0 = -U_BELT + s * STRIPE_SPACING;
                    const sw = STRIPE_SPACING * 0.42;
                    return (
                      <polygon
                        fill="#F8F9FB"
                        key={`stripe-${r}-${s}`}
                        points={pts([
                          iso(u0, w - BELT_HALF_W),
                          iso(u0 + sw, w - BELT_HALF_W),
                          iso(u0 + sw, w + BELT_HALF_W),
                          iso(u0, w + BELT_HALF_W),
                        ])}
                      />
                    );
                  })}
                </g>
              </g>

              {/* scanner screen sits behind the crates */}
              <g transform={`translate(${gate[0]} ${gate[1]})`}>
                <rect
                  fill="#EDF2DC"
                  height={gateTop + 16}
                  opacity="0.95"
                  rx="12"
                  width={gateHalfW * 2}
                  x={-gateHalfW}
                  y={-gateTop}
                />
              </g>

              {Array.from({ length: itemsPerRow }).map((__, k) => {
                const item = itemFor(r, k);
                return (
                  <g
                    key={`item-${r}-${k}`}
                    ref={(el) => {
                      cubeRefs.current[r] ||= [];
                      cubeRefs.current[r][k] = el;
                    }}
                  >
                    {/* solid crate */}
                    <g
                      ref={(el) => {
                        shellRefs.current[r] ||= [];
                        shellRefs.current[r][k] = el;
                      }}
                    >
                      <polygon
                        fill="#FFFFFF"
                        points={outline}
                        stroke={k % 3 === 0 ? '#5FA57C' : '#4A6CF7'}
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                      <polygon
                        fill="#FDFEFF"
                        points={topFace}
                        stroke={k % 3 === 0 ? '#5FA57C' : '#4A6CF7'}
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                    </g>
                    {/* see-through crate with the contents showing */}
                    <g
                      opacity="0"
                      ref={(el) => {
                        innerRefs.current[r] ||= [];
                        innerRefs.current[r][k] = el;
                      }}
                    >
                      <polygon
                        fill="#FFFFFF"
                        fillOpacity="0.35"
                        points={outline}
                        stroke="#44520F"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                      <polygon
                        fill="none"
                        points={topFace}
                        stroke="#44520F"
                        strokeLinejoin="round"
                        strokeWidth="1.6"
                      />
                      <g transform={`translate(0 ${-CUBE_H * 0.55 - q})`}>
                        <Contents color="#7BB304" kind={item.kind} />
                      </g>
                    </g>
                  </g>
                );
              })}

              {/* gate frame + the tag that names what came out */}
              <g transform={`translate(${gate[0]} ${gate[1]})`}>
                {[
                  [-gateHalfW, -gateTop, 1, 1],
                  [gateHalfW, -gateTop, -1, 1],
                  [-gateHalfW, 16, 1, -1],
                  [gateHalfW, 16, -1, -1],
                ].map(([cx, cy, dx, dy]) => (
                  <path
                    d={`M ${cx + dx * 13} ${cy} L ${cx} ${cy} L ${cx} ${cy + dy * 13}`}
                    fill="none"
                    key={`corner-${r}-${cx}-${cy}`}
                    stroke="#7BB304"
                    strokeLinecap="round"
                    strokeWidth="2.5"
                  />
                ))}
                <g
                  opacity="0"
                  ref={(el) => {
                    tagRefs.current[r] = el;
                  }}
                >
                  <rect
                    fill="#FFFFFF"
                    height="46"
                    rx="11"
                    stroke="#7BB304"
                    strokeWidth="2"
                    width="176"
                    x={gateHalfW + 14}
                    y={-gateTop / 2 - 23}
                  />
                  <text
                    fill="#20231F"
                    fontSize="15"
                    fontWeight="600"
                    ref={(el) => {
                      tagNameRefs.current[r] = el;
                    }}
                    x={gateHalfW + 30}
                    y={-gateTop / 2 - 2}
                  >
                    Air Max 90
                  </text>
                  <text
                    fill="#44520F"
                    fontSize="14"
                    fontWeight="700"
                    ref={(el) => {
                      tagPriceRefs.current[r] = el;
                    }}
                    x={gateHalfW + 30}
                    y={-gateTop / 2 + 17}
                  >
                    $74
                  </text>
                  <circle
                    cx={gateHalfW + 176 - 20}
                    cy={-gateTop / 2}
                    fill="#7BB304"
                    r="7"
                  />
                  <path
                    d={`M ${gateHalfW + 176 - 24} ${-gateTop / 2} l 3 3 l 5 -6`}
                    fill="none"
                    stroke="#FFFFFF"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </g>
              </g>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
