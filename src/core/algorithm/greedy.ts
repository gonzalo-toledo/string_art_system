import { AlgorithmParams } from './types';
import { BresenhamCache, generatePinCoordinates, Point, LineData } from './bresenham';

/**
 * Algoritmo greedy de String Art (basado en Petros Vrellis, 2013).
 *
 * Funciona sobre un "mapa de error" (errorMap) que representa cuánta oscuridad
 * queda por cubrir en cada píxel. En cada iteración elige la línea que mejor
 * reduce el error total, restando el peso de la línea de los píxeles que atraviesa.
 */
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
  private pinUsage: Uint16Array;

  // Para el radial weight boost (centro más importante que bordes)
  private centerX: number;
  private centerY: number;
  private canvasRadius: number;

  constructor(initialData: Float32Array, params: AlgorithmParams) {
    this.errorMap = new Float32Array(initialData); // Copia del estado inicial
    this.width = params.width;
    this.totalPins = params.totalPins;
    this.lineWeight = params.lineWeight;
    this.penaltyMultiplier = params.penaltyMultiplier;
    this.minPinDistance = params.minPinDistance;
    this.boardRadius = params.boardRadius;

    this.pins = generatePinCoordinates(this.totalPins, this.width, params.height);
    this.cache = new BresenhamCache(this.pins);
    this.pinUsage = new Uint16Array(this.totalPins);

    // Centro y radio del canvas para radial boost
    this.centerX = this.width / 2;
    this.centerY = params.height / 2;
    this.canvasRadius = Math.min(this.width, params.height) / 2;

    // Comienza en el pin 0 por defecto
    this.sequence.push(0);
  }

  /**
   * Factor radial: prioriza muy suavemente el centro sobre los bordes.
   * El centro del cuadro recibe un boost de 1.1x, mientras que
   * los bordes bajan a 0.9x. La diferencia es apenas perceptible
   * pero suficiente para darle prioridad al sujeto central.
   */
  private getRadialFactor(x: number, y: number): number {
    const dx = x - this.centerX;
    const dy = y - this.centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const normalizedDist = Math.min(dist / this.canvasRadius, 1.0);
    // 1.1 en el centro → 0.9 en el borde (±10%, muy sutil)
    return 1.1 - normalizedDist * 0.2;
  }

  /**
   * Calcula la distancia circular entre dos pines (en cantidad de pines).
   * Ejemplo: con 240 pines, la distancia entre pin 0 y pin 230 es 10 (no 230).
   */
  private getPinDistance(pinA: number, pinB: number): number {
    const diff = Math.abs(pinA - pinB);
    return Math.min(diff, this.totalPins - diff);
  }

  /**
   * Calcula los metros de hilo entre dos pines usando la fórmula de cuerda:
   * longitud = 2 * radio * sin(ángulo / 2)
   */
  private calculateMeters(pinA: number, pinB: number): number {
    const distance = this.getPinDistance(pinA, pinB);
    const angle = (distance * 2 * Math.PI) / this.totalPins;
    const lengthMm = 2 * this.boardRadius * Math.sin(angle / 2);
    return lengthMm / 1000;
  }

  /**
   * Calcula la siguiente línea óptima.
   *
   * Para cada pin candidato:
   * 1. Descarta si es el pin actual o el anterior (anti-reversa)
   * 2. Descarta si está demasiado cerca (minPinDistance)
   * 3. Recorre los píxeles de la línea calculando un score ponderado
   *    por cobertura fraccionaria (anti-aliased):
   *    - Píxeles con error positivo (queda oscuridad) → recompensa proporcional al peso
   *    - Píxeles con error negativo (ya sobreoscurecido) → castigo proporcional al peso
   * 4. Normaliza el score por la longitud de la línea
   * 5. Elige el pin con mayor score normalizado
   * 6. "Dibuja" la línea ganadora restando lineWeight * peso del errorMap
   *
   * Retorna null si no hay líneas válidas disponibles.
   */
  public computeNextLine(): { nextPin: number, score: number } | null {
    const currentPin = this.sequence[this.sequence.length - 1];
    let bestScore = -Infinity;
    let bestPin = -1;
    let bestLine: LineData | null = null;

    // Evaluar todos los pines candidatos
    for (let targetPin = 0; targetPin < this.totalPins; targetPin++) {
      if (targetPin === currentPin) continue;

      // No volver al pin inmediatamente anterior (anti-reversa)
      if (this.sequence.length > 1 && targetPin === this.sequence[this.sequence.length - 2]) {
        continue;
      }

      // No permitir líneas muy cortas
      if (this.getPinDistance(currentPin, targetPin) < this.minPinDistance) {
        continue;
      }

      const line = this.cache.getLine(currentPin, targetPin);
      let score = 0;

      // Calcular score con cobertura fraccionaria (anti-aliased) + radial boost
      for (let i = 0; i < line.coords.length; i += 2) {
        const x = line.coords[i];
        const y = line.coords[i + 1];
        const weight = line.weights[i / 2];
        const idx = y * this.width + x;
        const remaining = this.errorMap[idx];

        // Radial boost: el centro del cuadro es más importante que los bordes
        const radialFactor = this.getRadialFactor(x, y);

        if (remaining > 0) {
          // Ponderación por severidad: prioriza píxeles que más necesitan cobertura
          const severityFactor = 1 + (remaining / 255) * 0.5; // 1.0 a 1.5
          score += Math.min(remaining, this.lineWeight) * severityFactor * weight * radialFactor;
        } else {
          score -= Math.abs(remaining) * this.penaltyMultiplier * weight * radialFactor; // Castigo
        }
      }

      // Normalizar por pow(longitud, 0.6) para favorecer líneas largas
      // de forma moderada, sin sesgar a diámetros perfectos
      const normalizedScore = score / Math.pow(line.length, 0.6);

      // Penalización proporcional al score: evita forzar líneas cortas
      // en iteraciones tardías cuando el score baja
      let maxUsage = 0;
      for (let p = 0; p < this.totalPins; p++) {
        if (this.pinUsage[p] > maxUsage) maxUsage = this.pinUsage[p];
      }
      const usageRatio = maxUsage > 0 ? this.pinUsage[targetPin] / maxUsage : 0;
      const usagePenalty = normalizedScore * usageRatio * 0.1;
      const finalScore = normalizedScore - usagePenalty;

      if (finalScore > bestScore) {
        bestScore = finalScore;
        bestPin = targetPin;
        bestLine = line;
      }
    }

    if (bestPin !== -1 && bestLine) {
      // "Dibujar" la línea: restar peso adaptativo ponderado para evitar overshoot
      for (let i = 0; i < bestLine.coords.length; i += 2) {
        const x = bestLine.coords[i];
        const y = bestLine.coords[i + 1];
        const weight = bestLine.weights[i / 2];
        const idx = y * this.width + x;
        // Solo restar lo necesario para llegar a 0 (con margen 5)
        const remaining = this.errorMap[idx];
        const deduction = Math.min(this.lineWeight * weight, Math.max(remaining + 5, 0));
        this.errorMap[idx] -= deduction;
        // Clampear para evitar "zonas muertas" con valores negativos extremos
        if (this.errorMap[idx] < -this.lineWeight) {
          this.errorMap[idx] = -this.lineWeight;
        }
      }

      this.pinUsage[bestPin]++;

      this.totalStringMeters += this.calculateMeters(currentPin, bestPin);
      this.sequence.push(bestPin);

      return { nextPin: bestPin, score: bestScore };
    }

    return null; // No se encontró ninguna línea válida
  }

  /** Retorna la secuencia de pines generada hasta el momento */
  public getSequence(): Uint16Array {
    return new Uint16Array(this.sequence);
  }

  /** Retorna los metros totales de hilo consumidos */
  public getTotalMeters(): number {
    return this.totalStringMeters;
  }
}
