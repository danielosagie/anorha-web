'use client';

import { useEffect, useRef } from 'react';

const WIDTH = 1180;
const HEIGHT = 300;
const SAMPLES = 64;

type WaveConfig = {
  amplitude: number;
  baseline: number;
  color: string;
  speed: number;
  wavelengths: number;
  phase: number;
};

// Two overlapping traveling sine waves. Each frame we resample the path with
// y = baseline + amplitude * sin(k * x + speed * t + phase), so the crest and
// trough actually move through the line instead of the whole line sliding.
const WAVES: WaveConfig[] = [
  {
    amplitude: 26,
    baseline: 150,
    color: '#E7E3D2',
    phase: 0,
    speed: 0.6,
    wavelengths: 2.2,
  },
  {
    amplitude: 20,
    baseline: 176,
    color: '#EDEAD9',
    phase: Math.PI * 0.85,
    speed: -0.44,
    wavelengths: 1.7,
  },
];

function buildPath(config: WaveConfig, t: number): string {
  const { amplitude, baseline, phase, speed, wavelengths } = config;
  const k = (wavelengths * 2 * Math.PI) / WIDTH;
  let d = '';
  for (let i = 0; i <= SAMPLES; i++) {
    const x = (i / SAMPLES) * WIDTH;
    const y = baseline + amplitude * Math.sin(k * x + speed * t + phase);
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d;
}

export function HeroWaves() {
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);

  useEffect(() => {
    const reduce = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    // Static resting state for reduced motion.
    if (reduce) {
      WAVES.forEach((wave, index) => {
        pathRefs.current[index]?.setAttribute('d', buildPath(wave, 0));
      });
      return;
    }

    let raf = 0;
    let start = 0;
    const tick = (now: number) => {
      if (!start) {
        start = now;
      }
      const t = (now - start) / 1000;
      WAVES.forEach((wave, index) => {
        pathRefs.current[index]?.setAttribute('d', buildPath(wave, t));
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <svg
      aria-hidden="true"
      className="hero-waves"
      preserveAspectRatio="none"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
    >
      {WAVES.map((wave, index) => (
        <path
          d={buildPath(wave, 0)}
          fill="none"
          key={wave.color}
          ref={(el) => {
            pathRefs.current[index] = el;
          }}
          stroke={wave.color}
          strokeLinecap="round"
          strokeWidth="5"
        />
      ))}
    </svg>
  );
}
