# Tasks: Algoritmo Core de String Art

## Phase 1: Foundation

- [x] 1.1 Crear `src/core/algorithm/types.ts` y exportar las interfaces `AlgorithmParams`, `WorkerMessage` y `WorkerResponse`.

## Phase 2: Core Math & Logic

- [x] 2.1 Crear `src/core/algorithm/bresenham.ts`. Implementar función para calcular puntos de la línea y la clase `BresenhamCache` con lógica de caché híbrido (solo guardar si la distancia > 150px).
- [x] 2.2 Crear `src/core/algorithm/greedy.ts`. Implementar la clase `GreedyAlgorithm` que inicializa el `Float32Array` y tiene el método `computeNextLine()` aplicando la lógica de *score* y *penalización*.
- [x] 2.3 En `greedy.ts`, implementar el bucle principal que corre hasta `maxIterations` o hasta cruzar el umbral de diminishing returns.

## Phase 3: Worker Integration

- [x] 3.1 Crear `src/workers/stringArt.worker.ts`. Configurar el listener `onmessage` para parsear `WorkerMessage`, instanciar `GreedyAlgorithm` y usar `postMessage` para emitir el progreso cada 100 iteraciones y el resultado final.

## Phase 4: Verification

- [x] 4.1 Escribir test (o script de testeo manual) para `bresenham.ts` validando que devuelve los píxeles correctos para líneas rectas y diagonales.
- [x] 4.2 Escribir test para `greedy.ts` pasándole un array de píxeles negros y validando que devuelve una secuencia válida de pines.
