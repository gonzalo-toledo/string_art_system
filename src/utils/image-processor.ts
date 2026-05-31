/**
 * Pipeline completo de procesamiento de imagen.
 *
 * Flujo: Archivo → HTMLImageElement → Canvas con crop/zoom →
 *        Ajustes tonales → Nitidez → Grayscale circular → Float32Array
 *
 * El Float32Array resultante es lo que recibe el algoritmo greedy:
 * cada valor representa cuánta "oscuridad" hay que cubrir con hilos.
 * 0 = blanco (no necesita hilos), 255 = negro (necesita máxima cobertura).
 */
import {
  ImageAdjustments,
  CropTransform,
  DEFAULT_ADJUSTMENTS,
  DEFAULT_CROP,
  applyTonalAdjustments,
  applySharpen,
} from './image-adjustments';

/**
 * Carga un archivo de imagen en un HTMLImageElement.
 * Retorna la imagen y un object URL (el caller debe revocar el URL cuando termine).
 */
export function loadImage(file: File): Promise<{ img: HTMLImageElement; objectUrl: string }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, objectUrl });
    img.onerror = () => reject(new Error('Error al cargar la imagen'));
    img.src = objectUrl;
  });
}

/**
 * Dibuja la imagen fuente en un canvas cuadrado aplicando crop/zoom.
 * Usa modo "cover" (la imagen cubre todo el cuadrado sin bordes vacíos).
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

  // Fondo blanco (los píxeles fuera del círculo serán blancos)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, targetSize, targetSize);

  // Calcular escala base (modo cover)
  const baseScale = Math.max(targetSize / img.width, targetSize / img.height);
  const scale = baseScale * crop.zoom;

  // Dimensiones escaladas
  const scaledW = img.width * scale;
  const scaledH = img.height * scale;

  // Centrar por defecto, luego aplicar offset
  // El offset está normalizado: -1 = todo a la izquierda, +1 = todo a la derecha
  const maxOffsetX = (scaledW - targetSize) / 2;
  const maxOffsetY = (scaledH - targetSize) / 2;

  const drawX = (targetSize - scaledW) / 2 - crop.offsetX * maxOffsetX;
  const drawY = (targetSize - scaledH) / 2 - crop.offsetY * maxOffsetY;

  ctx.drawImage(img, drawX, drawY, scaledW, scaledH);

  return canvas;
}

/**
 * Pipeline completo de procesamiento de imagen:
 * 1. Dibuja la imagen con crop/zoom en un canvas cuadrado
 * 2. Aplica ajustes tonales (brillo, contraste, blancos, negros)
 * 3. Aplica nitidez
 * 4. Convierte a grayscale circular en Float32Array + genera preview URL
 *
 * La conversión a grayscale invierte la luminancia: zonas oscuras de la foto
 * se convierten en valores altos (255 = "necesita muchos hilos").
 */
export function processImage(
  img: HTMLImageElement,
  targetSize: number,
  adjustments: ImageAdjustments = DEFAULT_ADJUSTMENTS,
  crop: CropTransform = DEFAULT_CROP
): { imageData: Float32Array; previewUrl: string } {
  // Paso 1: Dibujar con crop/zoom
  const canvas = drawImageWithCrop(img, targetSize, crop);
  const ctx = canvas.getContext('2d')!;

  // Paso 2 y 3: Aplicar ajustes sobre los datos RGB
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

  // Paso 4: Convertir a grayscale circular
  // Solo los píxeles DENTRO del círculo se convierten.
  // Los de afuera quedan en 0 (blanco, sin hilos).
  const radius = targetSize / 2;
  const floatData = new Float32Array(targetSize * targetSize);

  for (let y = 0; y < targetSize; y++) {
    for (let x = 0; x < targetSize; x++) {
      const idx = (y * targetSize + x) * 4;
      const dx = (x + 0.5) - radius;
      const dy = (y + 0.5) - radius;
      const distToCenter = Math.sqrt(dx * dx + dy * dy);

      if (distToCenter > radius) {
        // Fuera del círculo → blanco, sin hilos
        floatData[y * targetSize + x] = 0;
        data[idx] = 255;
        data[idx + 1] = 255;
        data[idx + 2] = 255;
        data[idx + 3] = 255;
      } else {
        // Dentro del círculo → calcular luminancia e invertir
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

        // Invertir: zonas oscuras → valores altos (necesitan hilos)
        floatData[y * targetSize + x] = 255 - luminance;

        // Actualizar el canvas para la preview en grayscale
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
 * Wrapper legacy para compatibilidad.
 * Usado por código que aún llama processImageToGrayscale(file, size).
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
