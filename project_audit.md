# Auditoría Completa — HáceloArt String Art System

## Estado General

El proyecto es funcional con dos pantallas principales operativas: **Editor** y **Modo Guiado**. El core algorítmico está bien implementado. Sin embargo, hay divergencias significativas entre lo que documenta el `agents.md` y lo que realmente existe en el código.

---

## 1. Estructura Real vs agents.md

### Lo que el `agents.md` dice (sección 4)

```
modules/
├── image-editor/
├── string-art-algorithm/
├── output-generator/
├── i18n/
├── auth/
```

### Lo que REALMENTE existe

```
src/
├── app/[locale]/
│   ├── editor/page.tsx        (thin wrapper → EditorPage)
│   ├── guide/page.tsx         (thin wrapper → GuidePage)
│   ├── sandbox/page.tsx       (14KB — no documentado)
│   ├── layout.tsx
│   └── page.tsx               (landing mínima)
├── components/
│   ├── editor/                (EditorPage, CanvasRenderer, ImageAdjuster, ConfigPanel, ImageUploader)
│   └── guide/                 (GuidePage)
├── core/algorithm/            (bresenham, greedy, types + tests)
├── hooks/                     (useStringArtWorker, useGuidedSession, usePinSpeech, useWakeLock)
├── utils/                     (imageProcessor, imageAdjustments)
├── workers/                   (stringArt.worker.ts)
├── styles/                    (design-tokens.css — solo 12 líneas)
├── i18n.ts
└── middleware.ts
```

> [!WARNING]
> **La estructura `modules/` del agents.md NUNCA se implementó.** El código real usa una estructura plana `src/{components,core,hooks,utils,workers}`. Esto NO es un error — es una estructura viable — pero el agents.md miente sobre cómo está organizado el código.

### Diagnóstico de divergencia

| agents.md dice | Realidad | Impacto |
|---|---|---|
| `modules/image-editor/` | `src/components/editor/` + `src/utils/` | ⚠️ Documento miente |
| `modules/string-art-algorithm/` | `src/core/algorithm/` | ⚠️ Nombre diferente |
| `modules/output-generator/` (animation, pdf, audio) | Solo existe animación básica en CanvasRenderer, NO hay PDF, NO hay TTS API | 🔴 Features no implementadas |
| `modules/i18n/locales/` | `messages/` (raíz del proyecto, no dentro de modules) | ⚠️ Path diferente |
| `modules/auth/` | No existe (correcto, está diferido) | ✅ |
| `components/ui/` (design system) | No existe | ⚠️ Sin design system reutilizable |
| `components/layout/` | No existe | ⚠️ Sin layout components |
| `core/kit-spec.ts` | No existe como archivo separado | 🔴 Falta |
| `core/utils/math.ts`, `core/utils/canvas.ts` | No existen | 🔴 Faltan |
| `styles/tokens.css` (completo) | `design-tokens.css` con solo 5 variables | 🔴 Mínimo |
| `styles/globals.css` + `animations.css` | Solo `globals.css` mínimo (13 líneas) | ⚠️ Mínimo |
| `public/fonts/` (self-hosted) | No existe | 🔴 Falta |

---

## 2. Features: ¿Qué FUNCIONA y qué FALTA?

### ✅ Implementado y funcionando

| Feature | Archivos | Estado |
|---|---|---|
| **Algoritmo greedy** (Vrellis-style) | `greedy.ts`, `bresenham.ts` | ✅ Sólido |
| **Web Worker** | `stringArt.worker.ts`, `useStringArtWorker.ts` | ✅ Funcional |
| **Procesamiento de imagen** (crop, ajustes, grayscale circular) | `imageProcessor.ts`, `imageAdjustments.ts` | ✅ Completo |
| **Editor** con upload, ajustes, config, generación | `EditorPage.tsx` + sub-componentes | ✅ Funcional |
| **Modo Guiado** (mobile-first, step-by-step) | `GuidePage.tsx` | ✅ Completo |
| **Persistencia de sesión** (localStorage) | `useGuidedSession.ts` | ✅ Con guards |
| **Wake Lock** | `useWakeLock.ts` | ✅ Funcional |
| **Speech** (Web Speech API fallback) | `usePinSpeech.ts` | ✅ Funcional |
| **i18n** (ES/EN/PT) | `messages/*.json`, `next-intl` | ✅ Básico |
| **Animación canvas** (progressive drawing) | `CanvasRenderer.tsx` | ✅ Básica |
| **Tests unitarios** | `bresenham.test.ts`, `greedy.test.ts` | ✅ Básicos |
| **Touch swipe navigation** | `GuidePage.tsx` | ✅ |
| **Autoplay mode** | `GuidePage.tsx` | ✅ |
| **Visualizer modal** (mini canvas con progreso) | `GuidePage.tsx` | ✅ |
| **Sequence list modal** | `GuidePage.tsx` | ✅ |

### 🔴 NO implementado (listado en agents.md como feature)

| Feature | Estado | Prioridad |
|---|---|---|
| **PDF generation** (jsPDF template) | No existe | Alta para entrega |
| **Google Cloud TTS** (API route proxy) | No existe — solo Web Speech fallback | Media |
| **Landing page** (diseño real) | Solo `<h1>` + `<p>` placeholder | Alta para marketing |
| **Design system** (`components/ui/`) | No existe | Media |
| **kit-spec.ts** (constantes centralizadas) | Valores hardcodeados en EditorPage | Alta |
| **Animación con controles** (velocidad ×1/×5/×20/×100, scrubbing) | Solo batch de 50 líneas por frame, sin controles | Media |
| **API routes** (`/api/tts`, `/api/auth/*`) | No existen | Baja (auth diferido) |
| **Fonts self-hosted** | No existen | Baja |

---

## 3. Violaciones al `agents.md`

### 🔴 Violaciones críticas

1. **Texto hardcodeado en componentes** (viola sección 9: "toda cadena visible debe estar en i18n")
   - `ImageUploader.tsx`: "1. Upload Photo", "Select Image"
   - `ConfigPanel.tsx`: "2. Settings", "Lines:", "Pins:"
   - `EditorPage.tsx`: "3. Generate", "Start Generation", "Modo Guiado 🚀", "Copiar Secuencia", "Project in progress", "Continue", "Cancel project"
   - `ImageAdjuster.tsx`: "Ajustes de Imagen", "Reset", "Brillo", "Contraste", "Blancos", "Negros", "Nitidez", "Zoom", "Posición X", "Posición Y"

2. **`export default` usado en route pages y layout** (viola sección 13: "no usar export default")
   - `page.tsx` en landing, editor, guide → todos usan `export default`
   - `layout.tsx` → `export default`
   - NOTA: Esto es requerido por Next.js App Router. La regla del agents.md está MAL — Next.js EXIGE export default en page y layout.

3. **`any` usado en worker y hook** (viola sección 13: "nunca usar any")
   - `stringArt.worker.ts` L54, L66, L72: `(self as any).postMessage()`
   - `useWakeLock.ts` L6: `useRef<any>(null)`
   - `i18n.ts` L7: `locale as any`

4. **Pins configurables por el usuario** (viola sección 5: "240 pines FIJO, no configurable")
   - `ConfigPanel.tsx` expone slider de Pins: `min="150" max="300" step="10"`
   - El kit tiene 240 pines FIJOS. El usuario NO debería poder cambiarlo.

### ⚠️ Violaciones menores

5. **CSS con valores hardcodeados** en vez de tokens (viola sección 10)
   - `editor.module.css`: `#1a1a1a`, `#222`, `#333`, `#444`, etc. (deberían ser `var(--color-*)`)
   - `guide.module.css`: mismo patrón

6. **i18n inconsistente** — mezcla de español e inglés en la UI:
   - Labels en español: "Brillo", "Contraste", "Blancos" (ImageAdjuster)
   - Labels en inglés: "Upload Photo", "Settings", "Generate" (Editor)
   - "Modo Guiado 🚀" hardcodeado en español

7. **Naming no kebab-case** en algunos archivos (viola sección 13)
   - `imageProcessor.ts` → debería ser `image-processor.ts`
   - `imageAdjustments.ts` → `image-adjustments.ts`
   - `stringArt.worker.ts` → `string-art.worker.ts`
   - `EditorPage.tsx` → `editor-page.tsx`
   - etc.

---

## 4. Calidad del código — Análisis por archivo

### 🏗️ Core Algorithm (`core/algorithm/`)

#### [types.ts](file:///home/gonzalo/codeva/proyectos/string_art_system/src/core/algorithm/types.ts)
**Qué hace:** Define las interfaces para comunicación Worker ↔ Main y la sesión guiada.

- `AlgorithmParams`: parámetros del algoritmo (width, height, totalPins, maxIterations, lineWeight, penaltyMultiplier, minPinDistance, boardRadius)
- `WorkerMessage`: mensajes que recibe el worker (`start` con imageData como Float32Array, o `stop`)
- `WorkerResponse`: mensajes que emite el worker (`progress`, `complete` con Uint16Array, `error`)
- `GuidedSession`: estado de la sesión guiada persisten en localStorage

**Observaciones:**
- ✅ Bien tipado, sin `any`
- ⚠️ `GuidedSession` está acá pero semánticamente pertenece al dominio de la UI/guide, no al algoritmo
- ⚠️ No hay un tipo `KitSpec` centralizado — debería existir

---

#### [bresenham.ts](file:///home/gonzalo/codeva/proyectos/string_art_system/src/core/algorithm/bresenham.ts)
**Qué hace:** Tres cosas:
1. `generatePinCoordinates()` — calcula las posiciones (x,y) de N pines en un círculo
2. `calculateBresenhamLine()` — dado dos puntos, devuelve todos los pixels de la recta (Bresenham's line algorithm)
3. `BresenhamCache` — caché de líneas pre-computadas (solo cachea las largas, >150 pixels)

**Cómo funciona el algoritmo de Bresenham:**
- Es un algoritmo clásico de rasterización. Recorre la recta pixel a pixel usando solo sumas y comparaciones enteras (muy rápido).
- Retorna un `Uint16Array` con pares [x₀, y₀, x₁, y₁, ...] — cada par son las coordenadas de un pixel de la línea.

**Observaciones:**
- ✅ Implementación correcta del Bresenham estándar
- ✅ Caché inteligente: solo guarda líneas largas (>150px) para ahorrar RAM. Las líneas cortas (pines adyacentes) se recalculan cada vez porque es barato.
- ✅ Normalización del hash `getHash()` para que A→B y B→A compartan cache
- ⚠️ `CACHE_THRESHOLD = 150` es un magic number que podría ser configurable
- 💡 Los pines se generan con Pin 0 a las 3 en punto (0 radianes), sentido horario. Esto es correcto según el `agents.md`.

---

#### [greedy.ts](file:///home/gonzalo/codeva/proyectos/string_art_system/src/core/algorithm/greedy.ts) — ⭐ Corazón del sistema
**Qué hace:** Implementa el algoritmo greedy de Petros Vrellis para String Art.

**Flujo paso a paso:**

1. **Constructor**: recibe la imagen como `Float32Array` (escala de grises invertida: 0=blanco, 255=negro) y los parámetros. Copia la imagen en un `errorMap` que irá modificando. Genera las coordenadas de los pines y crea el cache de Bresenham. Empieza en pin 0.

2. **`computeNextLine()`** — el método CLAVE:
   - Desde el pin actual, evalúa TODOS los otros pines como posibles destinos
   - Filtros de descarte: no volver al pin anterior (anti-reversa), no pines muy cercanos (`minPinDistance`)
   - Para cada candidato, calcula un **score** recorriendo pixel por pixel la línea:
     - Si el pixel del `errorMap` es positivo (queda oscuridad por cubrir) → **suma** al score, limitado por `lineWeight`
     - Si es negativo (ya se pasó de oscuridad) → **penaliza** multiplicado por `penaltyMultiplier`
   - **Normaliza** el score dividiendo por la longitud de la línea (para no favorecer líneas largas arbitrariamente)
   - Elige el pin con mayor score normalizado
   - **"Dibuja" la línea**: resta `lineWeight` de cada pixel del errorMap a lo largo de la línea ganadora
   - Acumula metros de hilo usando la fórmula de cuerda: `2r·sin(θ/2)`

**Observaciones:**
- ✅ La lógica core es correcta y sigue el paper de Vrellis
- ✅ El sistema de score con penalty por overshoot es fundamental para la calidad de la imagen — esto es lo que evita que zonas claras se llenen de hilos
- ✅ Normalización por longitud — sin esto, el algoritmo siempre elegiría las diagonales más largas
- ⚠️ `lineWeight = 25` (default en EditorPage). El `agents.md` dice 30. Este valor es CRÍTICO para la calidad de la imagen.
- 💡 **Clave para tu mejora de calidad**: los parámetros que más afectan el resultado son `lineWeight` y `penaltyMultiplier`. Bajar `lineWeight` = más hilos finos, imagen más sutil. Subir `penaltyMultiplier` = más penalización por pasar de largo, evita zonas sobreoscurecidas.

---

### 🖼️ Image Processing (`utils/`)

#### [imageAdjustments.ts](file:///home/gonzalo/codeva/proyectos/string_art_system/src/utils/imageAdjustments.ts)
**Qué hace:** Funciones puras de manipulación de pixels ANTES de la conversión a grayscale.

**Pipeline de ajustes (en orden):**
1. **Brightness**: shift lineal de todos los canales RGB (+/- 255 levels)
2. **Contrast**: escala alrededor del punto medio (128). Factor 0→3 mapeado desde -100→+100
3. **Whites**: levanta/baja solo highlights (luminancia > 180). Usa blend proporcional.
4. **Blacks**: levanta/baja solo sombras (luminancia < 75). Usa blend proporcional.
5. **Sharpness**: unsharp mask con kernel 3×3 (center=5, vecinos=-1). Opera sobre una copia para no leer pixels ya modificados.

**Observaciones:**
- ✅ Las funciones son puras, operan in-place sobre `Uint8ClampedArray`
- ✅ Fórmula de luminancia correcta (ITU-R BT.601: 0.299R + 0.587G + 0.114B)
- ⚠️ El sharpen es básico (3×3 cruzado, no diagonal). Para mejorar la calidad de la imagen, se podría usar un kernel completo 3×3 con las 8 vecinos.
- 💡 `CropTransform` usa offset normalizado (-1 a +1) que es inteligente para ser responsive.

---

#### [imageProcessor.ts](file:///home/gonzalo/codeva/proyectos/string_art_system/src/utils/imageProcessor.ts)
**Qué hace:** Pipeline completo de procesamiento de imagen.

**Flujo:**
1. **`drawImageWithCrop()`**: dibuja la imagen sobre un canvas cuadrado (500×500) con crop/zoom. Fondo blanco. Modo "cover" para que no queden bordes.
2. **`processImage()`**: 
   - Llama a `drawImageWithCrop()` 
   - Aplica ajustes tonales si hay alguno no-default
   - Aplica sharpness si > 0
   - **Conversión circular a grayscale**: recorre pixel por pixel. Si está fuera del círculo → 0 (blanco). Si está dentro → `255 - luminancia` (invertido: zonas oscuras = valores altos = "necesitan hilos").
   - Genera una preview URL (data URL PNG) del resultado
3. **`processImageToGrayscale()`**: wrapper legacy que carga un File y procesa.

**Observaciones:**
- ✅ La inversión `255 - luminance` es correcta: el errorMap debe ser alto donde hay oscuridad (donde queremos hilos)
- ⚠️ `CANVAS_SIZE = 500` está hardcodeado en EditorPage, no en kit-spec
- 💡 **Impacto en calidad**: la resolución de 500px es el tamaño al que se procesa la imagen. Subir esto mejoraría el detalle PERO aumentaría exponencialmente el tiempo de cómputo (O(n²) en pixels, O(n) iteraciones del algoritmo recorriendo esos pixels).

---

### 🎨 UI Components (`components/`)

#### [EditorPage.tsx](file:///home/gonzalo/codeva/proyectos/string_art_system/src/components/editor/EditorPage.tsx) — Orquestador principal
**Qué hace:** Conecta todas las piezas: upload → ajustes → procesamiento → generación → resultado.

**Estado interno:**
- `params` (AlgorithmParams), `previewUrl`, `pixelData` (Float32Array), `adjustments`, `crop`
- `sourceImageRef` (HTMLImageElement raw para reprocesar)
- Worker hook para generación asíncrona

**Flujo de usuario:**
1. Upload → `handleImageSelected` → carga imagen, procesa, guarda preview
2. Ajustes → debounced (100ms) → reprocesa imagen con nuevos ajustes
3. Generate → manda pixelData al worker → muestra progreso
4. Resultado → botones "Modo Guiado" y "Copiar Secuencia"

**Observaciones:**
- ⚠️ Texto del confirm dialog en inglés hardcodeado
- ⚠️ Inline styles en el banner de sesión activa (debería ser CSS)
- ⚠️ `sourceImageRef.current` usado como condición de renderizado — esto NO causa re-render cuando se setea la ref, pero funciona porque `previewUrl` se setea justo después

---

#### [CanvasRenderer.tsx](file:///home/gonzalo/codeva/proyectos/string_art_system/src/components/editor/CanvasRenderer.tsx)
**Qué hace:** Dibuja el resultado del String Art en un canvas.

**Dos modos:**
1. **Sin secuencia**: muestra la preview de la imagen procesada (grayscale circular)
2. **Con secuencia**: animación progresiva dibujando 50 líneas por requestAnimationFrame

**Rendering:**
- Fondo blanco circular
- Líneas con `rgba(10, 10, 10, opacity)` donde opacity default = 0.15
- lineWidth default = 1

**Observaciones:**
- ⚠️ `lineOpacity = 0.15` y `lineWidth = 1` son valores por defecto que NO coinciden con el agents.md (que dice 0.15 alpha y 0.5-1px)
- 💡 **Clave para calidad de imagen**: estos valores de rendering (opacity y width) afectan ENORMEMENTE cómo se ve el resultado. El rendering actual puede no reflejar fielmente lo que el algoritmo calculó.
- ⚠️ No hay controles de velocidad de animación (el agents.md lista ×1, ×5, ×20, ×100)
- ⚠️ No hay pin labels ni visualización de pines en el canvas del editor

---

#### [GuidePage.tsx](file:///home/gonzalo/codeva/proyectos/string_art_system/src/components/guide/GuidePage.tsx) — 436 líneas
**Qué hace:** Pantalla mobile-first para guiar al usuario paso a paso.

**Features implementadas:**
- Display grande del pin destino (táctil para repetir audio)
- Navegación prev/next con botones + touch swipe
- Autoplay con velocidad configurable (1s a 5s)
- Modal visualizer con mini-canvas (thread rendering realista: lineWidth 0.3, opacity 0.09)
- Modal sequence list con progress coloring
- Wake lock integration
- Speech synthesis (Web Speech API)
- Language selector en header
- Estado de completado con celebración

**Observaciones:**
- ✅ Muy bien logrado para mobile — el diseño es funcional y la UX es sólida
- ⚠️ Es un componente ENORME (436 líneas). Debería splittearse en sub-componentes
- ⚠️ El visualizer dibuja TODAS las líneas cada vez que se abre el modal — si tenés 3000 líneas en step 2500, redibuja las 2500 cada vez. Esto puede ser lento.
- 💡 El rendering del visualizer (0.3 width, 0.09 opacity) es DIFERENTE al del editor (1 width, 0.15 opacity). Esto causa una inconsistencia visual entre lo que ves en el editor y lo que ves en el guide.

---

### 🪝 Hooks (`hooks/`)

#### [useStringArtWorker.ts](file:///home/gonzalo/codeva/proyectos/string_art_system/src/hooks/useStringArtWorker.ts)
- Maneja ciclo de vida del Web Worker (create, message, terminate)
- Expone: `{isRunning, progress, total, sequence, error, start, stop, reset}`
- ✅ Cleanup correcto en unmount y antes de re-start

#### [useGuidedSession.ts](file:///home/gonzalo/codeva/proyectos/string_art_system/src/hooks/useGuidedSession.ts)
- CRUD sobre localStorage con key `hacelo-art-session`
- `startSession`, `updateStep` (con clamp), `clearSession`
- ✅ Autosave en cada step change
- ✅ Hydration-safe (`typeof window` checks)

#### [usePinSpeech.ts](file:///home/gonzalo/codeva/proyectos/string_art_system/src/hooks/usePinSpeech.ts)
- Web Speech API wrapper con persistencia de preferencia on/off
- Multi-idioma (es/en/pt)
- ⚠️ Usa Web Speech API directamente (el agents.md lo tenía como FALLBACK, no primary)
- ⚠️ Envía el número como dígito ("Pin 234") en vez de como palabra ("Pin doscientos treinta y cuatro") como pide el agents.md

#### [useWakeLock.ts](file:///home/gonzalo/codeva/proyectos/string_art_system/src/hooks/useWakeLock.ts)
- Screen Wake Lock API con re-acquire on visibility change
- ✅ Bien implementado con manejo de errores

---

## 5. Recomendaciones de actualización del `agents.md`

> [!IMPORTANT]
> El `agents.md` necesita actualizarse para reflejar la REALIDAD del código, no un ideal que nunca se implementó. Un agents.md desalineado causa más daño que ninguno.

### Cambios recomendados:

1. **Sección 4 (Estructura de carpetas)**: Reescribir COMPLETA para reflejar la estructura `src/` real
2. **Sección 5 (Kit spec)**: Agregar nota de que `kit-spec.ts` no existe aún, los valores están en `EditorPage.tsx`
3. **Sección 6 (Algoritmo)**: Actualizar `LINE_DARKNESS` de 30 a 25 (valor real)
4. **Sección 7 (Animación)**: Marcar controles de velocidad y scrubbing como no implementados
5. **Sección 8 (Audio)**: Aclarar que solo está Web Speech API, no Google Cloud TTS
6. **Sección 13 (Convenciones)**: La regla de "no export default" necesita excepción para pages/layouts de Next.js
7. **Sección 13 (Naming)**: Los archivos actuales usan camelCase, no kebab-case. Decidir: ¿migrar o cambiar la convención?

---

## 6. Sandbox

Existe un `src/app/[locale]/sandbox/page.tsx` de **14KB** que no está documentado en el `agents.md`. Este archivo probablemente es una página de pruebas/experimentación.

---

## 7. Prioridades para mejorar calidad de imagen

Basado en mi lectura del código, los puntos que más impactan la calidad de la imagen generada son:

1. **`lineWeight`** (greedy.ts) — Cuánto "oscurece" cada hilo. Actual: 25. Bajar = más hilos finos, más detalle sutil. Subir = menos hilos, más contraste.
2. **`penaltyMultiplier`** (greedy.ts) — Penaliza sobreoscurecer. Actual: 2.0. Subir = menos artefactos en zonas claras.
3. **Canvas rendering** (CanvasRenderer.tsx) — `lineOpacity` (0.15) y `lineWidth` (1). Si estos NO coinciden con lo que el algoritmo asume (lineWeight=25 sobre 255), el resultado visual no refleja el cálculo.
4. **Resolución de procesamiento** — `CANVAS_SIZE = 500`. Más resolución = más detalle, más tiempo.
5. **Pre-procesamiento de imagen** — brightness/contrast/whites/blacks/sharpness antes de mandar al algoritmo.
6. **Anti-aliasing del Bresenham** — El Bresenham actual no hace anti-alias. Implementar Wu's line algorithm podría mejorar sutilmente la calidad.
