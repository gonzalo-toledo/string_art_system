/**
 * Hook para manejar el ciclo de vida del Web Worker del algoritmo.
 *
 * El Web Worker es un hilo separado del browser que ejecuta el cálculo pesado
 * sin bloquear la interfaz. Este hook se encarga de:
 * - Crear el worker cuando se inicia la generación
 * - Escuchar los mensajes de progreso y resultado
 * - Limpiar el worker cuando termina o se desmonta el componente
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { AlgorithmParams, WorkerMessage, WorkerResponse } from '../core/algorithm/types';

export interface UseWorkerResult {
  isRunning: boolean;               // ¿Está el worker calculando?
  progress: number;                 // Iteración actual
  total: number;                    // Total de iteraciones configuradas
  sequence: Uint16Array | null;     // Secuencia resultante (null hasta que termine)
  totalMeters: number;              // Metros de hilo consumidos
  error: string | null;             // Mensaje de error si falló
  start: (imageData: Float32Array, params: AlgorithmParams) => void;
  stop: () => void;
  reset: () => void;
  restore: (sequence: Uint16Array, totalMeters: number) => void;
}

export function useStringArtWorker(): UseWorkerResult {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [sequence, setSequence] = useState<Uint16Array | null>(null);
  const [totalMeters, setTotalMeters] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);

  // Enviar señal de stop y terminar el worker
  const cleanup = useCallback(() => {
    if (workerRef.current) {
      const stopMsg: WorkerMessage = { type: 'stop' };
      workerRef.current.postMessage(stopMsg);
      workerRef.current.terminate();
      workerRef.current = null;
    }
  }, []);

  // Limpiar el worker al desmontar el componente
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Iniciar el cálculo: crea un nuevo worker y le envía la imagen + parámetros
  const start = useCallback((imageData: Float32Array, params: AlgorithmParams) => {
    cleanup();
    setError(null);
    setSequence(null);
    setProgress(0);
    setTotal(params.maxIterations);
    setIsRunning(true);

    workerRef.current = new Worker(
      new URL('../workers/string-art.worker.ts', import.meta.url),
      { type: 'module' }
    );

    // Escuchar mensajes del worker
    workerRef.current.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const msg = e.data;
      if (msg.type === 'progress') {
        setProgress(msg.iteration);
      } else if (msg.type === 'complete') {
        setSequence(msg.sequence);
        setTotalMeters(msg.totalMeters);
        setProgress(params.maxIterations);
        setIsRunning(false);
        cleanup();
      } else if (msg.type === 'error') {
        setError(msg.message);
        setIsRunning(false);
        cleanup();
      }
    };

    const startMsg: WorkerMessage = { type: 'start', imageData, params };
    workerRef.current.postMessage(startMsg);
  }, [cleanup]);

  // Detener el cálculo manualmente
  const stop = useCallback(() => {
    cleanup();
    setIsRunning(false);
  }, [cleanup]);

  // Resetear todo el estado (para nueva imagen)
  const reset = useCallback(() => {
    stop();
    setProgress(0);
    setSequence(null);
    setTotalMeters(0);
    setError(null);
  }, [stop]);

  // Restaurar una secuencia previamente generada (desde localStorage)
  const restore = useCallback((savedSequence: Uint16Array, savedTotalMeters: number) => {
    setSequence(savedSequence);
    setTotalMeters(savedTotalMeters);
    setIsRunning(false);
    setError(null);
  }, []);

  return { isRunning, progress, total, sequence, totalMeters, error, start, stop, reset, restore };
}
