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
});
