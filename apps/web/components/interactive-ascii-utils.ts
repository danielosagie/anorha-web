export type CharacterSetMode = "detailed" | "standard" | "blocks" | "binary" | "hex" | "custom";
export type DitheringMode = "none" | "floyd" | "atkinson" | "ordered";
export type ColorMode = "solid" | "gradient" | "glow";

export const CHARACTER_SETS: Record<Exclude<CharacterSetMode, "custom">, string> = {
  detailed: "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^`'. ",
  standard: "@%#*+=-:. ",
  blocks: "█▓▒░ ",
  binary: "01 ",
  hex: "0123456789ABCDEF ",
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

export const lerp = (from: number, to: number, amount: number): number => {
  return from + (to - from) * amount;
};

export const applyContrastBrightness = (value: number, contrast: number, brightness: number): number => {
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  return clamp(factor * (value - 128) + 128 + brightness, 0, 255);
};

type Rgb = {
  r: number;
  g: number;
  b: number;
};

const HEX_3 = /^#([0-9a-f]{3})$/i;
const HEX_6 = /^#([0-9a-f]{6})$/i;
const RGB = /^rgb\(\s*([0-9]+)\s*,\s*([0-9]+)\s*,\s*([0-9]+)\s*\)$/i;

export const parseColor = (input: string): Rgb => {
  const source = input.trim();
  const shortMatch = source.match(HEX_3);
  if (shortMatch) {
    const hex = shortMatch[1];
    return {
      r: Number.parseInt(hex[0] + hex[0], 16),
      g: Number.parseInt(hex[1] + hex[1], 16),
      b: Number.parseInt(hex[2] + hex[2], 16),
    };
  }

  const longMatch = source.match(HEX_6);
  if (longMatch) {
    const hex = longMatch[1];
    return {
      r: Number.parseInt(hex.slice(0, 2), 16),
      g: Number.parseInt(hex.slice(2, 4), 16),
      b: Number.parseInt(hex.slice(4, 6), 16),
    };
  }

  const rgbMatch = source.match(RGB);
  if (rgbMatch) {
    return {
      r: clamp(Number.parseInt(rgbMatch[1], 10), 0, 255),
      g: clamp(Number.parseInt(rgbMatch[2], 10), 0, 255),
      b: clamp(Number.parseInt(rgbMatch[3], 10), 0, 255),
    };
  }

  return { r: 255, g: 255, b: 255 };
};

export const interpolateColor = (from: string, to: string, amount: number): string => {
  const start = parseColor(from);
  const end = parseColor(to);
  const t = clamp(amount, 0, 1);
  const r = Math.round(lerp(start.r, end.r, t));
  const g = Math.round(lerp(start.g, end.g, t));
  const b = Math.round(lerp(start.b, end.b, t));
  return `rgb(${r}, ${g}, ${b})`;
};

const distributeError = (
  buffer: Float32Array,
  width: number,
  x: number,
  y: number,
  offsetX: number,
  offsetY: number,
  error: number,
  fraction: number,
): void => {
  const nx = x + offsetX;
  const ny = y + offsetY;
  if (nx < 0 || nx >= width || ny < 0) {
    return;
  }
  const index = ny * width + nx;
  if (index >= 0 && index < buffer.length) {
    buffer[index] = clamp(buffer[index] + error * fraction, 0, 255);
  }
};

export const applyDithering = (
  luminance: Float32Array,
  width: number,
  height: number,
  mode: DitheringMode,
): Float32Array => {
  if (mode === "none") {
    return luminance;
  }

  const output = new Float32Array(luminance);

  if (mode === "ordered") {
    const matrix = [
      [0, 8, 2, 10],
      [12, 4, 14, 6],
      [3, 11, 1, 9],
      [15, 7, 13, 5],
    ];
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = y * width + x;
        const threshold = (matrix[y % 4][x % 4] / 16) * 255;
        output[index] = output[index] > threshold ? 255 : 0;
      }
    }
    return output;
  }

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x;
      const oldPixel = output[index];
      const newPixel = oldPixel < 128 ? 0 : 255;
      output[index] = newPixel;
      const error = oldPixel - newPixel;

      if (mode === "floyd") {
        distributeError(output, width, x, y, 1, 0, error, 7 / 16);
        distributeError(output, width, x, y, -1, 1, error, 3 / 16);
        distributeError(output, width, x, y, 0, 1, error, 5 / 16);
        distributeError(output, width, x, y, 1, 1, error, 1 / 16);
      }

      if (mode === "atkinson") {
        distributeError(output, width, x, y, 1, 0, error, 1 / 8);
        distributeError(output, width, x, y, 2, 0, error, 1 / 8);
        distributeError(output, width, x, y, -1, 1, error, 1 / 8);
        distributeError(output, width, x, y, 0, 1, error, 1 / 8);
        distributeError(output, width, x, y, 1, 1, error, 1 / 8);
        distributeError(output, width, x, y, 0, 2, error, 1 / 8);
      }
    }
  }

  return output;
};
