export interface AlgorithmParams {
  width: number;
  height: number;
  totalPins: number;
  maxIterations: number;
  lineWeight: number;
  penaltyMultiplier: number;
  minPinDistance: number;
  boardRadius: number; // en mm
}

export interface WorkerStartMessage {
  type: 'start';
  imageData: Float32Array;
  params: AlgorithmParams;
}

export interface WorkerStopMessage {
  type: 'stop';
}

export type WorkerMessage = WorkerStartMessage | WorkerStopMessage;

export interface WorkerProgressResponse {
  type: 'progress';
  iteration: number;
  totalIterations: number;
  score: number;
}

export interface WorkerCompleteResponse {
  type: 'complete';
  sequence: Uint16Array;
  totalMeters: number;
  timeMs: number;
}

export interface WorkerErrorResponse {
  type: 'error';
  message: string;
}

export type WorkerResponse = 
  | WorkerProgressResponse 
  | WorkerCompleteResponse 
  | WorkerErrorResponse;
