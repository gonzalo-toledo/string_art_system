import { AlgorithmParams } from './types';
import { BresenhamCache, generatePinCoordinates, Point } from './bresenham';

export class GreedyAlgorithm {
  private errorMap: Float32Array;
  private width: number;
  private pins: Point[];
  private cache: BresenhamCache;
  private sequence: number[] = [];
  private totalStringMeters: number = 0;
  
  private lineWeight: number;
  private penaltyMultiplier: number;
  private minPinDistance: number;
  private totalPins: number;
  private boardRadius: number;

  constructor(initialData: Float32Array, params: AlgorithmParams) {
    this.errorMap = new Float32Array(initialData); // Copy initial state
    this.width = params.width;
    this.totalPins = params.totalPins;
    this.lineWeight = params.lineWeight;
    this.penaltyMultiplier = params.penaltyMultiplier;
    this.minPinDistance = params.minPinDistance;
    this.boardRadius = params.boardRadius;

    this.pins = generatePinCoordinates(this.totalPins, this.width, params.height);
    this.cache = new BresenhamCache(this.pins);
    
    // Start at pin 0 by default
    this.sequence.push(0);
  }

  private getPinDistance(pinA: number, pinB: number): number {
    const diff = Math.abs(pinA - pinB);
    return Math.min(diff, this.totalPins - diff);
  }

  private calculateMeters(pinA: number, pinB: number): number {
    const distance = this.getPinDistance(pinA, pinB);
    // Chord length: 2 * r * sin(theta / 2)
    const angle = (distance * 2 * Math.PI) / this.totalPins;
    const lengthMm = 2 * this.boardRadius * Math.sin(angle / 2);
    return lengthMm / 1000;
  }

  public computeNextLine(): { nextPin: number, score: number } | null {
    const currentPin = this.sequence[this.sequence.length - 1];
    let bestScore = -Infinity;
    let bestPin = -1;
    let bestLinePixels: Uint16Array | null = null;

    // Evaluate all possible targets
    for (let targetPin = 0; targetPin < this.totalPins; targetPin++) {
      if (targetPin === currentPin) continue;

      // Prevent going back to the exact previous pin
      if (this.sequence.length > 1 && targetPin === this.sequence[this.sequence.length - 2]) {
        continue;
      }

      // Prevent very short lines
      if (this.getPinDistance(currentPin, targetPin) < this.minPinDistance) {
        continue;
      }

      const linePixels = this.cache.getLine(currentPin, targetPin);
      let score = 0;

      // Calculate score with penalty
      for (let i = 0; i < linePixels.length; i += 2) {
        const x = linePixels[i];
        const y = linePixels[i + 1];
        const idx = y * this.width + x;
        const remaining = this.errorMap[idx];

        if (remaining > 0) {
          score += Math.min(remaining, this.lineWeight); // Reward
        } else {
          score -= Math.abs(remaining) * this.penaltyMultiplier; // Penalty for overshoot
        }
      }

      // Normalize score by line length
      const length = linePixels.length / 2;
      const normalizedScore = score / length;

      if (normalizedScore > bestScore) {
        bestScore = normalizedScore;
        bestPin = targetPin;
        bestLinePixels = linePixels;
      }
    }

    if (bestPin !== -1 && bestLinePixels) {
      // Update error map by subtracting the line weight
      for (let i = 0; i < bestLinePixels.length; i += 2) {
        const x = bestLinePixels[i];
        const y = bestLinePixels[i + 1];
        const idx = y * this.width + x;
        this.errorMap[idx] -= this.lineWeight;
      }

      this.totalStringMeters += this.calculateMeters(currentPin, bestPin);
      this.sequence.push(bestPin);
      
      return { nextPin: bestPin, score: bestScore };
    }

    return null; // No valid line found
  }

  public getSequence(): Uint16Array {
    return new Uint16Array(this.sequence);
  }

  public getTotalMeters(): number {
    return this.totalStringMeters;
  }
}
