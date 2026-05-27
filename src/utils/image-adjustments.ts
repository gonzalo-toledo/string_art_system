/**
 * Tipos y funciones puras de ajuste de imagen.
 * Se ejecutan ANTES de la conversión a escala de grises, operando sobre datos RGB.
 */

// Parámetros de ajuste tonal de la imagen
export interface ImageAdjustments {
  brightness: number;   // -100 a 100, default 0
  contrast: number;     // -100 a 100, default 0
  whites: number;       // -100 a 100, default 0  (levanta/baja highlights)
  blacks: number;       // -100 a 100, default 0  (levanta/baja sombras)
  sharpness: number;    // 0 a 100, default 0
}

// Transformación de crop/zoom de la imagen
export interface CropTransform {
  offsetX: number;  // -1 a 1, normalizado. 0 = centrado
  offsetY: number;  // -1 a 1, normalizado. 0 = centrado
  zoom: number;     // 1 = ajustado, >1 = zoom in
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

/** Clampea un valor entre 0 y 255 */
function clamp(val: number): number {
  return val < 0 ? 0 : val > 255 ? 255 : val;
}

/**
 * Aplica brillo, contraste, blancos y negros sobre datos RGBA in-place.
 *
 * Pipeline de ajustes (en orden):
 * 1. Brillo: desplazamiento lineal de todos los canales RGB
 * 2. Contraste: escala alrededor del punto medio (128)
 * 3. Blancos: afecta solo highlights (luminancia > 180)
 * 4. Negros: afecta solo sombras (luminancia < 75)
 */
export function applyTonalAdjustments(
  data: Uint8ClampedArray,
  adj: ImageAdjustments
): void {
  // Pre-calcular factores para no repetir en cada píxel
  const brightnessShift = (adj.brightness / 100) * 255;
  // Factor de contraste: mapea [-100,100] a [0, ~3]. En 0 → factor=1.
  const contrastFactor = adj.contrast >= 0
    ? 1 + (adj.contrast / 100) * 2
    : 1 + (adj.contrast / 100);

  const whitesShift = (adj.whites / 100) * 80;   // máximo ±80 niveles
  const blacksShift = (adj.blacks / 100) * 80;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    // El canal alpha (data[i+3]) no se modifica

    // 1. Brillo
    r += brightnessShift;
    g += brightnessShift;
    b += brightnessShift;

    // 2. Contraste (alrededor del punto medio 128)
    r = (r - 128) * contrastFactor + 128;
    g = (g - 128) * contrastFactor + 128;
    b = (b - 128) * contrastFactor + 128;

    // 3. Blancos y Negros (ajuste tonal selectivo)
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    if (lum > 180 && whitesShift !== 0) {
      // Cuánto está este píxel "en los highlights" (0 a 1)
      const blend = Math.min((lum - 180) / 75, 1);
      r += whitesShift * blend;
      g += whitesShift * blend;
      b += whitesShift * blend;
    }

    if (lum < 75 && blacksShift !== 0) {
      // Cuánto está este píxel "en las sombras" (0 a 1)
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
 * Aplica máscara de nitidez (unsharp mask).
 * Usa un kernel 3×3 de convolución cruzado (arriba, abajo, izquierda, derecha).
 *
 * @param data - datos RGBA de la imagen
 * @param width - ancho en píxeles
 * @param height - alto en píxeles
 * @param amount - intensidad de nitidez (0-100)
 */
export function applySharpen(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  amount: number
): void {
  if (amount <= 0) return;

  const strength = amount / 100;  // 0 a 1

  // Trabajar sobre una copia para no leer píxeles ya modificados
  const copy = new Uint8ClampedArray(data);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;

      for (let c = 0; c < 3; c++) {
        // Kernel de nitidez 3×3: centro = 5, vecinos cruzados = -1
        const center = copy[idx + c];
        const top    = copy[((y - 1) * width + x) * 4 + c];
        const bottom = copy[((y + 1) * width + x) * 4 + c];
        const left   = copy[(y * width + (x - 1)) * 4 + c];
        const right  = copy[(y * width + (x + 1)) * 4 + c];

        const sharpened = center * 5 - top - bottom - left - right;
        // Mezclar entre original y versión con nitidez según la intensidad
        const result = center + (sharpened - center) * strength;
        data[idx + c] = clamp(result);
      }
    }
  }
}
