'use client';

import { useAnimationFrame, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useId, useRef } from 'react';
import { lerp, lerpClamped, pointString, wrap01 } from './geometry';
import { IsometricPackage } from './isometric-package';

export type ConveyorSceneProps = {
  accent?: string;
  ariaLabel?: string;
  background?: string;
  belt?: string;
  beltEdge?: string;
  className?: string;
  packageLeft?: string;
  packageRight?: string;
  packageTop?: string;
  paused?: boolean;
  speed?: number;
};

const LOOP_DURATION_MS = 6000;
const POSTER_PROGRESS = 0.5;
const MARKER_COUNT = 20;

const BELT_TOP = [
  [1044, 140],
  [1184, 228],
  [354, 574],
  [214, 486],
] as const;

const BELT_FRONT = [
  [1184, 228],
  [354, 574],
  [354, 638],
  [1184, 292],
] as const;

const BELT_END = [
  [354, 574],
  [214, 486],
  [214, 550],
  [354, 638],
] as const;

const PATH_START = [1114, 184] as const;
const PATH_END = [284, 530] as const;
const PACKAGE_SCALE = 0.72;
const PACKAGE_CONTACT_OFFSET = 138 * PACKAGE_SCALE;
const PACKAGE_VERTICAL_OFFSET = 14;
const PORTAL_FAR_TOP = [630, 106] as const;
const PORTAL_NEAR_TOP = [770, 194] as const;
const PORTAL_NEAR_BOTTOM = [770, 416] as const;
const PORTAL_FAR_BOTTOM = [630, 328] as const;

const edgePoint = (
  from: readonly [number, number],
  to: readonly [number, number],
  progress: number
) => [lerp(from[0], to[0], progress), lerp(from[1], to[1], progress)] as const;

const getVisible = (progress: number) => {
  if (progress < 0.06) {
    return lerpClamped(progress, 0, 0.06, 0, 1);
  }

  if (progress > 0.92) {
    return lerpClamped(progress, 0.92, 0.99, 1, 0);
  }

  return 1;
};

const getScanStrength = (progress: number) => {
  if (progress <= 0.5) {
    return lerpClamped(progress, 0.4, 0.5, 0, 1);
  }

  return lerpClamped(progress, 0.5, 0.6, 1, 0);
};

const getMarker = (index: number, markerOffset: number) => {
  const progress = wrap01(index / MARKER_COUNT + markerOffset);
  const far = edgePoint(BELT_TOP[0], BELT_TOP[3], progress);
  const near = edgePoint(BELT_TOP[1], BELT_TOP[2], progress);

  return {
    x1: lerp(far[0], near[0], 0.14),
    x2: lerp(far[0], near[0], 0.86),
    y1: lerp(far[1], near[1], 0.14),
    y2: lerp(far[1], near[1], 0.86),
  };
};

const POSTER_MARKERS = Array.from({ length: MARKER_COUNT }, (_, index) =>
  getMarker(index, 0.5)
);

export function ConveyorScene({
  accent = 'var(--anorhaGreen)',
  ariaLabel = 'Package moving through a scanner on a conveyor belt',
  background = 'var(--background)',
  belt = 'var(--anorhaDarkGreen)',
  beltEdge = 'oklch(0.22 0.025 121.65)',
  className,
  packageLeft = '#D89B5B',
  packageRight = '#BF7742',
  packageTop = '#E7B979',
  paused = false,
  speed = 1,
}: ConveyorSceneProps) {
  const shouldReduceMotion = Boolean(useReducedMotion());
  const phaseRef = useRef(POSTER_PROGRESS);
  const markerRefs = useRef<Array<SVGLineElement | null>>([]);
  const packageGroupRef = useRef<SVGGElement>(null);
  const packageShadowRef = useRef<SVGEllipseElement>(null);
  const packageTransformRef = useRef<SVGGElement>(null);
  const portalPanelRef = useRef<SVGPolygonElement>(null);
  const portalBackRef = useRef<SVGPathElement>(null);
  const beamGlowRef = useRef<SVGLineElement>(null);
  const beamCoreRef = useRef<SVGLineElement>(null);
  const instanceId = useId().replaceAll(':', '');
  const id = (name: string) => `${instanceId}-${name}`;

  const applyFrame = useCallback((progress: number, staticFrame: boolean) => {
    const travel = lerp(-0.12, 1.12, progress);
    const packageX = lerp(PATH_START[0], PATH_END[0], travel);
    const packageY = lerp(PATH_START[1], PATH_END[1], travel);
    const visible = getVisible(progress);
    const scanStrength = staticFrame ? 0 : getScanStrength(progress);
    const scanProgress = lerpClamped(progress, 0.4, 0.6, 0.12, 0.88);
    const scanLeft = edgePoint(PORTAL_FAR_TOP, PORTAL_FAR_BOTTOM, scanProgress);
    const scanRight = edgePoint(
      PORTAL_NEAR_TOP,
      PORTAL_NEAR_BOTTOM,
      scanProgress
    );

    packageGroupRef.current?.setAttribute('opacity', String(visible));
    packageShadowRef.current?.setAttribute('cx', String(packageX - 4));
    packageShadowRef.current?.setAttribute(
      'cy',
      String(packageY + 12 + PACKAGE_VERTICAL_OFFSET)
    );
    packageShadowRef.current?.setAttribute(
      'transform',
      `rotate(-22 ${packageX - 4} ${packageY + 12 + PACKAGE_VERTICAL_OFFSET})`
    );
    packageTransformRef.current?.setAttribute(
      'transform',
      `translate(${packageX} ${packageY - PACKAGE_CONTACT_OFFSET + PACKAGE_VERTICAL_OFFSET}) scale(${PACKAGE_SCALE})`
    );
    portalPanelRef.current?.setAttribute(
      'opacity',
      String(0.035 + scanStrength * 0.08)
    );
    portalBackRef.current?.setAttribute(
      'opacity',
      String(0.18 + scanStrength * 0.16)
    );

    for (const beam of [beamGlowRef.current, beamCoreRef.current]) {
      beam?.setAttribute('x1', String(scanLeft[0]));
      beam?.setAttribute('x2', String(scanRight[0]));
      beam?.setAttribute('y1', String(scanLeft[1]));
      beam?.setAttribute('y2', String(scanRight[1]));
    }

    beamGlowRef.current?.setAttribute('opacity', String(scanStrength * 0.55));
    beamCoreRef.current?.setAttribute('opacity', String(scanStrength));

    const markerOffset = staticFrame ? 0.5 : wrap01(progress * 2.5);
    for (let index = 0; index < MARKER_COUNT; index += 1) {
      const marker = markerRefs.current[index];
      if (!marker) {
        continue;
      }

      const position = getMarker(index, markerOffset);
      marker.setAttribute('x1', String(position.x1));
      marker.setAttribute('x2', String(position.x2));
      marker.setAttribute('y1', String(position.y1));
      marker.setAttribute('y2', String(position.y2));
    }
  }, []);

  useAnimationFrame((_time, delta) => {
    if (paused || shouldReduceMotion) {
      return;
    }

    const safeSpeed = Number.isFinite(speed) ? Math.max(0, speed) : 1;
    const boundedDelta = Math.min(delta, 100);
    phaseRef.current = wrap01(
      phaseRef.current + (boundedDelta / LOOP_DURATION_MS) * safeSpeed
    );
    applyFrame(phaseRef.current, false);
  });

  useEffect(() => {
    if (shouldReduceMotion) {
      phaseRef.current = POSTER_PROGRESS;
    }

    applyFrame(phaseRef.current, shouldReduceMotion);
  }, [applyFrame, shouldReduceMotion]);

  const posterTravel = lerp(-0.12, 1.12, POSTER_PROGRESS);
  const posterX = lerp(PATH_START[0], PATH_END[0], posterTravel);
  const posterY = lerp(PATH_START[1], PATH_END[1], posterTravel);
  const posterScanLeft = edgePoint(PORTAL_FAR_TOP, PORTAL_FAR_BOTTOM, 0.5);
  const posterScanRight = edgePoint(PORTAL_NEAR_TOP, PORTAL_NEAR_BOTTOM, 0.5);
  const portalPath = `M ${PORTAL_FAR_BOTTOM[0]} ${PORTAL_FAR_BOTTOM[1]} L ${PORTAL_FAR_TOP[0]} ${PORTAL_FAR_TOP[1]} L ${PORTAL_NEAR_TOP[0]} ${PORTAL_NEAR_TOP[1]}`;
  const portalOutline = `${portalPath} L ${PORTAL_NEAR_BOTTOM[0]} ${PORTAL_NEAR_BOTTOM[1]} L ${PORTAL_FAR_BOTTOM[0]} ${PORTAL_FAR_BOTTOM[1]}`;

  return (
    <svg
      aria-label={ariaLabel}
      className={className}
      role="img"
      style={{ background, display: 'block', height: 'auto', width: '100%' }}
      viewBox="0 0 1280 720"
    >
      <title>{ariaLabel}</title>
      <defs>
        <linearGradient id={id('bg-wash')} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.72" />
          <stop offset="0.52" stopColor={background} stopOpacity="0" />
          <stop offset="1" stopColor={accent} stopOpacity="0.14" />
        </linearGradient>
        <linearGradient id={id('belt-top')} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#343B33" />
          <stop offset="1" stopColor={belt} />
        </linearGradient>
        <linearGradient id={id('belt-front')} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={beltEdge} />
          <stop offset="1" stopColor="#080A08" />
        </linearGradient>
        <clipPath id={id('belt-top-clip')}>
          <polygon points={pointString(BELT_TOP)} />
        </clipPath>
        <filter
          height="220%"
          id={id('scene-shadow')}
          width="160%"
          x="-30%"
          y="-60%"
        >
          <feGaussianBlur stdDeviation="18" />
        </filter>
        <filter
          height="260%"
          id={id('portal-glow')}
          width="260%"
          x="-80%"
          y="-80%"
        >
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>

      <rect fill={`url(#${id('bg-wash')})`} height="720" width="1280" />
      <ellipse
        cx="684"
        cy="560"
        fill="#3A402F"
        filter={`url(#${id('scene-shadow')})`}
        opacity="0.13"
        rx="474"
        ry="67"
        transform="rotate(-22 684 560)"
      />

      <g>
        <polygon
          fill={`url(#${id('belt-front')})`}
          points={pointString(BELT_FRONT)}
        />
        <polygon fill="#0D100D" points={pointString(BELT_END)} />
        <polygon
          fill={`url(#${id('belt-top')})`}
          points={pointString(BELT_TOP)}
        />

        <g clipPath={`url(#${id('belt-top-clip')})`} opacity="0.34">
          {POSTER_MARKERS.map((marker, index) => (
            <line
              key={index}
              ref={(element) => {
                markerRefs.current[index] = element;
              }}
              stroke="#F1F3EA"
              strokeLinecap="round"
              strokeWidth="3"
              x1={marker.x1}
              x2={marker.x2}
              y1={marker.y1}
              y2={marker.y2}
            />
          ))}
        </g>

        {Array.from({ length: 11 }, (_, index) => {
          const progress = (index + 0.55) / 11;
          const point = edgePoint(BELT_FRONT[0], BELT_FRONT[1], progress);
          const x = point[0];
          const y = point[1] + 18;

          return (
            <g key={index}>
              <ellipse
                cx={x}
                cy={y}
                fill="#D6D8CF"
                opacity="0.88"
                rx="24"
                ry="9"
                transform={`rotate(-23 ${x} ${y})`}
              />
              <ellipse
                cx={x - 1}
                cy={y}
                fill="#767C72"
                opacity="0.92"
                rx="10"
                ry="3.5"
                transform={`rotate(-23 ${x} ${y})`}
              />
            </g>
          );
        })}

        {[0.12, 0.36, 0.6, 0.84].map((progress) => {
          const point = edgePoint(BELT_FRONT[0], BELT_FRONT[1], progress);
          const x = point[0];
          const y = point[1] + 62;

          return (
            <g key={progress}>
              <path
                d={`M ${x} ${y} L ${x} ${y + 54}`}
                stroke="#111510"
                strokeLinecap="round"
                strokeWidth="18"
              />
              <ellipse cx={x} cy={y + 58} fill="#080A08" rx="31" ry="10" />
            </g>
          );
        })}
      </g>

      <g>
        <polygon
          ref={portalPanelRef}
          fill={accent}
          opacity="0.035"
          points={pointString([
            PORTAL_FAR_TOP,
            PORTAL_NEAR_TOP,
            PORTAL_NEAR_BOTTOM,
            PORTAL_FAR_BOTTOM,
          ])}
        />
        <path
          ref={portalBackRef}
          d={portalPath}
          fill="none"
          filter={`url(#${id('portal-glow')})`}
          opacity="0.18"
          stroke={accent}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="24"
        />
      </g>

      <g>
        <line
          ref={beamGlowRef}
          filter={`url(#${id('portal-glow')})`}
          opacity="0"
          stroke={accent}
          strokeLinecap="round"
          strokeWidth="20"
          x1={posterScanLeft[0]}
          x2={posterScanRight[0]}
          y1={posterScanLeft[1]}
          y2={posterScanRight[1]}
        />
        <line
          ref={beamCoreRef}
          opacity="0"
          stroke="#FFFFFF"
          strokeLinecap="round"
          strokeWidth="6"
          x1={posterScanLeft[0]}
          x2={posterScanRight[0]}
          y1={posterScanLeft[1]}
          y2={posterScanRight[1]}
        />
      </g>

      <g ref={packageGroupRef} opacity="1">
        <ellipse
          ref={packageShadowRef}
          cx={posterX - 4}
          cy={posterY + 12 + PACKAGE_VERTICAL_OFFSET}
          fill="#10140F"
          opacity="0.21"
          rx="82"
          ry="25"
          style={{ filter: 'blur(12px)' }}
          transform={`rotate(-22 ${posterX - 4} ${posterY + 12 + PACKAGE_VERTICAL_OFFSET})`}
        />
        <g
          ref={packageTransformRef}
          transform={`translate(${posterX} ${posterY - PACKAGE_CONTACT_OFFSET + PACKAGE_VERTICAL_OFFSET}) scale(${PACKAGE_SCALE})`}
        >
          <IsometricPackage
            accent={accent}
            clipId={id('package-top-clip')}
            packageLeft={packageLeft}
            packageRight={packageRight}
            packageTop={packageTop}
          />
        </g>
      </g>

      <g>
        <path
          d={portalOutline}
          fill="none"
          opacity="0.22"
          stroke="#151914"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="22"
          transform="translate(0 7)"
        />
        <path
          d={portalOutline}
          fill="none"
          stroke={accent}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="11"
        />
      </g>
    </svg>
  );
}
