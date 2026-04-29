# Proposal: Algoritmo Core de String Art

## Intent

Implementar el núcleo matemático (algoritmo greedy) que convierte una imagen en escala de grises en una secuencia de pasos para formar el string art. Es el corazón del sistema y su correcta implementación determinará la calidad y viabilidad de todo el proyecto "HáceloArt".

## Scope

### In Scope
- Implementación de Bresenham para trazado de líneas (con caché híbrido).
- Algoritmo Greedy con función de penalización (Approach B).
- Normalización y cálculo del "Score" por píxeles oscurecidos.
- Control de iteraciones máximas y umbral de calidad.
- Web Worker para aislar la carga pesada del hilo principal de UI.
- Filtro para descartar líneas entre pines demasiado cercanos.

### Out of Scope
- Detección facial o *Importance Mask* automática (Approach C).
- Procesamiento inicial de la foto (crop, contraste); el algoritmo asumirá que la foto ya entra pre-procesada.
- Render animado en canvas visual (esto pertenecerá a la capa visual, el worker sólo devolverá datos puros).

## Capabilities

### New Capabilities
- `string-art-core`: Encargado de transformar un mapa de píxeles procesado en una matriz/array de instrucciones (secuencia de pines).

### Modified Capabilities
- Ninguna (proyecto desde cero).

## Approach

Se implementará el "Approach B" investigado: un algoritmo de aproximación voraz (Greedy) que utiliza una penalización por "sobre-oscurecimiento" (overshoot) para evitar manchas de alto contraste. Para mantener un rendimiento óptimo en dispositivos móviles (restricción crítica), se ejecutará todo dentro de un Web Worker usando `TypedArrays` (`Float32Array` para el error image, `Uint16Array` para las líneas) y un tamaño de canvas interno reducido (400x400 o 300x300px), usando un pre-cómputo parcial de las líneas de Bresenham para reducir el consumo de RAM.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/core/algorithm` | New | Lógica puramente matemática (Bresenham, Greedy Loop) |
| `src/workers` | New | Web Worker wrapper para invocar el algoritmo de forma asíncrona |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Rendimiento inaceptable en móviles de gama baja | Medium | Uso de `TypedArrays`, Web Workers, resolución submuestreada (300px) y early termination por límite de tiempo/iteraciones. |
| Resultado visual pobre (manchas, muy oscuro) | Medium | Exponer `LINE_WEIGHT` y `PENALTY_MULT` para afinación manual si es necesario. |
| Consumo excesivo de RAM por caché de Bresenham | Low | Implementar caché "híbrido", guardando sólo líneas muy largas y calculando en tiempo real las cortas. |

## Rollback Plan

Al ser un componente nuevo y no estar integrado todavía al resto del sistema, un rollback consiste simplemente en eliminar la rama temporal o resetear los commits de esta tarea.

## Dependencies

- Ninguna dependencia externa crítica. Se basará en matemática vanilla (ES6).

## Success Criteria

- [ ] El algoritmo produce una secuencia válida de pines a partir de un array de píxeles en menos de 45 segundos en una CPU promedio.
- [ ] El Web Worker emite eventos de progreso periódicamente sin bloquear la UI principal.
- [ ] El resultado final no muestra "manchas" o artefactos indeseados severos al someterse a imágenes de prueba de contraste variable.
