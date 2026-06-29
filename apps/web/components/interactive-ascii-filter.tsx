"use client";

import { cn } from "@repo/design-system/lib/utils";
import { Slider } from "@repo/design-system/components/ui/slider";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  CHARACTER_SETS,
  applyContrastBrightness,
  applyDithering,
  clamp,
  interpolateColor,
  lerp,
  type CharacterSetMode,
  type ColorMode,
  type DitheringMode,
} from "@/components/interactive-ascii-utils";

type WhiteMode = "keep" | "ignore";

type InteractiveAsciiFilterProps = {
  imageSrc: string;
  className?: string;
  showControls?: boolean;
  defaultIntensity?: number;
  defaultDetail?: number;
  intensity?: number;
  onIntensityChange?: (value: number) => void;
  detail?: number;
  onDetailChange?: (value: number) => void;
  colorMode?: ColorMode;
  color?: string;
  gradientFrom?: string;
  gradientTo?: string;
  glowBlur?: number;
  glowOpacity?: number;
  glowThreshold?: number;
  invert?: boolean;
  whiteMode?: WhiteMode;
  characterSet?: CharacterSetMode;
  customCharacterSet?: string;
  dithering?: DitheringMode;
  cursorEnabled?: boolean;
  cursorWidthChars?: number;
  cursorSmoothing?: number;
};

const useControllableNumber = (
  controlledValue: number | undefined,
  defaultValue: number,
  onChange?: (value: number) => void,
): [number, (value: number) => void] => {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  const setValue = (nextValue: number): void => {
    if (!isControlled) {
      setInternalValue(nextValue);
    }
    onChange?.(nextValue);
  };

  return [value, setValue];
};

export const InteractiveAsciiFilter = ({
  imageSrc,
  className,
  showControls = false,
  defaultIntensity = 50,
  defaultDetail = 100,
  intensity,
  onIntensityChange,
  detail,
  onDetailChange,
  colorMode = "gradient",
  color = "#ffffff",
  gradientFrom = "#ffffff",
  gradientTo = "#111827",
  glowBlur = 8,
  glowOpacity = 1,
  glowThreshold = 50,
  invert = false,
  whiteMode = "ignore",
  characterSet = "detailed",
  customCharacterSet = "@%#*+=-:. ",
  dithering = "none",
  cursorEnabled = true,
  cursorWidthChars = 20,
  cursorSmoothing = 0,
}: InteractiveAsciiFilterProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const processCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const pointerTargetRef = useRef<{ x: number; y: number } | null>(null);
  const pointerSmoothRef = useRef<{ x: number; y: number } | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  const [resolvedIntensity, setResolvedIntensity] = useControllableNumber(
    intensity,
    defaultIntensity,
    onIntensityChange,
  );
  const [resolvedDetail, setResolvedDetail] = useControllableNumber(detail, defaultDetail, onDetailChange);

  const resolvedCharacterSet = useMemo(() => {
    if (characterSet === "custom") {
      const trimmed = customCharacterSet.trim();
      return trimmed.length > 0 ? trimmed : CHARACTER_SETS.standard;
    }
    return CHARACTER_SETS[characterSet];
  }, [characterSet, customCharacterSet]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return;
    }

    const observer = new ResizeObserver(() => {
      setSize({ width: node.clientWidth, height: node.clientHeight });
    });

    setSize({ width: node.clientWidth, height: node.clientHeight });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      imageRef.current = image;
    };
    image.onerror = () => {
      imageRef.current = null;
    };
    image.src = imageSrc;
  }, [imageSrc]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return;
    }

    const onMove = (event: MouseEvent): void => {
      const rect = node.getBoundingClientRect();
      pointerTargetRef.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
      if (!pointerSmoothRef.current) {
        pointerSmoothRef.current = { ...pointerTargetRef.current };
      }
    };

    const onLeave = (): void => {
      pointerTargetRef.current = null;
    };

    node.addEventListener("mousemove", onMove);
    node.addEventListener("mouseleave", onLeave);
    return () => {
      node.removeEventListener("mousemove", onMove);
      node.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) {
      return;
    }

    const processCanvas = processCanvasRef.current ?? document.createElement("canvas");
    processCanvasRef.current = processCanvas;
    const processContext = processCanvas.getContext("2d", { willReadFrequently: true });
    const canvasContext = canvas.getContext("2d");
    if (!processContext || !canvasContext) {
      return;
    }

    let frame = 0;
    let mounted = true;

    const render = (): void => {
      if (!mounted) {
        return;
      }

      const image = imageRef.current;
      const width = Math.max(0, Math.floor(size.width));
      const height = Math.max(0, Math.floor(size.height));

      if (!image || width <= 0 || height <= 0) {
        frame = requestAnimationFrame(render);
        return;
      }

      if (canvas.width !== width) {
        canvas.width = width;
      }
      if (canvas.height !== height) {
        canvas.height = height;
      }

      const detailWidth = clamp(Math.round(resolvedDetail), 20, 500);
      const detailHeight = Math.max(1, Math.round((height / width) * detailWidth * 0.55));
      processCanvas.width = detailWidth;
      processCanvas.height = detailHeight;

      const scale = Math.max(detailWidth / image.width, detailHeight / image.height);
      const drawWidth = image.width * scale;
      const drawHeight = image.height * scale;
      const drawX = (detailWidth - drawWidth) * 0.5;
      const drawY = (detailHeight - drawHeight) * 0.5;

      processContext.clearRect(0, 0, detailWidth, detailHeight);
      processContext.drawImage(image, drawX, drawY, drawWidth, drawHeight);

      const imageData = processContext.getImageData(0, 0, detailWidth, detailHeight);
      const pixels = imageData.data;
      const luminance = new Float32Array(detailWidth * detailHeight);

      const brightness = (resolvedIntensity - 50) * 1.2;
      const contrast = (resolvedIntensity - 50) * 1.6;

      for (let index = 0; index < luminance.length; index += 1) {
        const pixelIndex = index * 4;
        const r = pixels[pixelIndex];
        const g = pixels[pixelIndex + 1];
        const b = pixels[pixelIndex + 2];
        const source = 0.299 * r + 0.587 * g + 0.114 * b;
        luminance[index] = applyContrastBrightness(source, contrast, brightness);
      }

      const dithered = applyDithering(luminance, detailWidth, detailHeight, dithering);

      const pointerTarget = pointerTargetRef.current;
      const pointerSmooth = pointerSmoothRef.current;
      if (pointerTarget && cursorEnabled) {
        const smoothFactor = cursorSmoothing <= 0 ? 1 : clamp(0.04 + cursorSmoothing / 300, 0.04, 0.5);
        pointerSmoothRef.current = pointerSmooth
          ? {
              x: lerp(pointerSmooth.x, pointerTarget.x, smoothFactor),
              y: lerp(pointerSmooth.y, pointerTarget.y, smoothFactor),
            }
          : { ...pointerTarget };
      }

      const cursorPoint = pointerSmoothRef.current;
      const cellWidth = width / detailWidth;
      const cellHeight = height / detailHeight;
      const radiusChars = clamp(cursorWidthChars, 1, 500);
      const radiusPxX = radiusChars * cellWidth;
      const radiusPxY = radiusChars * cellHeight;

      canvasContext.clearRect(0, 0, width, height);
      canvasContext.textBaseline = "top";
      canvasContext.font = `${Math.max(8, Math.round(cellHeight * 1.1))}px monospace`;

      for (let y = 0; y < detailHeight; y += 1) {
        const colorRatio = detailHeight <= 1 ? 0 : y / (detailHeight - 1);
        const rowColor =
          colorMode === "solid"
            ? color
            : interpolateColor(colorMode === "glow" ? gradientFrom : gradientFrom, gradientTo, colorRatio);

        canvasContext.fillStyle = rowColor;
        if (colorMode === "glow") {
          canvasContext.shadowColor = rowColor;
          canvasContext.shadowBlur = glowBlur;
          canvasContext.globalAlpha = clamp(glowOpacity, 0, 1);
        } else {
          canvasContext.shadowBlur = 0;
          canvasContext.globalAlpha = 1;
        }

        for (let x = 0; x < detailWidth; x += 1) {
          const index = y * detailWidth + x;
          let value = dithered[index];

          if (cursorPoint && cursorEnabled) {
            const px = x * cellWidth;
            const py = y * cellHeight;
            const dx = (px - cursorPoint.x) / radiusPxX;
            const dy = (py - cursorPoint.y) / radiusPxY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= 1) {
              const strength = 1 - distance;
              if (invert) {
                value = lerp(value, 255 - value, strength);
              } else {
                value = clamp(value + strength * 90, 0, 255);
              }
            }
          }

          const adjusted = invert ? 255 - value : value;
          if (whiteMode === "ignore" && adjusted >= 250) {
            continue;
          }

          if (colorMode === "glow") {
            const thresholdValue = clamp(glowThreshold, 0, 100);
            if ((adjusted / 255) * 100 > thresholdValue) {
              continue;
            }
          }

          const charIndex = Math.floor((adjusted / 255) * (resolvedCharacterSet.length - 1));
          const char = resolvedCharacterSet[charIndex] ?? " ";
          const drawX = x * cellWidth;
          const drawY = y * cellHeight;
          canvasContext.fillText(char, drawX, drawY);
        }
      }

      canvasContext.globalAlpha = 1;
      canvasContext.shadowBlur = 0;
      frame = requestAnimationFrame(render);
    };

    frame = requestAnimationFrame(render);
    return () => {
      mounted = false;
      cancelAnimationFrame(frame);
    };
  }, [
    color,
    colorMode,
    cursorEnabled,
    cursorSmoothing,
    cursorWidthChars,
    dithering,
    glowBlur,
    glowOpacity,
    glowThreshold,
    gradientFrom,
    gradientTo,
    invert,
    resolvedCharacterSet,
    resolvedDetail,
    resolvedIntensity,
    size.height,
    size.width,
    whiteMode,
  ]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative isolate w-full h-[420px] overflow-hidden rounded-2xl border border-white/20 bg-black/30",
        className,
      )}
    >
      <img
        src={imageSrc}
        alt="ASCII filter source"
        className="absolute inset-0 h-full w-full object-cover"
        draggable={false}
      />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />

      {showControls ? (
        <div className="pointer-events-auto absolute bottom-3 left-3 right-3 z-20 rounded-xl bg-black/65 p-3 text-white backdrop-blur">
          <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-wider text-white/70">
            <span>Intensity</span>
            <span>{Math.round(resolvedIntensity)}</span>
          </div>
          <Slider
            value={[resolvedIntensity]}
            min={0}
            max={100}
            step={1}
            onValueChange={(values) => {
              const nextValue = values[0] ?? 50;
              setResolvedIntensity(nextValue);
            }}
          />

          <div className="mb-2 mt-3 flex items-center justify-between text-xs uppercase tracking-wider text-white/70">
            <span>Detail</span>
            <span>{Math.round(resolvedDetail)}</span>
          </div>
          <Slider
            value={[resolvedDetail]}
            min={20}
            max={320}
            step={1}
            onValueChange={(values) => {
              const nextValue = values[0] ?? 100;
              setResolvedDetail(nextValue);
            }}
          />
        </div>
      ) : null}
    </div>
  );
};

export type {
  CharacterSetMode,
  ColorMode,
  DitheringMode,
  InteractiveAsciiFilterProps,
};
