# Design: Algoritmo Core de String Art

## Technical Approach

El algoritmo se construirá como una librería pura (Vanilla TypeScript) que se ejecuta dentro de un Web Worker. Recibirá los datos de los píxeles (`Uint8ClampedArray` o `Float32Array`) y los parámetros de configuración. Utilizará un bucle voraz (greedy) para evaluar todas las conexiones posibles desde el pin actual usando el algoritmo de Bresenham, seleccionando la línea que mejor reduzca el error (diferencia con la imagen objetivo) considerando una penalización por sobre-oscurecimiento.

## Architecture Decisions

### Decision: Representación del Mapa de Error
**Choice**: Usar un `Float32Array` unidimensional de tamaño `width * height`.
**Alternatives considered**: Un array 2D `number[][]` o un array de objetos.
**Rationale**: Un `Float32Array` continuo en memoria maximiza el rendimiento del caché del procesador (cache locality) y es fundamental para la velocidad del bucle más interno (el cálculo del "score" de cada línea).

### Decision: Caché de Bresenham
**Choice**: Caché "Híbrido" (se pre-calculan y guardan solo las líneas de más de 150px de longitud; las más cortas se calculan en tiempo real).
**Alternatives considered**: Caché completo (pre-calcular las 28.680 líneas) o calcular todas "on the fly".
**Rationale**: El caché completo consume ~57MB de RAM, lo cual es prohibitivo para celulares de gama baja corriendo en el navegador. Calcular on-the-fly es demasiado lento para la CPU. El enfoque híbrido reduce la memoria a ~10MB manteniendo una alta velocidad de ejecución.

### Decision: Comunicación con el Worker
**Choice**: `postMessage` nativo con tipos estrictos definidos en TypeScript.
**Alternatives considered**: Usar librerías como `Comlink`.
**Rationale**: Mantener cero dependencias externas para el núcleo matemático facilita el testeo y hace que el código sea extremadamente portable y ligero.

## Data Flow

    UI (Main Thread)              Web Worker (stringArt.worker.ts)
           │                                      │
           ├─ 1. {type: 'start', params, image} ─→│
           │                                      │
           │←─ 2. {type: 'progress', percent} ────┤ (Se emite cada 100 iteraciones)
           │                                      │
           │←─ 3. {type: 'complete', sequence} ───┤
           ▼                                      ▼

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/core/algorithm/bresenham.ts` | Create | Funciones matemáticas para trazar líneas de píxeles y manejar el caché híbrido. |
| `src/core/algorithm/greedy.ts` | Create | El bucle principal del algoritmo (cálculo de score, actualización del error map). |
| `src/core/algorithm/types.ts` | Create | Definición de tipos de los mensajes del Worker y los parámetros del algoritmo. |
| `src/workers/stringArt.worker.ts` | Create | Entry-point del Web Worker que envuelve `greedy.ts` y se comunica con el Main Thread. |

## Interfaces / Contracts

```typescript
// src/core/algorithm/types.ts

export interface AlgorithmParams {
  width: number;
  height: number;
  totalPins: number;         // 240
  maxIterations: number;     // 3000
  lineWeight: number;        // 25
  penaltyMultiplier: number; // 2.0
  minPinDistance: number;    // 20
  boardRadius: number;       // en mm (250)
}

export type WorkerMessage = 
  | { type: 'start'; imageData: Float32Array; params: AlgorithmParams }
  | { type: 'stop' }; // Para forzar early termination manual

export type WorkerResponse = 
  | { type: 'progress'; iteration: number; totalIterations: number; score: number }
  | { type: 'complete'; sequence: Uint16Array; totalMeters: number; timeMs: number }
  | { type: 'error'; message: string };
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `bresenham.ts` | Verificar que genera los píxeles correctos dados dos puntos conocidos (ej. línea horizontal, vertical, diagonal). |
| Unit | `greedy.ts` | Pasar un canvas pequeño (10x10px) totalmente negro y asegurar que el algoritmo tira líneas de lado a lado. |

## Migration / Rollout

No migration required. (Nueva funcionalidad aislada).

## Open Questions

- [ ] ¿Cómo inyectaremos el worker en el contexto de Next.js más adelante? (Probablemente usemos un custom hook que instancie `new Worker(new URL(..., import.meta.url))`).
