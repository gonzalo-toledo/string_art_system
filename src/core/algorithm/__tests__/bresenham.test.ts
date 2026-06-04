import { calculateBresenhamLine, calculateAntiAliasedLine, BresenhamCache, generatePinCoordinates, Point } from '../bresenham';

describe('Bresenham Math', () => {
  it('should generate correct pin coordinates', () => {
    const pins = generatePinCoordinates(4, 100, 100);
    expect(pins.length).toBe(4);
    // Pin 0 should be at 3 o'clock (0 radians). Center is 50, radius is 49.
    // Right is x = 50 + 49 = 99.
    expect(pins[0].x).toBe(99);
    expect(pins[0].y).toBe(50); 
  });

  it('should calculate a straight horizontal line correctly', () => {
    const p0: Point = { x: 10, y: 10 };
    const p1: Point = { x: 14, y: 10 };
    const line = calculateBresenhamLine(p0, p1);
    
    // [x0, y0, x1, y1, x2, y2, x3, y3, x4, y4] => 5 points * 2 coords = 10 elements
    expect(line.length).toBe(10);
    expect(line[0]).toBe(10); // x0
    expect(line[1]).toBe(10); // y0
    expect(line[8]).toBe(14); // x4
    expect(line[9]).toBe(10); // y4
  });

  it('should precalculate and cache all lines', () => {
    const pins = generatePinCoordinates(240, 800, 800);
    const cache = new BresenhamCache(pins);
    
    // Line from pin 0 to pin 120 (opposite side, very long, crosses diameter ~800px)
    const line1 = cache.getLine(0, 120);
    expect(line1).toBeDefined();

    // Line from pin 0 to pin 1 (adjacent, very short)
    const line2 = cache.getLine(0, 1);
    expect(line2).toBeDefined();

    // El tamaño del array plano debe ser N * N
    expect(cache.getCacheSize()).toBe(240 * 240);
  });

  it('should calculate anti-aliased line with weights', () => {
    const p0: Point = { x: 0, y: 0 };
    const p1: Point = { x: 10, y: 0 };
    const line = calculateAntiAliasedLine(p0, p1);

    // Should have coords and weights arrays of equal length
    expect(line.coords.length).toBe(line.weights.length * 2);
    expect(line.length).toBeCloseTo(10, 0);

    // Weights are NOT normalized to 1.0 — they sum to approximately
    // the geometric length of the line, which keeps the greedy algorithm
    // working correctly with its existing length^0.6 score normalization.
    let totalWeight = 0;
    for (let i = 0; i < line.weights.length; i++) totalWeight += line.weights[i];
    expect(totalWeight).toBeGreaterThan(5);  // ~8-10 for a 10px line

    // Should cover all pixels from x=0 to x=10 along y=0
    for (let i = 0; i < line.coords.length; i += 2) {
      expect(line.coords[i + 1]).toBe(0); // y should be 0
    }
  });

  it('should calculate anti-aliased diagonal line with correct coverage', () => {
    const p0: Point = { x: 0, y: 0 };
    const p1: Point = { x: 5, y: 5 };
    const line = calculateAntiAliasedLine(p0, p1);

    // Diagonal line should have pixels near the main diagonal
    let foundDiagonalPixels = 0;
    for (let i = 0; i < line.coords.length; i += 2) {
      const x = line.coords[i];
      const y = line.coords[i + 1];
      if (Math.abs(x - y) <= 1) foundDiagonalPixels++;
    }
    expect(foundDiagonalPixels).toBeGreaterThan(line.coords.length / 4);

    // Weights sum to approximately the geometric length, not 1.0
    let totalWeight = 0;
    for (let i = 0; i < line.weights.length; i++) totalWeight += line.weights[i];
    expect(totalWeight).toBeGreaterThan(3); // ~4-6 for a 5px diagonal line
  });

  it('should return anti-aliased data from cache', () => {
    const pins = generatePinCoordinates(240, 800, 800);
    const cache = new BresenhamCache(pins);
    
    const line = cache.getLine(0, 120);
    expect(line.coords.length).toBeGreaterThan(0);
    expect(line.weights.length).toBe(line.coords.length / 2);
    expect(line.length).toBeGreaterThan(150);
  });
});
