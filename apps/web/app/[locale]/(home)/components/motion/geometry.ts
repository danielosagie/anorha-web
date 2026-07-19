export type Point = readonly [number, number];

export const pointString = (points: readonly Point[]) =>
  points.map(([x, y]) => `${x},${y}`).join(' ');

export const lerp = (from: number, to: number, progress: number) =>
  from + (to - from) * progress;

export const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export const lerpClamped = (
  value: number,
  inputStart: number,
  inputEnd: number,
  outputStart: number,
  outputEnd: number
) => {
  const progress = clamp01((value - inputStart) / (inputEnd - inputStart));
  return lerp(outputStart, outputEnd, progress);
};

export const wrap01 = (value: number) => ((value % 1) + 1) % 1;
