# Tasks: Editor UI y Procesamiento de Imagen

## Phase 1: Logic & Utilities

- [ ] 1.1 Crear `src/utils/imageProcessor.ts`. Implementar la función que toma una `img`, la dibuja en un canvas oculto recortada en círculo, la pasa a escala de grises y devuelve un `Float32Array` invertido.
- [ ] 1.2 Crear `src/hooks/useStringArtWorker.ts`. Configurar la inicialización del `new Worker()`, manejar los listeners `onmessage` y exponer `start()`, `stop()`, y los estados de progreso a React.

## Phase 2: Core Components

- [ ] 2.1 Crear `src/components/editor/editor.module.css` con estilos usando las variables base de `design-tokens.css`.
- [ ] 2.2 Crear `src/components/editor/ImageUploader.tsx` para manejar el input de archivo y previsualización de la foto original.
- [ ] 2.3 Crear `src/components/editor/ConfigPanel.tsx` con sliders para los parámetros `maxIterations` y `totalPins`.
- [ ] 2.4 Crear `src/components/editor/CanvasRenderer.tsx`. Este componente usará un `<canvas>` visible y tendrá un `useEffect` que dibuja las líneas de la secuencia incrementalmente.

## Phase 3: Integration & Routing

- [ ] 3.1 Crear `src/components/editor/EditorPage.tsx` para unir todos los componentes anteriores, manteniendo el estado global (archivo seleccionado, parámetros) e invocando el hook del Worker.
- [ ] 3.2 Crear `src/app/[locale]/editor/page.tsx` para exponer la URL pública en Next.js App Router e invocar al `EditorPage`.
