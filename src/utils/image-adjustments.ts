/**
 * Image adjustment types and pure pixel manipulation functions.
 * These run BEFORE the grayscale conversion, operating on RGB data.
 */

export interface ImageAdjustments {
  brightness: number;   // -100 to 100, default 0
  contrast: number;     // -100 to 100, default 0
  whites: number;       // -100 to 100, default 0  (lifts/lowers highlights)
  blacks: number;       // -100 to 100, default 0  (lifts/lowers shadows)
  sharpness: number;    // 0 to 100, default 0
}

export interface CropTransform {
  offsetX: number;  // -1 to 1, normalized. 0 = centered
  offsetY: number;  // -1 to 1, normalized. 0 = centered
  zoom: number;     // 1 = fit, >1 = zoom in
}

export const DEFAULT_ADJUSTMENTS: ImageAdjustments = {
  brightness: 0,
  contrast: 0,
  whites: 0,
  blacks: 0,
  sharpness: 0,
};

export const DEFAULT_CROP: CropTransform = {
  offsetX: 0,
  offsetY: 0,
  zoom: 1,
};

/**
 * Clamp a value between 0 and 255.
 */
function clamp(val: number): number {
  return val < 0 ? 0 : val > 255 ? 255 : val;
}

/**
 * Apply brightness, contrast, whites, and blacks to RGBA pixel data in-place.
 * 
 * - Brightness: linear shift of all channels.
 * - Contrast: scale around midpoint (128).
 * - Whites: affects only highlights (pixels above ~180 luminance).
 * - Blacks: affects only shadows (pixels below ~75 luminance).
 */
export function applyTonalAdjustments(
  data: Uint8ClampedArray,
  adj: ImageAdjustments
): void {
  // Pre-compute factors
  const brightnessShift = (adj.brightness / 100) * 255;
  // Contrast factor: maps [-100,100] to [0, ~3]. At 0 → factor=1.
  const contrastFactor = adj.contrast >= 0
    ? 1 + (adj.contrast / 100) * 2
    : 1 + (adj.contrast / 100);
  
  const whitesShift = (adj.whites / 100) * 80;   // max ±80 levels
  const blacksShift = (adj.blacks / 100) * 80;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    // Skip alpha

    // 1. Brightness
    r += brightnessShift;
    g += brightnessShift;
    b += brightnessShift;

    // 2. Contrast (around midpoint 128)
    r = (r - 128) * contrastFactor + 128;
    g = (g - 128) * contrastFactor + 128;
    b = (b - 128) * contrastFactor + 128;

    // 3. Whites & Blacks (selective tonal adjustment)
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    if (lum > 180 && whitesShift !== 0) {
      // How much this pixel is "in the highlights" (0 to 1)
      const blend = Math.min((lum - 180) / 75, 1);
      r += whitesShift * blend;
      g += whitesShift * blend;
      b += whitesShift * blend;
    }

    if (lum < 75 && blacksShift !== 0) {
      // How much this pixel is "in the shadows" (0 to 1)
      const blend = Math.min((75 - lum) / 75, 1);
      r -= blacksShift * blend;
      g -= blacksShift * blend;
      b -= blacksShift * blend;
    }

    data[i] = clamp(r);
    data[i + 1] = clamp(g);
    data[i + 2] = clamp(b);
  }
}

/**
 * Apply unsharp mask for sharpness.
 * Uses a simple 3x3 kernel convolution approach.
 * 
 * @param data - RGBA pixel data
 * @param width - image width
 * @param height - image height 
 * @param amount - sharpness amount (0-100)
 */
export function applySharpen(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  amount: number
): void {
  if (amount <= 0) return;

  const strength = amount / 100;  // 0 to 1
  
  // Work on a copy to avoid reading modified pixels
  const copy = new Uint8ClampedArray(data);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;

      for (let c = 0; c < 3; c++) {
        // 3x3 sharpen kernel: center = 5, neighbors = -1
        const center = copy[idx + c];
        const top    = copy[((y - 1) * width + x) * 4 + c];
        const bottom = copy[((y + 1) * width + x) * 4 + c];
        const left   = copy[(y * width + (x - 1)) * 4 + c];
        const right  = copy[(y * width + (x + 1)) * 4 + c];

        const sharpened = center * 5 - top - bottom - left - right;
        // Blend between original and sharpened
        const result = center + (sharpened - center) * strength;
        data[idx + c] = clamp(result);
      }
    }
  }
}
