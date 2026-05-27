import { useState, useEffect, useRef, useCallback } from 'react';
import { AlgorithmParams, WorkerMessage, WorkerResponse } from '../core/algorithm/types';

export interface UseWorkerResult {
  isRunning: boolean;
  progress: number;
  total: number;
  sequence: Uint16Array | null;
  error: string | null;
  start: (imageData: Float32Array, params: AlgorithmParams) => void;
  stop: () => void;
  reset: () => void;
}

export function useStringArtWorker(): UseWorkerResult {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [sequence, setSequence] = useState<Uint16Array | null>(null);
  const [error, setError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);

  const cleanup = useCallback(() => {
    if (workerRef.current) {
      const stopMsg: WorkerMessage = { type: 'stop' };
      workerRef.current.postMessage(stopMsg);
      workerRef.current.terminate();
      workerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  const start = useCallback((imageData: Float32Array, params: AlgorithmParams) => {
    cleanup();
    setError(null);
    setSequence(null);
    setProgress(0);
    setTotal(params.maxIterations);
    setIsRunning(true);

    workerRef.current = new Worker(
      new URL('../workers/stringArt.worker.ts', import.meta.url),
      { type: 'module' }
    );

    workerRef.current.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const msg = e.data;
      if (msg.type === 'progress') {
        setProgress(msg.iteration);
      } else if (msg.type === 'complete') {
        setSequence(msg.sequence);
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

  const stop = useCallback(() => {
    cleanup();
    setIsRunning(false);
  }, [cleanup]);

  const reset = useCallback(() => {
    stop();
    setProgress(0);
    setSequence(null);
    setError(null);
  }, [stop]);

  return { isRunning, progress, total, sequence, error, start, stop, reset };
}
