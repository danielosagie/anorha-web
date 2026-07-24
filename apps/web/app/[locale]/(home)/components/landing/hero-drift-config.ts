// Single source of truth for the hero drift layer — tiny petals and a bee that
// flow left to right across the hero. Ambient, sparse, not interactive.
// (The grabbable marketplace stickers now live on the integrations orbit, see
// integration-orbit.tsx.)

export type Drifter = {
  id: string;
  kind: 'petal' | 'bee';
  /** petal silhouette variant */
  shape?: 1 | 2;
  /** index into PETAL_FILLS */
  fill?: number;
  /** lane: % of hero height */
  top: number;
  /** px — petal height / bee width. Deliberately small. */
  size: number;
  /** seconds to cross the hero */
  dur: number;
  /** px of secondary float, on a non-harmonic period so it never reads rhythmic */
  bob: number;
  /** px of vertical deviation along its own wandering path (bee wanders most) */
  wander: number;
  /** slow tumble direction (0 = none) */
  spin: -1 | 0 | 1;
};

export const PETAL_PATHS: Record<1 | 2, string> = {
  1: 'M12 2 C3 7 2 18 7 26 C9 29 11 30 12 30 C13 30 15 29 17 26 C22 18 21 7 12 2 Z',
  2: 'M12 3 C6 6 3 13 5 21 C6 26 9 29 12 30 C15 29 18 26 19 21 C21 13 18 6 12 3 Z',
};

export const PETAL_FILLS = [
  '#eec3bb',
  '#e3d3bb',
  '#dda79d',
  '#f0dcc4',
  '#cdd9a6',
];

// Sparse on purpose: few items, spread across vertical lanes, and phase-shifted
// across the loop so the gaps between them stay wide.
export const HERO_DRIFTERS: Drifter[] = [
  { id: 'p1', kind: 'petal', shape: 1, fill: 0, top: 10, size: 15, dur: 27, bob: 5, wander: 26, spin: 1 },
  { id: 'p2', kind: 'petal', shape: 2, fill: 2, top: 26, size: 12, dur: 33, bob: 4, wander: 20, spin: -1 },
  { id: 'bee', kind: 'bee', top: 19, size: 25, dur: 24, bob: 6, wander: 44, spin: 0 },
  { id: 'p3', kind: 'petal', shape: 1, fill: 3, top: 43, size: 16, dur: 29, bob: 5, wander: 30, spin: -1 },
  { id: 'p4', kind: 'petal', shape: 2, fill: 1, top: 60, size: 13, dur: 36, bob: 4, wander: 22, spin: 1 },
  { id: 'p5', kind: 'petal', shape: 1, fill: 4, top: 75, size: 14, dur: 25, bob: 5, wander: 28, spin: 1 },
  { id: 'p6', kind: 'petal', shape: 2, fill: 0, top: 88, size: 11, dur: 31, bob: 4, wander: 18, spin: -1 },
];

export type HeroFieldSettings = {
  /** petals + bee on/off */
  drift: boolean;
  /** drift speed multiplier (1 = base durations; higher = faster) */
  driftSpeed: number;
  /** drift size multiplier */
  driftScale: number;
};

export const HERO_FIELD_SETTINGS: HeroFieldSettings = {
  drift: true,
  driftSpeed: 1,
  driftScale: 1,
};

/**
 * Deterministic per-item noise so every drifter gets its OWN path rather than
 * all of them tracing the same line.
 */
const noise = (i: number, k: number) => {
  const s = Math.sin(i * 127.1 + k * 311.7) * 43_758.5453;
  return (s - Math.floor(s)) * 2 - 1; // -1..1
};

/**
 * Waypoints for one drifter's wandering path across the hero. Uneven x spacing
 * makes it speed up and ease off on its own instead of tracking at a constant
 * rate — the bee gets the most of it.
 */
export function pathFor(item: Drifter, index: number, width: number) {
  const isBee = item.kind === 'bee';
  const n = isBee ? 9 : 5;
  const points: Array<{ x: number; y: number }> = [];
  for (let k = 0; k <= n; k++) {
    const t = k / n;
    const jitter = noise(index, k + 50) * (isBee ? 0.03 : 0.02);
    const tt = k === 0 || k === n ? t : Math.min(0.97, Math.max(0.03, t + jitter));
    points.push({
      x: -80 + tt * (width + 160),
      y: noise(index, k) * item.wander,
    });
  }
  return points;
}
