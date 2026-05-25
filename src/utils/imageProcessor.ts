import {
  ImageAdjustments,
  CropTransform,
  DEFAULT_ADJUSTMENTS,
  DEFAULT_CROP,
  applyTonalAdjustments,
  applySharpen,
} from './imageAdjustments';

/**
 * Load a File into an HTMLImageElement.
 * Returns the image and an object URL (caller must revoke when done).
 */
export function loadImage(file: File): Promise<{ img: HTMLImageElement; objectUrl: string }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, objectUrl });
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = objectUrl;
  });
}

/**
 * Draw the source image onto a square canvas with crop/zoom applied.
 * Returns the canvas (caller owns it).
 */
function drawImageWithCrop(
  img: HTMLImageElement,
  targetSize: number,
  crop: CropTransform
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext('2d')!;

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, targetSize, targetSize);

  // Calculate base scale (cover mode)
  const baseScale = Math.max(targetSize / img.width, targetSize / img.height);
  const scale = baseScale * crop.zoom;

  // Scaled dimensions
  const scaledW = img.width * scale;
  const scaledH = img.height * scale;

  // Center by default, then apply offset
  // Offset is normalized: -1 = full left, +1 = full right
  const maxOffsetX = (scaledW - targetSize) / 2;
  const maxOffsetY = (scaledH - targetSize) / 2;
  
  const drawX = (targetSize - scaledW) / 2 - crop.offsetX * maxOffsetX;
  const drawY = (targetSize - scaledH) / 2 - crop.offsetY * maxOffsetY;

  ctx.drawImage(img, drawX, drawY, scaledW, scaledH);

  return canvas;
}

/**
 * Full image processing pipeline:
 * 1. Draw image with crop/zoom
 * 2. Apply tonal adjustments (brightness, contrast, whites, blacks)
 * 3. Apply sharpening
 * 4. Convert to circular grayscale Float32Array + preview URL
 */
export function processImage(
  img: HTMLImageElement,
  targetSize: number,
  adjustments: ImageAdjustments = DEFAULT_ADJUSTMENTS,
  crop: CropTransform = DEFAULT_CROP
): { imageData: Float32Array; previewUrl: string } {
  // Step 1: Draw with crop/zoom
  const canvas = drawImageWithCrop(img, targetSize, crop);
  const ctx = canvas.getContext('2d')!;

  // Step 2 & 3: Apply adjustments to RGB data
  const imageData = ctx.getImageData(0, 0, targetSize, targetSize);
  const data = imageData.data;

  const hasAdjustments = adjustments.brightness !== 0 || adjustments.contrast !== 0 ||
    adjustments.whites !== 0 || adjustments.blacks !== 0;

  if (hasAdjustments) {
    applyTonalAdjustments(data, adjustments);
  }

  if (adjustments.sharpness > 0) {
    applySharpen(data, targetSize, targetSize, adjustments.sharpness);
  }

  // Step 4: Convert to circular grayscale
  const radius = targetSize / 2;
  const floatData = new Float32Array(targetSize * targetSize);

  for (let y = 0; y < targetSize; y++) {
    for (let x = 0; x < targetSize; x++) {
      const idx = (y * targetSize + x) * 4;
      const distToCenter = Math.sqrt(Math.pow(x - radius, 2) + Math.pow(y - radius, 2));
      
      if (distToCenter > radius) {
        floatData[y * targetSize + x] = 0;
        data[idx] = 255;
        data[idx + 1] = 255;
        data[idx + 2] = 255;
        data[idx + 3] = 255;
      } else {
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
        
        floatData[y * targetSize + x] = 255 - luminance;
        
        data[idx] = luminance;
        data[idx + 1] = luminance;
        data[idx + 2] = luminance;
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  const previewUrl = canvas.toDataURL('image/png');

  return { imageData: floatData, previewUrl };
}

/**
 * Legacy wrapper for backward compatibility.
 * Used by code that still calls processImageToGrayscale(file, size).
 */
export async function processImageToGrayscale(
  file: File,
  targetSize: number
): Promise<{ imageData: Float32Array; previewUrl: string }> {
  const { img, objectUrl } = await loadImage(file);
  const result = processImage(img, targetSize);
  URL.revokeObjectURL(objectUrl);
  return result;
}
