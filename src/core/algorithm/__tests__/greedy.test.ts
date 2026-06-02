import { GreedyAlgorithm } from '../greedy';
import { AlgorithmParams } from '../types';

describe('Greedy Algorithm', () => {
  it('should terminate and return a sequence for a dark image', () => {
    const params: AlgorithmParams = {
      width: 100,
      height: 100,
      totalPins: 50,
      maxIterations: 100,
      lineWeight: 25,
      penaltyMultiplier: 2.0,
      minPinDistance: 5,
      boardRadius: 250
    };

    // Create a mock dark image (needs threads to fill it)
    const mockImage = new Float32Array(100 * 100);
    mockImage.fill(200); // 200 = very dark

    const algorithm = new GreedyAlgorithm(mockImage, params);
    
    // Run loop
    for (let i = 0; i < params.maxIterations; i++) {
      const result = algorithm.computeNextLine();
      if (!result || result.score < 0.5) {
        break; // Diminishing returns or no valid lines
      }
    }

    const sequence = algorithm.getSequence();
    
    // We expect it to have drawn multiple lines
    expect(sequence.length).toBeGreaterThan(1);
    // We expect it to have accumulated meters of string
    expect(algorithm.getTotalMeters()).toBeGreaterThan(0);
  });

  it('should not produce zigzag patterns between nearby pins', () => {
    const params: AlgorithmParams = {
      width: 200,
      height: 200,
      totalPins: 240,
      maxIterations: 300,
      lineWeight: 25,
      penaltyMultiplier: 2.0,
      minPinDistance: 15,
      boardRadius: 250
    };

    // Create a dark circular image
    const mockImage = new Float32Array(200 * 200);
    for (let y = 0; y < 200; y++) {
      for (let x = 0; x < 200; x++) {
        const dist = Math.sqrt(Math.pow(x - 100, 2) + Math.pow(y - 100, 2));
        if (dist < 95) {
          mockImage[y * 200 + x] = 200;
        }
      }
    }

    const algorithm = new GreedyAlgorithm(mockImage, params);
    
    for (let i = 0; i < params.maxIterations; i++) {
      const result = algorithm.computeNextLine();
      if (!result) break;
    }

    const sequence = Array.from(algorithm.getSequence());
    
    // Count consecutive short jumps (pin distance < 20)
    // These create the zigzag pattern we want to avoid
    let shortJumps = 0;
    for (let i = 1; i < sequence.length; i++) {
      const a = sequence[i - 1];
      const b = sequence[i];
      const diff = Math.abs(a - b);
      const circularDist = Math.min(diff, params.totalPins - diff);
      if (circularDist < 20) {
        shortJumps++;
      }
    }

    // With the anti-aliased fix, less than 30% should be short jumps
    // (before the fix, this was >90% due to weight normalization bug)
    const shortJumpRatio = shortJumps / (sequence.length - 1);
    expect(shortJumpRatio).toBeLessThan(0.3);
  });
});
