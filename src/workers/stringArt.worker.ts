import { WorkerMessage, WorkerResponse } from '../core/algorithm/types';
import { GreedyAlgorithm } from '../core/algorithm/greedy';

// Minimum score threshold to prevent drawing useless lines (diminishing returns)
const MIN_SCORE_THRESHOLD = 0.5;

let isRunning = false;

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const msg = e.data;

  if (msg.type === 'stop') {
    isRunning = false;
    return;
  }

  if (msg.type === 'start') {
    isRunning = true;
    const { imageData, params } = msg;
    const startTime = performance.now();

    try {
      const algorithm = new GreedyAlgorithm(imageData, params);

      let iteration = 0;
      let keepGoing = true;

      while (isRunning && keepGoing && iteration < params.maxIterations) {
        const result = algorithm.computeNextLine();

        if (!result) {
          keepGoing = false;
          break; // No more valid lines
        }

        if (result.score < MIN_SCORE_THRESHOLD) {
          keepGoing = false;
          break; // Diminishing returns reached
        }

        iteration++;

        // Report progress every 100 iterations to avoid flooding the main thread
        if (iteration % 100 === 0) {
          const progressMsg: WorkerResponse = {
            type: 'progress',
            iteration,
            totalIterations: params.maxIterations,
            score: result.score
          };
          // TypeScript environment in workers requires type casting for postMessage
          (self as any).postMessage(progressMsg);
        }
      }

      const endTime = performance.now();
      const completeMsg: WorkerResponse = {
        type: 'complete',
        sequence: algorithm.getSequence(),
        totalMeters: algorithm.getTotalMeters(),
        timeMs: endTime - startTime
      };

      (self as any).postMessage(completeMsg);
    } catch (err: any) {
      const errorMsg: WorkerResponse = {
        type: 'error',
        message: err.message || 'Unknown error occurred in worker'
      };
      (self as any).postMessage(errorMsg);
    } finally {
      isRunning = false;
    }
  }
};
