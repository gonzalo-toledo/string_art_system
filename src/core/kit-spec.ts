import { AlgorithmParams } from './algorithm/types';

/**
 * Resolución interna del canvas para el cálculo del algoritmo (en píxeles).
 * Un tamaño de 500x500 píxeles ofrece un excelente balance entre
 * precisión del trazo del hilo y rendimiento de ejecución en el navegador.
 */
export const CANVAS_SIZE = 500;

/**
 * Parámetros de configuración por defecto del algoritmo String Art.
 * Diseñados para coincidir con las especificaciones físicas del Kit Hácelo.
 */
export const DEFAULT_PARAMS: AlgorithmParams = {
  width: CANVAS_SIZE,
  height: CANVAS_SIZE,
  totalPins: 240,             // Cantidad de pines por defecto del kit físico Hácelo.
  maxIterations: 3000,        // Cantidad de líneas/hilos a generar para un buen contraste.
  lineWeight: 25,             // Peso tonal de cada pasada de hilo (cuánto oscurece el fondo).
  penaltyMultiplier: 2.0,     // Penalizador para evitar acumulación excesiva de hilos en zonas claras.
  minPinDistance: 20,         // Separación mínima de pines para evitar cruces redundantes en tramos cortos.
  boardRadius: 250            // Radio físico del bastidor en milímetros (diámetro total de 50 cm).
};
