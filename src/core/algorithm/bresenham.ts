export interface Point {
  x: number;
  y: number;
}

export function generatePinCoordinates(totalPins: number, width: number, height: number): Point[] {
  const pins: Point[] = [];
  const radius = Math.min(width, height) / 2 - 1; // 1px padding
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

export class BresenhamCache {
  private cache = new Map<string, Uint16Array>();
  private CACHE_THRESHOLD = 150; // Cache lines longer than this many pixels

  constructor(private pins: Point[]) {}

  private getHash(pinA: number, pinB: number): string {
    // Line A->B uses the same pixels as B->A
    return pinA < pinB ? `${pinA}-${pinB}` : `${pinB}-${pinA}`;
  }

  public getLine(pinA: number, pinB: number): Uint16Array {
    const hash = this.getHash(pinA, pinB);
    const cached = this.cache.get(hash);
    if (cached) {
      return cached;
    }

    const line = calculateBresenhamLine(this.pins[pinA], this.pins[pinB]);
    
    // Only cache lines long enough to be worth it, saving RAM.
    if (line.length / 2 >= this.CACHE_THRESHOLD) {
      this.cache.set(hash, line);
    }
    
    return line;
  }

  public getCacheSize(): number {
    return this.cache.size;
  }
}
