# agents.md — HáceloArt: Generador de String Art

Este archivo le da contexto crítico a cualquier agente de IA (Cursor, Claude, Copilot, etc.)
que trabaje en este proyecto. **Leelo completo antes de generar o modificar cualquier código.**

---

## 1. Qué es este proyecto

Aplicación web **mobile-first** que genera patrones de **String Art** a partir de fotografías.
El sistema calcula la secuencia óptima de hilos entre pines distribuidos en un tablero
circular, y produce tres outputs: animación visual, PDF instructivo y audio guía.

El cliente es **Hagalo** (hagalo.com.ar), una empresa argentina que vende kits físicos de
String Art. Este software reemplaza la dependencia actual de farostringart.com con un sistema
propio, branded y con funcionalidades superiores.

**El sistema se integrará en la web de Hagalo** (Shopify) — ya sea como subdominio o embebido.
La definición exacta de la integración está pendiente con el cliente. El diseño visual deberá
adaptarse al look & feel de la web de Hagalo cuando se defina.

**Los usuarios finales son compradores del kit** que usan el celular mientras arman el cuadro.
La interfaz debe ser 100% funcional con una sola mano en pantalla táctil.

---

## 2. Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 14 (App Router) |
| Lenguaje | TypeScript (strict mode) |
| Estilos | Vanilla CSS + CSS custom properties (design tokens) |
| Canvas | HTML5 Canvas API |
| Workers | Web Workers (algoritmo en background thread) |
| i18n | next-intl (ES/EN/PT) |
| PDF | jsPDF *(pendiente de implementar)* |
| Audio TTS | Web Speech API (SpeechSynthesis nativa del browser) |
| Animación | requestAnimationFrame loop sobre canvas |
| Deploy | Integración con Shopify de Hagalo *(pendiente de definir)* |

### NO usamos

- ❌ TailwindCSS — se usa Vanilla CSS con design tokens
- ❌ Google Cloud TTS — usamos Web Speech API nativa, es suficiente para nuestro caso de uso
- ❌ MediaRecorder API — la animación es canvas puro, sin grabación de video
- ❌ Base de datos — no hay persistencia de proyectos ni usuarios (solo localStorage)
- ❌ Server-side rendering del algoritmo — corre 100% en el browser del usuario
- ❌ react-easy-crop — el crop se implementa manualmente con canvas

---

## 3. Arquitectura

```
┌──────────────────────────────────────────────────────┐
│                  Browser (Client)                     │
│                                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐ │
│  │ Image Editor │→│  Algorithm   │→│    Output     │ │
│  │ (upload,     │  │ (Web Worker) │  │  Generator   │ │
│  │  crop, adj)  │  │              │  │ (anim/pdf)   │ │
│  └─────────────┘  └─────────────┘  └──────────────┘ │
│  ┌────────────────────────────────────────────────┐  │
│  │              Core / Shared                      │  │
│  │     KitSpec, Types, Utils, i18n config          │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

La aplicación es **100% client-side**. No hay backend, no hay API routes activas.
Las fotos NUNCA salen del browser del usuario. El audio se genera con la Web Speech
API nativa del navegador.

---

## 4. Estructura de carpetas

```
string_art_system/
├── src/
│   ├── app/
│   │   ├── [locale]/                    # Routing i18n (es/en/pt)
│   │   │   ├── layout.tsx               # Layout principal con i18n provider
│   │   │   ├── page.tsx                 # Landing page (placeholder)
│   │   │   ├── editor/
│   │   │   │   └── page.tsx             # Wrapper → EditorPage component
│   │   │   ├── guide/
│   │   │   │   └── page.tsx             # Wrapper → GuidePage component
│   │   │   └── sandbox/
│   │   │       └── page.tsx             # Página de pruebas/experimentación
│   │   └── globals.css                  # Reset + estilos base
│   ├── components/
│   │   ├── editor/                      # Pantalla principal del generador
│   │   │   ├── EditorPage.tsx           # Orquestador: upload → ajustes → generación
│   │   │   ├── CanvasRenderer.tsx       # Renderiza resultado en canvas (animación)
│   │   │   ├── ImageAdjuster.tsx        # Sliders de brillo, contraste, etc.
│   │   │   ├── ConfigPanel.tsx          # Config del algoritmo (líneas, pines)
│   │   │   ├── ImageUploader.tsx        # Botón de upload de imagen
│   │   │   └── editor.module.css        # Estilos del editor
│   │   └── guide/                       # Modo guiado paso a paso (mobile-first)
│   │       ├── GuidePage.tsx            # UI completa del modo guiado
│   │       └── guide.module.css         # Estilos del modo guiado
│   ├── core/
│   │   └── algorithm/                   # Lógica core del string art
│   │       ├── bresenham.ts             # Pines, líneas Bresenham, cache
│   │       ├── greedy.ts                # Algoritmo greedy (corazón del sistema)
│   │       ├── types.ts                 # Tipos compartidos (params, worker msgs, session)
│   │       └── __tests__/               # Tests unitarios del algoritmo
│   │           ├── bresenham.test.ts
│   │           └── greedy.test.ts
│   ├── hooks/                           # Custom hooks de React
│   │   ├── useStringArtWorker.ts        # Ciclo de vida del Web Worker
│   │   ├── useGuidedSession.ts          # Persistencia de sesión (localStorage)
│   │   ├── usePinSpeech.ts             # Web Speech API (voz de pines)
│   │   └── useWakeLock.ts              # Screen Wake Lock API
│   ├── utils/                           # Utilidades de procesamiento
│   │   ├── imageProcessor.ts            # Pipeline: crop → ajustes → grayscale circular
│   │   └── imageAdjustments.ts          # Funciones puras de ajuste tonal + sharpen
│   ├── workers/
│   │   └── stringArt.worker.ts          # Web Worker del algoritmo
│   ├── styles/
│   │   └── design-tokens.css            # Variables CSS (colores, spacing, fuentes)
│   ├── i18n.ts                          # Config de next-intl
│   └── middleware.ts                    # Middleware de i18n routing
├── messages/                            # Archivos de traducción (next-intl)
│   ├── es.json                          # Español (idioma principal)
│   ├── en.json                          # Inglés
│   └── pt.json                          # Portugués
├── agents.md                            # Este archivo
├── package.json
├── tsconfig.json
├── next.config.mjs
└── jest.config.js
```

### Reglas de dependencia

```
components/editor   → core/algorithm ✅, hooks ✅, utils ✅
components/guide    → core/algorithm ✅ (solo bresenham para pines), hooks ✅
hooks               → core/algorithm/types ✅ (solo tipos)
utils               → (independiente)
core/algorithm      → (independiente)
workers             → core/algorithm ✅

editor ↔ guide ❌ (no se importan entre sí)
```

Las pantallas (editor, guide) se comunican a través del **estado persistido en
localStorage** (`useGuidedSession`). No hay imports cruzados entre ellas.

---

## 5. Kit Hagalo — Especificación de referencia

```typescript
// Valores de referencia del kit Hagalo.
// Los pines son configurables por el usuario (default 240).
// Los demás valores son constantes del kit físico.
const HAGALO_KIT = {
  boardDiameter: 500,        // mm (50 cm)
  defaultPins: 240,          // cantidad de pines por defecto
  minPins: 150,              // mínimo configurable
  maxPins: 300,              // máximo configurable
  stringLength: 4000,        // metros de hilo incluidos en el kit
  stringType: 'sewing',      // hilo de costura estándar, negro, 4000m
  stringThickness: 0.12,     // mm — hilo de costura real (~0.12mm)
  boardShape: 'circle',      // forma del tablero — solo circular
};
```

> **NOTA:** Actualmente estos valores están hardcodeados en `EditorPage.tsx` como
> `DEFAULT_PARAMS`. Pendiente: extraerlos a un archivo `core/kit-spec.ts` centralizado.

### Pines configurables

El kit estándar incluye 240 pines, pero el sistema permite configurar la cantidad
(slider de 150 a 300, step 10) para soportar tableros custom con más o menos pines.
El default siempre es 240.

### Tipo de hilo

El kit incluye hilo de costura negro estándar (poliéster) de **4000 metros**.
El grosor real del hilo es ~0.12mm. Esto es CRÍTICO para:
- **Canvas rendering**: las líneas deben ser ultra-finas con baja opacidad. La imagen se construye por ACUMULACIÓN de miles de hilos semi-transparentes, no por líneas gruesas individuales.
- **Cálculo de iteraciones máximas**: el sistema debe calcular cuántas líneas permite el largo del hilo y NO ofrecer más iteraciones de las físicamente posibles.

### Distribución de pines

Los pines se distribuyen **uniformemente en un círculo**:
- Ángulo entre pines: `360° / totalPins`
- Pin 0 está en la posición **"3 en punto"** (estándar de mercado, 0 radianes)
- Numeración en sentido horario: 0, 1, 2, ..., (totalPins - 1)
- La posición de cada pin se calcula como:
  ```
  x = center + radius * cos(pin_index * 2π / totalPins)
  y = center + radius * sin(pin_index * 2π / totalPins)
  ```

---

## 6. El Algoritmo — Leer antes de tocar

El algoritmo implementa **Continuous Line String Art** (Petros Vrellis, 2013).
Es el corazón del sistema y la pieza de mayor complejidad técnica.

### Flujo del algoritmo

```
1. Input: Float32Array (escala de grises invertida, 0=blanco, 255=negro)
   ↓
2. Pre-cómputo: para cada par (i,j) de pines, calcular los píxeles
   que la línea i→j atraviesa (algoritmo de Bresenham)
   Cache inteligente: solo guarda líneas >150 píxeles para ahorrar RAM
   ↓
3. Loop greedy:
   current_pin = 0
   sequence = [current_pin]

   REPETIR hasta criterio de parada:
     best_score = -Infinity
     best_next = -1

     PARA CADA pin j ≠ current_pin (y j ≠ pin anterior, evitar reversa):
       SI distancia(current_pin, j) < MIN_PIN_DISTANCE: saltar

       score = 0
       PARA CADA píxel p en línea(current_pin, j):
         SI errorMap[p] > 0:
           score += min(errorMap[p], LINE_WEIGHT)    // recompensa
         SINO:
           score -= abs(errorMap[p]) * PENALTY_MULT  // castigo por overshoot

       normalizedScore = score / longitud_de_línea

       SI normalizedScore > best_score:
         best_score = normalizedScore
         best_next = j

     // "Dibujar" la línea: restar peso del canvas de trabajo
     PARA CADA píxel p en línea(current_pin, best_next):
       errorMap[p] -= LINE_WEIGHT

     current_pin = best_next
     sequence.push(current_pin)
   ↓
4. Output: Uint16Array — secuencia ordenada de índices de pines
   Ejemplo: [0, 147, 83, 201, 45, ...]
```

### Criterios de parada

El algoritmo se detiene cuando se cumple **cualquiera** de:
1. Se alcanza el máximo de iteraciones (configurable por el usuario via slider)
2. No se encuentra ninguna línea válida (todos los candidatos descartados)

### Cálculo de metros de cuerda consumidos

```
distancia_entre_pines(i, j) = 2 * radius * sin(|i - j| * π / totalPins)
metros_usados = Σ distancia_entre_pines(sequence[n], sequence[n+1]) para todo n
```

### Parámetros que el usuario puede ajustar

| Parámetro | UI Control | Rango | Default |
|---|---|---|---|
| Cantidad de hilos | Slider "Lines" | 1000 – 5000 | 3000 |
| Cantidad de pines | Slider "Pins" | 150 – 300 | 240 |

### Parámetros internos (NO expuestos al usuario)

| Parámetro | Valor | Nota |
|---|---|---|
| LINE_WEIGHT | 25 | Cuánto "oscurece" cada hilo (de 255). Ajustar con pruebas |
| PENALTY_MULTIPLIER | 2.0 | Castiga sobreoscurecimiento de zonas claras |
| MIN_PIN_DISTANCE | 20 | Mínimo de pines de separación para evitar líneas cortas |
| CANVAS_SIZE | 500 | Píxeles — resolución interna del algoritmo |

### Web Worker

El algoritmo corre en un Web Worker para no bloquear el hilo principal de la UI.
La comunicación es via `postMessage`:

```typescript
// Mensajes Worker ← Main
type WorkerMessage =
  | { type: 'start'; imageData: Float32Array; params: AlgorithmParams }
  | { type: 'stop' };

// Mensajes Worker → Main
type WorkerResponse =
  | { type: 'progress'; iteration: number; totalIterations: number; score: number }
  | { type: 'complete'; sequence: Uint16Array; totalMeters: number; timeMs: number }
  | { type: 'error'; message: string };
```

El Worker envía `progress` cada 100 iteraciones para actualizar la UI.

---

## 7. Animación Canvas — Comportamiento

La animación simula el proceso de crear el string art:

1. **Estado inicial:** canvas con fondo blanco circular
2. **Animación progresiva:** dibuja 50 líneas por `requestAnimationFrame`
3. **Propiedades de la línea:**
   - `strokeStyle`: `rgba(10, 10, 10, 0.15)` — opacidad baja, acumulación genera densidad
   - `lineWidth`: 1px
4. **La animación NO usa `clearRect`** entre frames — cada línea se suma sobre
   las anteriores, acumulando opacidad como el hilo real
5. **Preview de imagen:** cuando no hay secuencia, muestra la imagen procesada
   (grayscale circular) a opacidad completa para que el usuario vea los ajustes

---

## 8. Audio Guide — Implementación

### Web Speech API

El sistema usa la **Web Speech API nativa** (`SpeechSynthesis`) del navegador para
indicar al usuario el número del pin siguiente. No requiere API key ni servidor.

```
Usuario avanza al siguiente paso
  → usePinSpeech hook recibe el número de pin
  → Cancela cualquier audio en curso
  → Crea SpeechSynthesisUtterance con el texto localizado
  → Selecciona voz según locale (es-ES, en-US, pt-BR)
  → Reproduce
```

### Formato del texto

```
// Español: "Pin 234"
// Inglés: "Pin 234"
// Portugués: "Pino 234"
```

### Persistencia

La preferencia on/off del audio se guarda en `localStorage('hacelo-art-speech-enabled')`.

### Limitaciones conocidas

- La calidad de las voces depende del sistema operativo del usuario
- En algunos dispositivos Android puede haber un leve delay
- Si el browser no soporta `SpeechSynthesis`, el audio se desactiva silenciosamente

---

## 9. Internacionalización (i18n)

### Configuración: next-intl

- Idioma default: `es` (español)
- Idiomas soportados: `['es', 'en', 'pt']`
- Routing: `/es/editor`, `/en/editor`, `/pt/editor`
- Detección automática por `Accept-Language` header del browser
- **El selector de idioma debe estar accesible en TODAS las vistas**

### Archivos de traducción

Ubicados en `messages/{locale}.json` (raíz del proyecto, requerido por next-intl).
Estructura con namespaces:

```json
{
  "Index": {
    "title": "Generador String Art",
    "description": "Crea arte asombroso a partir de tus fotos."
  },
  "Guide": {
    "title": "Modo Guiado",
    "step": "Paso {current} de {total}",
    "fromPin": "desde pin",
    "toPin": "ir al pin",
    "prev": "Anterior",
    "next": "Siguiente"
  }
}
```

### Regla crítica

**Toda cadena visible al usuario DEBE estar en los archivos de traducción.**
Nunca hardcodear texto en español o inglés directamente en componentes.

> **DEUDA TÉCNICA:** Actualmente hay texto hardcodeado en varios componentes
> (ImageUploader, ConfigPanel, EditorPage, ImageAdjuster). Pendiente de migrar
> a archivos de traducción.

---

## 10. Design System

### Tokens CSS (styles/design-tokens.css)

```css
:root {
  --color-primary: #111111;
  --color-secondary: #f0f0f0;
  --color-accent: #d4af37;

  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 32px;

  --font-primary: 'Inter', sans-serif;
}
```

> **NOTA:** Los tokens actuales son mínimos. El diseño visual final se definirá
> cuando se integre con la web de Hagalo (Shopify). La paleta, tipografía y
> componentes se adaptarán al branding del cliente.

### Reglas de estilo

- **Dark mode es el único modo** — no implementar light mode
- Usar siempre tokens CSS, nunca valores hardcodeados (ej: `color: var(--color-accent)`, no `color: #d4af37`)
- Mobile-first: escribir estilos base para mobile, media queries para desktop
- Breakpoints: `768px` (tablet), `1024px` (desktop)
- Animaciones: usar `prefers-reduced-motion` para respetar accesibilidad

> **DEUDA TÉCNICA:** Los archivos `.module.css` actuales usan colores hardcodeados
> en vez de variables CSS. Pendiente de migrar a tokens.

---

## 11. API Routes

Actualmente **no hay API routes activas**. El sistema es 100% client-side.

### Pendientes (cuando sea necesario):

- `/api/auth/validate` — validación de código de kit *(diferido hasta que el cliente defina)*
- `/api/auth/me` — verificación de sesión *(diferido)*

---

## 12. Variables de entorno

```env
# Auth JWT (requerido cuando se implemente auth — diferido)
JWT_SECRET=

# Vercel-specific (automáticas)
VERCEL_URL=
```

Actualmente no se requieren variables de entorno para el funcionamiento básico.

---

## 13. Convenciones de código

### TypeScript
- `strict: true` en tsconfig — sin excepciones
- Preferir `type` sobre `interface` excepto para contratos de API
- Nunca usar `any` — si es necesario, usar `unknown` y narrowing
- Funciones puras siempre que sea posible en el módulo del algoritmo
- Exports explícitos — usar named exports

> **Excepción Next.js:** Los archivos `page.tsx` y `layout.tsx` del App Router
> **requieren** `export default`. Esta es una limitación del framework, no una
> violación de la convención. Solo en esos archivos está permitido.

### CSS
- Una hoja de estilos `.module.css` por componente (colocación: junto al componente)
- Naming: clases descriptivas en camelCase (CSS Modules)
- Variables CSS: siempre desde `design-tokens.css`, nunca valores mágicos
- Media queries: mobile-first (`min-width`)

### Componentes React
- Functional components siempre, nunca class components
- Hooks custom en carpeta `hooks/`
- Props tipadas con `type ComponentProps = { ... }`
- Separar lógica de presentación: hooks para lógica, componentes para render

### Archivos
- Nombres en `kebab-case` para archivos de utilidades y módulos
- Componentes React en `PascalCase` (ej: `EditorPage.tsx`, `CanvasRenderer.tsx`)
- Tests junto al código: `__tests__/` dentro del módulo correspondiente

### Comentarios
- Los comentarios en el código deben estar en **español** para que el equipo
  pueda entender la lógica sin barreras de idioma.

---

## 14. Lo que NO hacer

- ❌ No usar TailwindCSS — el proyecto usa Vanilla CSS con design tokens
- ❌ No implementar el módulo Auth hasta que el cliente final defina el mecanismo
- ❌ No hardcodear texto visible al usuario — todo debe estar en archivos de i18n
- ❌ No enviar fotos del usuario a ningún servidor — procesamiento 100% local
- ❌ No usar `any` en TypeScript
- ❌ No importar entre `editor/` y `guide/` directamente — comunicación via localStorage
- ❌ No implementar light mode — el sistema es dark mode only
- ❌ No usar MediaRecorder — la animación es canvas puro, no se graba video
- ❌ No modificar el algoritmo sin tests que verifiquen que el output sigue siendo válido

---

## 15. Contexto del negocio

- El kit se vende en Argentina por ~$83.725 ARS (~$70 USD)
- El comprador recibe: tablero 50cm, 3000m de cuerda, 240 alfileres, etiquetas numéricas
- El software es un **valor agregado del kit físico**, no se vende por separado
- **El sistema se integrará en la web de Hagalo** (Shopify). Modalidad pendiente de definir
  con el cliente (subdominio, iframe, etc.)
- Los usuarios NO son técnicos — la UX debe ser extremadamente simple
- El caso de uso típico: persona con celular en mano, trabajando en el tablero, necesita
  saber "¿cuál es el próximo pin?" → la interfaz del modo guiado es crítica
- Tres mercados objetivo: Argentina (ES), Brasil (PT), internacional (EN)
- Competidores: farostringart.com (actual, sin audio ni PDF), stringar.com (open-source, sin audio)
- Los diferenciadores clave son: audio guía, animación hilo por hilo, PDF, mobile-first, branding propio

---

## 16. Persistencia del Progreso (Resiliencia)

Armar el cuadro lleva varios días (típicamente entre 2 y 5 días). Por ende, es MANDATORIO que el usuario pueda cerrar el navegador y continuar exactamente donde dejó.

### Implementación actual (useGuidedSession):
- **Storage key**: `hacelo-art-session` en localStorage
- **Datos almacenados**:
  - `sequence`: el array completo de pines generado (`number[]`)
  - `currentStep`: el índice actual dentro de esa secuencia (`number`)
  - `totalSteps`: total de pasos (sequence.length - 1)
  - `config`: parámetros con los que se generó (totalPins, maxIterations)
  - `createdAt` / `updatedAt`: timestamps ISO
- **Autosave**: Cada vez que el usuario avanza de pin, se persiste automáticamente
- **Carga de Estado**: Al ingresar al editor, si existe una sesión activa:
  - Se muestra un banner con botón "Continuar" que lleva al modo guiado
  - Si sube nueva imagen, se le pide confirmación antes de borrar el progreso
  - Puede cancelar la sesión manualmente desde el banner

---

## 17. Requisitos UX Mobile-First

- 100% funcional con una sola mano en pantalla táctil
- Touch swipe para navegación (izquierda = siguiente, derecha = anterior)
- Números de pin lo más grandes posible (clamp de 4.5rem a 6.5rem)
- Wake Lock activado automáticamente en el modo guiado para evitar que la pantalla se apague
- Botón "Siguiente" más prominente que "Anterior" (flex 3 vs flex 2)
- Sin scroll innecesario — todo cabe en la pantalla del modo guiado

---

## 18. Pendientes de implementación

| Feature | Prioridad | Nota |
|---|---|---|
| PDF con grilla de números | Alta | Para que el usuario pueda descargar e imprimir la secuencia |
| i18n completo | Alta | Extraer texto hardcodeado, completar traducciones |
| Renaming a kebab-case | Media | Alinear archivos de utils con la convención |
| Centralizar kit-spec.ts | Media | Extraer constantes de EditorPage a archivo dedicado |
| Migrar CSS a tokens | Media | Reemplazar colores hardcodeados por variables |
| Comentarios en español | Media | Todos los comentarios del código en español |
| Integración Shopify | Pendiente | Definir con el cliente: subdominio, iframe, etc. |
| Branding visual | Pendiente | Adaptar diseño al look & feel de Hagalo |
