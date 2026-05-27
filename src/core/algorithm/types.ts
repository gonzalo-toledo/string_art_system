// Parámetros del algoritmo de generación de string art
export interface AlgorithmParams {
  width: number;
  height: number;
  totalPins: number;
  maxIterations: number;
  lineWeight: number;           // Cuánto "oscurece" cada hilo (de 255)
  penaltyMultiplier: number;    // Factor de castigo por sobreoscurecer zonas claras
  minPinDistance: number;       // Mínimo de pines de separación para evitar líneas cortas
  boardRadius: number;          // Radio del tablero en mm
}

// --- Mensajes del Web Worker ---

// Mensaje que el hilo principal envía al worker para iniciar el cálculo
export interface WorkerStartMessage {
  type: 'start';
  imageData: Float32Array;      // Imagen en escala de grises invertida
  params: AlgorithmParams;
}

// Mensaje para detener el cálculo en curso
export interface WorkerStopMessage {
  type: 'stop';
}

export type WorkerMessage = WorkerStartMessage | WorkerStopMessage;

// --- Respuestas del Web Worker ---

// Reporte de progreso (enviado cada 100 iteraciones)
export interface WorkerProgressResponse {
  type: 'progress';
  iteration: number;
  totalIterations: number;
  score: number;
}

// Resultado final cuando el algoritmo termina
export interface WorkerCompleteResponse {
  type: 'complete';
  sequence: Uint16Array;        // Secuencia de pines generada
  totalMeters: number;          // Metros de hilo consumidos
  timeMs: number;               // Tiempo de ejecución en milisegundos
}

// Error durante la ejecución
export interface WorkerErrorResponse {
  type: 'error';
  message: string;
}

export type WorkerResponse =
  | WorkerProgressResponse
  | WorkerCompleteResponse
  | WorkerErrorResponse;

// --- Sesión del modo guiado ---

// Estado persistido en localStorage para retomar el armado del cuadro
export interface GuidedSession {
  sequence: number[];           // Secuencia completa de pines
  currentStep: number;          // Índice actual dentro de la secuencia
  totalSteps: number;           // Total de pasos (sequence.length - 1)
  config: {
    totalPins: number;          // Cantidad de pines con la que se generó
    maxIterations: number;      // Iteraciones configuradas
  };
  createdAt: string;            // Timestamp ISO de creación
  updatedAt: string;            // Timestamp ISO de última actualización
}
