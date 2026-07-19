'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export type HeroFieldClientProps = {
  className?: string;
};

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const OKLCH_PATTERN =
  /^oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)(?:deg)?(?:\s*\/\s*[\d.]+%?)?\s*\)$/i;
const POINT_COUNT = 68;
const LINE_LIMIT = 120;

type Oklch = readonly [lightness: number, chroma: number, hue: number];

const BRAND_GREEN: Oklch = [0.7235, 0.1383, 122.18];
const BRAND_DARK_GREEN: Oklch = [0.3981, 0.0712, 121.65];

const clamp = (value: number) => Math.min(1, Math.max(0, value));

const toSrgbChannel = (value: number) =>
  value <= 0.003_130_8 ? 12.92 * value : 1.055 * value ** (1 / 2.4) - 0.055;

const oklchToColor = ([lightness, chroma, hue]: Oklch) => {
  const radians = (hue * Math.PI) / 180;
  const a = chroma * Math.cos(radians);
  const b = chroma * Math.sin(radians);
  const lRoot = lightness + 0.396_337_777_4 * a + 0.215_803_757_3 * b;
  const mRoot = lightness - 0.105_561_345_8 * a - 0.063_854_172_8 * b;
  const sRoot = lightness - 0.089_484_177_5 * a - 1.291_485_548 * b;
  const l = lRoot ** 3;
  const m = mRoot ** 3;
  const s = sRoot ** 3;
  const red = toSrgbChannel(
    4.076_741_662_1 * l - 3.307_711_591_3 * m + 0.230_969_929_2 * s
  );
  const green = toSrgbChannel(
    -1.268_438_004_6 * l + 2.609_757_401_1 * m - 0.341_319_396_5 * s
  );
  const blue = toSrgbChannel(
    -0.004_196_086_3 * l - 0.703_418_614_7 * m + 1.707_614_701 * s
  );

  return new THREE.Color().setRGB(
    clamp(red),
    clamp(green),
    clamp(blue),
    THREE.SRGBColorSpace
  );
};

const parseOklch = (value: string, fallback: Oklch): Oklch => {
  const match = value.trim().match(OKLCH_PATTERN);

  if (!match) {
    return fallback;
  }

  const rawLightness = match[1];
  const lightness = rawLightness.endsWith('%')
    ? Number.parseFloat(rawLightness) / 100
    : Number.parseFloat(rawLightness);

  return [lightness, Number(match[2]), Number(match[3])];
};

const readTokenColor = (token: string, fallback: Oklch) => {
  const value = getComputedStyle(document.documentElement).getPropertyValue(
    token
  );
  return oklchToColor(parseOklch(value, fallback));
};

const createRandom = () => {
  let seed = 29;

  return () => {
    seed = (seed * 16_807) % 2_147_483_647;
    return (seed - 1) / 2_147_483_646;
  };
};

const usePrefersReducedMotion = () => {
  const [shouldReduceMotion, setShouldReduceMotion] = useState(true);

  useEffect(() => {
    const media = window.matchMedia(REDUCED_MOTION_QUERY);
    const updatePreference = () => setShouldReduceMotion(media.matches);
    updatePreference();
    media.addEventListener('change', updatePreference);

    return () => media.removeEventListener('change', updatePreference);
  }, []);

  return shouldReduceMotion;
};

export function HeroFieldClient({ className }: HeroFieldClientProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = usePrefersReducedMotion();

  useEffect(() => {
    const container = containerRef.current;
    if (!container || shouldReduceMotion) {
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 30);
    camera.position.z = 7;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'low-power',
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.append(renderer.domElement);

    const random = createRandom();
    const positions = new Float32Array(POINT_COUNT * 3);
    for (let index = 0; index < POINT_COUNT; index += 1) {
      positions[index * 3] = (random() - 0.5) * 8.4;
      positions[index * 3 + 1] = (random() - 0.5) * 4.8;
      positions[index * 3 + 2] = (random() - 0.5) * 2.5;
    }

    const green = readTokenColor('--anorhaGreen', BRAND_GREEN);
    const darkGreen = readTokenColor('--anorhaDarkGreen', BRAND_DARK_GREEN);
    const pointsGeometry = new THREE.BufferGeometry();
    pointsGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );
    const pointsMaterial = new THREE.PointsMaterial({
      color: green,
      depthWrite: false,
      opacity: 0.48,
      size: 0.045,
      sizeAttenuation: true,
      transparent: true,
    });
    const points = new THREE.Points(pointsGeometry, pointsMaterial);

    const linePositions: number[] = [];
    let lineCount = 0;
    for (
      let from = 0;
      from < POINT_COUNT && lineCount < LINE_LIMIT;
      from += 1
    ) {
      for (
        let to = from + 1;
        to < POINT_COUNT && lineCount < LINE_LIMIT;
        to += 1
      ) {
        const fromOffset = from * 3;
        const toOffset = to * 3;
        const dx = positions[fromOffset] - positions[toOffset];
        const dy = positions[fromOffset + 1] - positions[toOffset + 1];
        const dz = positions[fromOffset + 2] - positions[toOffset + 2];

        if (dx * dx + dy * dy + dz * dz > 1.15 ** 2) {
          continue;
        }

        linePositions.push(
          positions[fromOffset],
          positions[fromOffset + 1],
          positions[fromOffset + 2],
          positions[toOffset],
          positions[toOffset + 1],
          positions[toOffset + 2]
        );
        lineCount += 1;
      }
    }

    const linesGeometry = new THREE.BufferGeometry();
    linesGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(linePositions, 3)
    );
    const linesMaterial = new THREE.LineBasicMaterial({
      color: darkGreen,
      depthWrite: false,
      opacity: 0.16,
      transparent: true,
    });
    const lines = new THREE.LineSegments(linesGeometry, linesMaterial);
    const field = new THREE.Group();
    field.add(lines, points);
    scene.add(field);

    const pointer = { targetX: 0, targetY: 0, x: 0, y: 0 };
    let frameId: number | null = null;
    let isIntersecting = false;

    const render = (time: number) => {
      frameId = null;
      if (!isIntersecting || document.hidden) {
        return;
      }

      pointer.x = THREE.MathUtils.lerp(pointer.x, pointer.targetX, 0.035);
      pointer.y = THREE.MathUtils.lerp(pointer.y, pointer.targetY, 0.035);
      field.rotation.x = pointer.y * 0.08 + Math.sin(time * 0.000_16) * 0.018;
      field.rotation.y = pointer.x * 0.1 + Math.sin(time * 0.000_11) * 0.025;
      renderer.render(scene, camera);
      frameId = window.requestAnimationFrame(render);
    };

    const start = () => {
      if (frameId === null && isIntersecting && !document.hidden) {
        frameId = window.requestAnimationFrame(render);
      }
    };

    const stop = () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
        frameId = null;
      }
    };

    const resizeObserver = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      const height = entry.contentRect.height;
      if (width === 0 || height === 0) {
        return;
      }

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      renderer.render(scene, camera);
    });

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isIntersecting = entry.isIntersecting;
        if (isIntersecting) {
          start();
        } else {
          stop();
        }
      },
      { rootMargin: '80px' }
    );

    const handlePointerMove = (event: PointerEvent) => {
      pointer.targetX = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.targetY = -((event.clientY / window.innerHeight) * 2 - 1);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stop();
      } else {
        start();
      }
    };

    resizeObserver.observe(container);
    intersectionObserver.observe(container);
    window.addEventListener('pointermove', handlePointerMove, {
      passive: true,
    });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stop();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      scene.remove(field);
      pointsGeometry.dispose();
      pointsMaterial.dispose();
      linesGeometry.dispose();
      linesMaterial.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, [shouldReduceMotion]);

  if (shouldReduceMotion) {
    return null;
  }

  return <div aria-hidden="true" className={className} ref={containerRef} />;
}
