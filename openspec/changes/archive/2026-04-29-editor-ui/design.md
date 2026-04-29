# Design: Editor UI y Procesamiento de Imagen

## Technical Approach

La UI del editor será un componente de Next.js renderizado del lado del cliente (`"use client"`). Se dividirá en controladores (subida y parámetros) y el renderizador visual (`<canvas>`). La lógica pesada de la instanciación del Web Worker y la gestión de la cola de eventos se encapsulará en un Custom Hook (`useStringArtWorker`) para mantener limpios los componentes visuales.

## Architecture Decisions

### Decision: Extracción de Píxeles
**Choice**: Usar un `<canvas>` HTML invisible para dibujar la imagen subida y llamar a `ctx.getImageData()`.
**Alternatives considered**: Usar librerías de manipulación de imágenes como `Jimp` o leer el binario a mano.
**Rationale**: El navegador ya tiene implementada la decodificación ultra-rápida de imágenes (JPEG/PNG) nativa a través del tag `<img/>` y `<canvas>`. Hacer esto en el cliente con las APIs nativas no cuesta bytes adicionales en el bundle.

### Decision: Hook para el Worker
**Choice**: Empaquetar el Web Worker dentro de un hook `useStringArtWorker` que retorna `start()`, `stop()`, `progress` y `status`.
**Alternatives considered**: Manejar el Worker directamente dentro de un componente React.
**Rationale**: Separar el ciclo de vida del Worker (que es complicado y propenso a memory leaks si no se limpia con `worker.terminate()`) de la UI asegura que no generemos hilos huérfanos cuando el usuario navegue a otra página.

### Decision: Patrón de Renderizado en Canvas
**Choice**: Dibujar iterativamente guardando el estado anterior, es decir, el `<canvas>` no se borra en cada frame, solo se le suman las líneas nuevas que llegan desde el Worker.
**Alternatives considered**: Borrar y re-dibujar las 3000 líneas en cada frame (60fps).
**Rationale**: A diferencia de los videojuegos, el String Art nunca borra hilos, solo agrega. Redibujar 3000 líneas por frame mataría el procesador gráfico del celular. Sumar sobre lo ya dibujado garantiza 60FPS constantes en dispositivos de gama baja.

## Data Flow

    UI Components                 Hooks / Utils                     Web Worker
          │                             │                                │
    1. Upload ──→ <canvas> invisible ──→ processImage() ──→ Float32Array │
          │                             │                                │
    2. Click Generate ─────────────→ useStringArtWorker() ──── postMessage ─→ (Algoritmo Greedy)
          │                             │                                │
          │ ←──── useEffect actualiza ─── progress event  ←── postMessage ──
          ▼                             │                                
    <CanvasRenderer> (Dibuja líneas)    │

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/app/[locale]/editor/page.tsx` | Create | Ruta `/editor` que importa el contenedor principal. |
| `src/components/editor/EditorPage.tsx` | Create | Contenedor principal que maneja el estado global del editor. |
| `src/components/editor/ImageUploader.tsx` | Create | Botón de subida y lectura de `File` a `DataURL`. |
| `src/components/editor/CanvasRenderer.tsx` | Create | Componente que dibuja el marco circular y las líneas. |
| `src/utils/imageProcessor.ts` | Create | Funciones para convertir a grises y enmascarar en círculo. |
| `src/hooks/useStringArtWorker.ts` | Create | Hook para orquestar la comunicación con el Worker. |
| `src/components/editor/editor.module.css` | Create | Estilos específicos usando CSS Modules y Design Tokens. |

## Interfaces / Contracts

```typescript
// src/hooks/useStringArtWorker.ts
export interface UseWorkerResult {
  isRunning: boolean;
  progress: number;
  total: number;
  sequence: Uint16Array | null;
  start: (imageData: Float32Array, params: AlgorithmParams) => void;
  stop: () => void;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `imageProcessor.ts` | Validar (idealmente más adelante) que el array devuelto tiene el tamaño `width * height`. |
| Manual | Memoria | Cargar 5 imágenes seguidas y clickear "Generar" repetidas veces para confirmar que `useStringArtWorker` limpia los Workers anteriores (evitando RAM leaks). |

## Migration / Rollout

No aplica.
