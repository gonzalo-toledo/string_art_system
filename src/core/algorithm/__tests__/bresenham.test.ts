import { calculateBresenhamLine, BresenhamCache, generatePinCoordinates, Point } from '../bresenham';

describe('Bresenham Math', () => {
  it('should generate correct pin coordinates', () => {
    const pins = generatePinCoordinates(4, 100, 100);
    expect(pins.length).toBe(4);
    // Pin 0 should be at top (12 o'clock). Center is 50, radius is 49.
    // Top is y = 50 - 49 = 1.
    expect(pins[0].x).toBe(50);
    expect(pins[0].y).toBe(1); 
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

  it('should cache long lines but not short ones', () => {
    const pins = generatePinCoordinates(240, 500, 500);
    const cache = new BresenhamCache(pins);
    
    // Line from pin 0 to pin 120 (opposite side, very long, crosses diameter ~500px)
    cache.getLine(0, 120);
    expect(cache.getCacheSize()).toBe(1);

    // Line from pin 0 to pin 1 (adjacent, very short)
    cache.getLine(0, 1);
    // Should still be 1 because it's below the CACHE_THRESHOLD (150px)
    expect(cache.getCacheSize()).toBe(1);
  });
});
