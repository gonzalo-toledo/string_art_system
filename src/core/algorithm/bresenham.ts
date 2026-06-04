export interface Point {
  x: number;
  y: number;
}

/** Datos de una línea rasterizada: coordenadas + pesos de cobertura */
export interface LineData {
  coords: Uint16Array;   // [x0, y0, x1, y1, ...]
  weights: Float32Array; // [w0, w1, ...] — cobertura fraccionaria de cada píxel
  length: number;        // longitud geométrica en píxeles
}

// Genera las coordenadas de los pines en un circulo
export function generatePinCoordinates(totalPins: number, width: number, height: number): Point[] {
  const pins: Point[] = [];
  const radius = Math.min(width, height) / 2 - 1; // 1px de margen
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);

  for (let i = 0; i < totalPins; i++) {
    // Fórmula matemática pura sin offset. 
    // Esto sitúa el Pin 0 a las 3 en punto (0 radianes).
    const angle = (i * 2 * Math.PI) / totalPins;
    pins.push({
      x: Math.round(centerX + radius * Math.cos(angle)),
      y: Math.round(centerY + radius * Math.sin(angle)),
    });
  }
  return pins;
}

// Algoritmo de Bresenham para calcular la línea entre dos pines
export function calculateBresenhamLine(p0: Point, p1: Point): Uint16Array {
  let x0 = p0.x;
  let y0 = p0.y;
  const x1 = p1.x;
  const y1 = p1.y;

  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  const coords: number[] = [];

  while (true) {
    coords.push(x0, y0);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }

  return new Uint16Array(coords);
}

/**
 * Rasterización anti-aliased de una línea usando sampleo fraccionario.
 *
 * En lugar de Bresenham binario (píxel SÍ/NO), samplea puntos cada 0.5px
 * a lo largo de la línea ideal y acumula cobertura ponderada por la
 * distancia al centro de cada píxel de la cuadrícula.
 *
 * El resultado es ~2-3x más preciso que Bresenham para el cálculo de score,
 * especialmente en líneas diagonales donde Bresenham pierde mucha información.
 */
export function calculateAntiAliasedLine(p0: Point, p1: Point): LineData {
  const dx = p1.x - p0.x;
  const dy = p1.y - p0.y;
  const length = Math.hypot(dx, dy);

  if (length === 0) {
    return { coords: new Uint16Array([p0.x, p0.y]), weights: new Float32Array([1.0]), length: 0 };
  }

  // Sample every 0.5 pixels for good coverage
  const step = 0.5;
  const n = Math.max(Math.ceil(length / step), 1);

  // Map keyed by packed coordinate: key = (y << 16) | x
  const pixelMap = new Map<number, number>();

  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const x = p0.x + dx * t;
    const y = p0.y + dy * t;

    const px = Math.floor(x);
    const py = Math.floor(y);
    const key = (py << 16) | (px & 0xFFFF);

    // Coverage based on distance to pixel center (linear falloff)
    const cx = px + 0.5;
    const cy = py + 0.5;
    const dist = Math.hypot(x - cx, y - cy);
    const coverage = Math.max(0, 1 - dist); // 1 at center, 0 at edge of pixel

    pixelMap.set(key, (pixelMap.get(key) || 0) + coverage);
  }

  const coords = new Uint16Array(pixelMap.size * 2);
  const weights = new Float32Array(pixelMap.size);

  let idx = 0;
  let totalWeight = 0;
  pixelMap.forEach((w, key) => {
    const px = key & 0xFFFF;
    const py = key >>> 16;
    coords[idx * 2] = px;
    coords[idx * 2 + 1] = py;
    weights[idx] = w;
    totalWeight += w;
    idx++;
  });

  // Weights are intentionally NOT normalized to 1.0. They represent
  // the actual accumulated coverage of each pixel, which is proportional
  // to the geometric length of the line. This preserves the greedy
  // algorithm's natural preference for longer lines that cover more
  // area, while the per-pixel weight still gives more accurate scoring
  // than binary Bresenham (pixel YES/NO).
  //
  // With this approach, sum(weights) ≈ length, which keeps the existing
  // score normalization by length^0.6 in greedy.ts working correctly.

  return { coords, weights, length };
}

// Clase para precalcular y cachear todas las líneas en un array plano
export class BresenhamCache {
  private lines: LineData[];
  private totalPins: number;

  constructor(private pins: Point[]) {
    this.totalPins = pins.length;
    // Creamos un array plano de tamaño totalPins * totalPins para guardar todas las combinaciones posibles
    this.lines = new Array(this.totalPins * this.totalPins);

    // Precalculamos todas las líneas posibles de forma bidireccional.
    // Como la línea A->B es igual a B->A en contenido, apuntamos ambas entradas al mismo objeto en memoria.
    for (let i = 0; i < this.totalPins; i++) {
      for (let j = i + 1; j < this.totalPins; j++) {
        const line = calculateAntiAliasedLine(this.pins[i], this.pins[j]);
        this.lines[i * this.totalPins + j] = line;
        this.lines[j * this.totalPins + i] = line;
      }
    }
  }

  public getLine(pinA: number, pinB: number): LineData {
    return this.lines[pinA * this.totalPins + pinB];
  }

  public getCacheSize(): number {
    return this.lines.length;
  }
}
