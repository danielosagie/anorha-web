'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

type PatternType = 'balance' | 'duality' | 'flow' | 'chaos';

interface PaintRevealProps {
  color?: string;
  brushSize?: number;
  className?: string;
  /**
   * Pre-revealed spots as [x, y, radius?] with x/y in 0–1 (edges allowed) and
   * radius as a fraction of the shorter canvas side (default 0.08). Up to 8 spots.
   */
  preRevealedSpots?: [number, number, number?][];
  /** Enable animated living blob pattern (default false for perf) */
  living?: boolean;
  /** Which blob pattern to use */
  patternType?: PatternType;
  /** FPS cap for pattern animation */
  fps?: number;
  /** Height of top blend band in px (default 100) */
  blendTopHeight?: number;
  /** Wave amplitude at top edge in px (default 20) */
  waveAmplitude?: number;
  /** Animate the wave (default true) */
  waveAnimate?: boolean;
  /** Show the customization controls toggle overlay (default false) */
  showControlsToggle?: boolean;
}

const CHAR_MAP = [' ', '·', '░', '▒', '▓', '█'];

const CELL_SIZE = 16;
const SLOWDOWN_FACTOR = 12;

const patterns: Record<PatternType, (x: number, y: number, t: number, cx: number, cy: number) => number> = {
  balance: (x, y, t, cx, cy) => {
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return Math.sin(dx * 0.3 + t * 0.5) * Math.cos(dy * 0.3 + t * 0.3) * Math.sin(dist * 0.1 - t * 0.4);
  },
  duality: (x, y, t, cx, cy) => {
    const left = x < cx ? Math.sin(x * 0.2 + t * 0.3) : 0;
    const right = x >= cx ? Math.cos(x * 0.2 - t * 0.3) : 0;
    return left + right + Math.sin(y * 0.3 + t * 0.2);
  },
  flow: (x, y, t, cx, cy) => {
    const angle = Math.atan2(y - cy, x - cx);
    const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
    return Math.sin(angle * 3 + t * 0.4) * Math.cos(dist * 0.1 - t * 0.3);
  },
  chaos: (x, y, t) => {
    const noise1 = Math.sin(x * 0.5 + t) * Math.cos(y * 0.3 - t);
    const noise2 = Math.sin(y * 0.4 + t * 0.5) * Math.cos(x * 0.2 + t * 0.7);
    const noise3 = Math.sin((x + y) * 0.2 + t * 0.8);
    return noise1 * 0.3 + noise2 * 0.3 + noise3 * 0.4;
  },
};

function valueToChar(value: number): string {
  if (value > 0.8) return CHAR_MAP[5];
  if (value > 0.5) return CHAR_MAP[4];
  if (value > 0.2) return CHAR_MAP[3];
  if (value > -0.2) return CHAR_MAP[2];
  if (value > -0.5) return CHAR_MAP[1];
  return CHAR_MAP[0];
}

export const PaintReveal: React.FC<PaintRevealProps> = ({
  color = '#FAF7EC',
  brushSize: initialBrushSize = 60,
  className = '',
  preRevealedSpots = [],
  living: initialLiving = false,
  patternType: initialPatternType = 'balance',
  fps: targetFps = 24,
  blendTopHeight = 100,
  waveAmplitude = 20,
  waveAnimate = true,
  showControlsToggle = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const patternCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const topMaskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const maskCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const patternCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const topMaskCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const displayCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const frameRef = useRef(0);
  const lastFrameTimeRef = useRef(0);
  const sizeRef = useRef({ width: 0, height: 0 });
  const isVisibleRef = useRef(true);
  const isIntersectingRef = useRef(true);
  const pendingDrawRef = useRef<{ x: number; y: number } | null>(null);
  const rafScheduledRef = useRef(false);
  const dirtyFrameRef = useRef(true);

  const [isInitialized, setIsInitialized] = useState(false);
  const [brushSize, setBrushSize] = useState(initialBrushSize);
  const [wildness, setWildness] = useState(1.2);
  const [roughness, setRoughness] = useState(0.5);
  const [flow, setFlow] = useState(1);
  const [brushStyle, setBrushStyle] = useState<'soft' | 'organic' | 'precise'>('organic');
  const [showControls, setShowControls] = useState(false);
  const [living, setLiving] = useState(initialLiving);
  const [patternType, setPatternType] = useState<PatternType>(initialPatternType);

  const patternTypes: PatternType[] = ['balance', 'duality', 'flow', 'chaos'];

  const initMask = useCallback(
    (width: number, height: number) => {
      const mask = maskCanvasRef.current;
      const ctx = maskCtxRef.current;
      if (!mask || !ctx) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      mask.width = width * dpr;
      mask.height = height * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = 'destination-out';
      const minDim = Math.min(width, height);
      // Deterministic jitter so patches keep their shape across resizes.
      const jitter = (seed: number) => Math.sin(seed * 127.1 + 311.7) * 0.5;
      preRevealedSpots.slice(0, 8).forEach(([nx, ny, nr], spotIndex) => {
        const x = width * Math.max(0, Math.min(1, nx));
        const y = height * Math.max(0, Math.min(1, ny));
        const radius = minDim * (nr ?? 0.08);
        const blobs = 5;
        for (let b = 0; b < blobs; b++) {
          const seed = spotIndex * 17 + b;
          const bx = x + jitter(seed) * radius * 0.9;
          const by = y + jitter(seed + 53) * radius * 0.9;
          const br = radius * (0.55 + Math.abs(jitter(seed + 97)) * 0.7);
          const g = ctx.createRadialGradient(bx, by, 0, bx, by, br);
          g.addColorStop(0, 'rgba(0,0,0,0.95)');
          g.addColorStop(0.6, 'rgba(0,0,0,0.6)');
          g.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(bx, by, br, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      dirtyFrameRef.current = true;
    },
    [preRevealedSpots],
  );

  const drawWatercolorWipe = useCallback(
    (x: number, y: number) => {
      const ctx = maskCtxRef.current;
      const mask = maskCanvasRef.current;
      if (!ctx || !mask) return;

      const last = lastPosRef.current;
      lastPosRef.current = { x, y };

      const wobbleMult = 0.05 + roughness * 0.35;
      const strokeRadius = brushSize * (0.5 + 0.5 * wildness);
      ctx.save();
      ctx.globalAlpha = flow;

      const drawSoftBrush = (px: number, py: number, radius: number) => {
        const g = ctx.createRadialGradient(px, py, 0, px, py, radius);
        g.addColorStop(0, 'rgba(0,0,0,0.9)');
        g.addColorStop(0.4, 'rgba(0,0,0,0.5)');
        g.addColorStop(0.7, 'rgba(0,0,0,0.15)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();
      };

      if (last) {
        const dx = x - last.x;
        const dy = y - last.y;
        const dist = Math.hypot(dx, dy) || 1;
        const steps = Math.max(5, Math.floor(dist / 6));

        for (let s = 0; s <= steps; s++) {
          const t = s / steps;
          const wobble = 1 + (Math.random() - 0.5) * wobbleMult;
          const px = last.x + dx * t + (Math.random() - 0.5) * strokeRadius * wobbleMult;
          const py = last.y + dy * t + (Math.random() - 0.5) * strokeRadius * wobbleMult;
          const r = strokeRadius * (0.75 + Math.random() * 0.5 * (1 + roughness)) * wobble;
          drawSoftBrush(px, py, r);
        }

        const angle = Math.atan2(dy, dx);
        const dripCount = Math.floor(3 * wildness) + 1;
        for (let i = 0; i < dripCount; i++) {
          const along = Math.random();
          const dripX = last.x + dx * along + (Math.random() - 0.5) * brushSize * 0.8;
          const dripY = last.y + dy * along + (Math.random() - 0.5) * brushSize * 0.8;
          const len = brushSize * (0.6 + Math.random() * 1.2) * wildness;
          const wid = brushSize * (0.2 + Math.random() * 0.35);
          const dripR = Math.max(len, wid) * 0.6;
          ctx.save();
          ctx.translate(dripX, dripY);
          ctx.rotate(angle);
          const g = ctx.createRadialGradient(-len * 0.3, 0, 0, 0, 0, dripR);
          g.addColorStop(0, 'rgba(0,0,0,0.7)');
          g.addColorStop(0.5, 'rgba(0,0,0,0.3)');
          g.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.ellipse(0, 0, len, wid, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      drawSoftBrush(x, y, strokeRadius * (0.8 + Math.random() * 0.4));

      const splatterCount = Math.max(2, Math.floor(8 * wildness * (0.5 + roughness)) + Math.floor(Math.random() * 6));
      for (let i = 0; i < splatterCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * brushSize * wildness * 0.7;
        const sx = x + Math.cos(angle) * distance + (Math.random() - 0.5) * brushSize * 0.3;
        const sy = y + Math.sin(angle) * distance + (Math.random() - 0.5) * brushSize * 0.3;
        const size = brushSize * (0.15 + Math.random() * 0.5);
        const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, size);
        g.addColorStop(0, 'rgba(0,0,0,0.5)');
        g.addColorStop(0.6, 'rgba(0,0,0,0.15)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(sx, sy, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
      dirtyFrameRef.current = true;
    },
    [brushSize, wildness, roughness, flow],
  );

  const renderPattern = useCallback(
    (width: number, height: number) => {
      const patternCanvas = patternCanvasRef.current;
      const ctx = patternCtxRef.current;
      if (!patternCanvas || !ctx) return;

      ctx.fillStyle = color;
      ctx.fillRect(0, 0, width, height);

      if (!living) return;

      const cols = Math.max(20, Math.floor(width / CELL_SIZE));
      const rows = Math.max(15, Math.floor(height / CELL_SIZE));
      const cellW = width / cols;
      const cellH = height / rows;
      const cx = cols / 2;
      const cy = rows / 2;
      const t = (frameRef.current * Math.PI) / (60 * SLOWDOWN_FACTOR);
      const patternFn = patterns[patternType];

      ctx.fillStyle = 'rgba(60,55,50,0.85)';
      ctx.font = `${Math.max(10, Math.round(cellH * 1.05))}px monospace`;
      ctx.textBaseline = 'top';

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const value = patternFn(col, row, t, cx, cy);
          const ch = valueToChar(value);
          ctx.fillText(ch, col * cellW, row * cellH);
        }
      }
    },
    [color, patternType, living],
  );

  const renderTopMask = useCallback(
    (width: number, height: number) => {
      const topMask = topMaskCanvasRef.current;
      const ctx = topMaskCtxRef.current;
      if (!topMask || !ctx) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      topMask.width = width * dpr;
      topMask.height = height * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      const t = waveAnimate ? (frameRef.current * Math.PI) / (60 * SLOWDOWN_FACTOR) : 0;
      const baseY = blendTopHeight;
      const maxWaveY = baseY + waveAmplitude;

      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(width, 0);
      for (let x = width; x >= 0; x -= 6) {
        const y = baseY + waveAmplitude * Math.sin((x / width) * Math.PI * 4 + t * 0.3);
        ctx.lineTo(x, y);
      }
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, 0, 0, maxWaveY);
      grad.addColorStop(0, 'rgba(0,0,0,0.95)');
      grad.addColorStop(0.6, 'rgba(0,0,0,0.3)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.globalCompositeOperation = 'source-over';
    },
    [blendTopHeight, waveAmplitude, waveAnimate],
  );

  const compositeFrame = useCallback(
    (width: number, height: number) => {
      const display = displayCanvasRef.current;
      const patternCanvas = patternCanvasRef.current;
      const maskCanvas = maskCanvasRef.current;
      const topMaskCanvas = topMaskCanvasRef.current;
      const displayCtx = displayCtxRef.current;
      if (!display || !displayCtx || !patternCanvas || !maskCanvas || !topMaskCanvas) return;

      displayCtx.save();
      displayCtx.setTransform(1, 0, 0, 1, 0, 0);
      displayCtx.globalCompositeOperation = 'source-over';
      displayCtx.drawImage(patternCanvas, 0, 0, width, height, 0, 0, display.width, display.height);
      displayCtx.globalCompositeOperation = 'destination-in';
      displayCtx.drawImage(maskCanvas, 0, 0, maskCanvas.width, maskCanvas.height, 0, 0, display.width, display.height);

      renderTopMask(width, height);
      displayCtx.globalCompositeOperation = 'destination-in';
      displayCtx.drawImage(topMaskCanvas, 0, 0, topMaskCanvas.width, topMaskCanvas.height, 0, 0, display.width, display.height);

      displayCtx.restore();
    },
    [renderTopMask],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    maskCanvasRef.current = document.createElement('canvas');
    patternCanvasRef.current = document.createElement('canvas');
    topMaskCanvasRef.current = document.createElement('canvas');
    const maskCtx = maskCanvasRef.current.getContext('2d', { willReadFrequently: false });
    const patternCtx = patternCanvasRef.current.getContext('2d', { willReadFrequently: false });
    const topMaskCtx = topMaskCanvasRef.current.getContext('2d', { willReadFrequently: false });
    const displayCanvas = displayCanvasRef.current;
    const displayCtx = displayCanvas?.getContext('2d', { willReadFrequently: false });

    if (!maskCtx || !patternCtx || !topMaskCtx || !displayCanvas || !displayCtx) return;
    maskCtxRef.current = maskCtx;
    patternCtxRef.current = patternCtx;
    topMaskCtxRef.current = topMaskCtx;
    displayCtxRef.current = displayCtx;

    const handleResize = () => {
      const parent = container.parentElement;
      if (!parent) return;

      const width = parent.offsetWidth;
      const height = parent.offsetHeight;
      if (width <= 0 || height <= 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      sizeRef.current = { width, height };

      displayCanvas.width = width * dpr;
      displayCanvas.height = height * dpr;
      displayCanvas.style.width = `${width}px`;
      displayCanvas.style.height = `${height}px`;
      displayCtx.setTransform(1, 0, 0, 1, 0, 0);
      displayCtx.scale(dpr, dpr);

      initMask(width, height);

      const patternCanvas = patternCanvasRef.current;
      if (patternCanvas) {
        patternCanvas.width = width;
        patternCanvas.height = height;
        patternCtx.setTransform(1, 0, 0, 1, 0, 0);
      }
    };

    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container.parentElement!);
    setIsInitialized(true);

    return () => {
      resizeObserver.disconnect();
      maskCanvasRef.current = null;
      patternCanvasRef.current = null;
      topMaskCanvasRef.current = null;
      maskCtxRef.current = null;
      patternCtxRef.current = null;
      topMaskCtxRef.current = null;
    };
  }, [initMask]);

  useEffect(() => {
    const handleVisibility = () => {
      isVisibleRef.current = document.visibilityState === 'visible';
    };
    handleVisibility();
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          isIntersectingRef.current = e.isIntersecting;
        }
      },
      { root: null, rootMargin: '100px', threshold: 0 },
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const interval = 1000 / targetFps;
    let rafId: number;

    const loop = (now: number) => {
      rafId = requestAnimationFrame(loop);
      if (!isVisibleRef.current || !isIntersectingRef.current) return;
      const elapsed = now - lastFrameTimeRef.current;
      if (elapsed < interval) return;
      lastFrameTimeRef.current = now;
      frameRef.current += 1;

      const { width, height } = sizeRef.current;
      if (width <= 0 || height <= 0) return;

      if (!living && !waveAnimate && !dirtyFrameRef.current) return;
      renderPattern(width, height);
      compositeFrame(width, height);
      dirtyFrameRef.current = false;
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [targetFps, renderPattern, compositeFrame, living, waveAnimate]);

  const flushPendingDraw = useCallback(() => {
    const pending = pendingDrawRef.current;
    rafScheduledRef.current = false;
    if (pending) {
      pendingDrawRef.current = null;
      drawWatercolorWipe(pending.x, pending.y);
    }
  }, [drawWatercolorWipe]);

  const scheduleDraw = useCallback(
    (x: number, y: number) => {
      pendingDrawRef.current = { x, y };
      if (!rafScheduledRef.current) {
        rafScheduledRef.current = true;
        requestAnimationFrame(flushPendingDraw);
      }
    },
    [flushPendingDraw],
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const display = displayCanvasRef.current;
    if (!display) return;
    const rect = display.getBoundingClientRect();
    scheduleDraw(e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const display = displayCanvasRef.current;
    if (!display) return;
    const rect = display.getBoundingClientRect();
    const touch = e.touches[0];
    scheduleDraw(touch.clientX - rect.left, touch.clientY - rect.top);
  };

  const handlePointerEnd = () => {
    lastPosRef.current = null;
  };

  const handleClick = () => {
    if (!living) return;
    setPatternType((prev) => {
      const idx = patternTypes.indexOf(prev);
      return patternTypes[(idx + 1) % patternTypes.length];
    });
  };

  const clearCanvas = () => {
    const { width, height } = sizeRef.current;
    if (width > 0 && height > 0) initMask(width, height);
    dirtyFrameRef.current = true;
  };

  return (
    <div ref={containerRef} className={`absolute inset-0 z-10 ${className}`}>
      <canvas
        ref={displayCanvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handlePointerEnd}
        onTouchMove={handleTouchMove}
        onTouchEnd={handlePointerEnd}
        onClick={handleClick}
        className={`w-full h-full cursor-crosshair pointer-events-auto touch-pan-y transition-opacity duration-1000 z-0 ${isInitialized ? 'opacity-100' : 'opacity-0'}`}
      />

      {showControlsToggle && (
      <div className="absolute top-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-auto">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowControls(!showControls);
          }}
          className="group bg-black/90 hover:bg-black p-3 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 border border-white/10"
          title="Customize Brush"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform duration-500 ${showControls ? 'rotate-90' : 'rotate-0'}`}
          >
            <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />
            <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="M22 12h-2" />
            <path d="M4 12H2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="m17.66 17.66 1.41 1.41" />
            <path d="m2 22 5-5" />
            <path d="m19.07 4.93-1.41 1.41" />
            <path d="m6.34 17.66-1.41 1.41" />
          </svg>
        </button>

        {showControls && (
          <div
            className="bg-black/95 backdrop-blur-xl p-6 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 flex flex-col gap-6 min-w-[240px] animate-in fade-in zoom-in-95 slide-in-from-top-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Brush Size</label>
                <span className="text-[10px] font-mono text-white/60">{brushSize}px</span>
              </div>
              <input
                type="range"
                min="10"
                max="300"
                value={brushSize}
                onChange={(e) => setBrushSize(Number(e.target.value))}
                className="w-full accent-white h-1.5 rounded-full cursor-pointer appearance-none bg-white/10"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Wildness</label>
                <span className="text-[10px] font-mono text-white/60">{(wildness * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={wildness}
                onChange={(e) => setWildness(Number(e.target.value))}
                className="w-full accent-white h-1.5 rounded-full cursor-pointer appearance-none bg-white/10"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Roughness</label>
                <span className="text-[10px] font-mono text-white/60">{(roughness * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={roughness}
                onChange={(e) => setRoughness(Number(e.target.value))}
                className="w-full accent-white h-1.5 rounded-full cursor-pointer appearance-none bg-white/10"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Flow</label>
                <span className="text-[10px] font-mono text-white/60">{(flow * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="1"
                step="0.05"
                value={flow}
                onChange={(e) => setFlow(Number(e.target.value))}
                className="w-full accent-white h-1.5 rounded-full cursor-pointer appearance-none bg-white/10"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Brush Style</label>
              <div className="flex gap-1.5">
                {(['soft', 'organic', 'precise'] as const).map((style) => (
                  <button
                    key={style}
                    type="button"
                    onClick={() => {
                      setBrushStyle(style);
                      if (style === 'precise') {
                        setRoughness(0.15);
                        setWildness(0.6);
                      } else if (style === 'organic') {
                        setRoughness(0.5);
                        setWildness(1.2);
                      } else {
                        setRoughness(0.85);
                        setWildness(1.6);
                      }
                    }}
                    className={`flex-1 py-2 text-[10px] font-semibold uppercase tracking-wider rounded-lg transition ${
                      brushStyle === style
                        ? 'bg-white text-black'
                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Way of Life</label>
              <button
                role="switch"
                aria-checked={living}
                onClick={() => {
                  dirtyFrameRef.current = true;
                  setLiving((prev) => !prev);
                }}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-white/40 focus:ring-offset-2 focus:ring-offset-black/50 ${
                  living ? 'bg-white/90' : 'bg-white/20'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-black shadow-lg ring-0 transition ${living ? 'translate-x-5' : 'translate-x-1'}`}
                />
              </button>
            </div>

            {living && (
              <div className="text-[10px] text-white/50">
                Pattern: {patternType} (click canvas to cycle)
              </div>
            )}

            <button
              onClick={clearCanvas}
              className="mt-2 w-full py-3 bg-white text-black text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-neutral-200 transition-all transform active:scale-95 shadow-lg"
            >
              Reset Playground
            </button>
          </div>
        )}
      </div>
      )}
    </div>
  );
}
