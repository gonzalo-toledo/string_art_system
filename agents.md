# agents.md — HáceloArt: Generador de String Art

Este archivo le da contexto crítico a cualquier agente de IA (Cursor, Claude, Copilot, etc.)
que trabaje en este proyecto. **Leelo completo antes de generar o modificar cualquier código.**

---

## 1. Qué es este proyecto

Aplicación web **mobile-first** que genera patrones de **String Art** a partir de fotografías.
El sistema calcula la secuencia óptima de hilos entre 240 pines distribuidos en un tablero
circular de 50cm, y produce tres outputs: animación visual, PDF instructivo y audio guía.

El cliente es **Hagalo** (hagalo.com.ar), una empresa argentina que vende kits físicos de
String Art. Este software reemplaza la dependencia actual de farostringart.com con un sistema
propio, branded y con funcionalidades superiores.

**Los usuarios finales son compradores del kit** que usan el celular mientras arman el cuadro.
La interfaz debe ser 100% funcional con una sola mano en pantalla táctil.

---

## 2. Stack tecnológico

| Capa | Tecnología |
|---|---|
| Framework | Next.js 14 (App Router) |
| Lenguaje | TypeScript (strict mode) |
| Estilos | Vanilla CSS + CSS custom properties (design tokens) |
| Canvas | HTML5 Canvas API + OffscreenCanvas |
| Workers | Web Workers (algoritmo en background thread) |
| i18n | next-intl (ES/EN/PT) |
| PDF | jsPDF |
| Audio TTS | Google Cloud TTS Neural2 (via API route proxy) |
| Animación | requestAnimationFrame loop sobre canvas |
| Editor de imagen | react-easy-crop (crop circular) |
| Auth | Cookie JWT firmada (jose library) — **diferido** |
| Deploy | Vercel (serverless functions incluidas) |

### NO usamos

- ❌ TailwindCSS — se usa Vanilla CSS con design tokens
- ❌ MediaRecorder API — la animación es canvas puro, sin grabación de video
- ❌ Web Speech API — usamos Google Cloud TTS para voces naturales (Web Speech solo como fallback)
- ❌ Base de datos — no hay persistencia de proyectos ni usuarios
- ❌ Server-side rendering del algoritmo — corre 100% en el browser del usuario

---

## 3. Arquitectura

```
┌──────────────────────────────────────────────────────┐
│                  Browser (Client)                     │
│                                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐ │
│  │ Image Editor │→│  Algorithm   │→│    Output     │ │
│  │ (upload,     │  │ (Web Worker) │  │  Generator   │ │
│  │  crop, adj)  │  │              │  │ (anim/pdf/   │ │
│  └─────────────┘  └─────────────┘  │  audio)       │ │
│                                     └──────────────┘ │
│  ┌────────────────────────────────────────────────┐  │
│  │              Core / Shared                      │  │
│  │     KitSpec, Types, Utils, i18n config          │  │
│  └────────────────────────────────────────────────┘  │
└────────────────────┬─────────────────────────────────┘
                     │ HTTPS (solo auth + TTS)
┌────────────────────▼─────────────────────────────────┐
│            Backend mínimo (Next.js API Routes)        │
│   /api/auth/validate — valida código de kit           │
│   /api/auth/me       — verifica sesión activa         │
│   /api/tts           — proxy a Google Cloud TTS       │
└──────────────────────────────────────────────────────┘
```

El backend es **solo un proxy ligero**. No hay base de datos. No hay almacenamiento de
archivos. Las fotos NUNCA salen del browser del usuario.

---

## 4. Estructura de carpetas

```
string_art_system/
├── app/
│   ├── [locale]/                    # Routing i18n (es/en/pt)
│   │   ├── layout.tsx               # Layout principal con i18n provider
│   │   ├── page.tsx                 # Landing page
│   │   └── generator/
│   │       └── page.tsx             # App principal del generador
│   └── api/
│       ├── auth/
│       │   ├── validate/route.ts    # POST — valida código, emite JWT cookie
│       │   └── me/route.ts          # GET — verifica sesión activa
│       └── tts/
│           └── route.ts             # POST — proxy a Google Cloud TTS
├── modules/
│   ├── image-editor/
│   │   ├── components/              # FileDropzone, ImageEditor, CropControls
│   │   ├── hooks/                   # useImageUpload, useImageEditor
│   │   ├── utils/                   # grayscale, normalize, gaussian-blur
│   │   └── types.ts
│   ├── string-art-algorithm/
│   │   ├── worker.ts                # Web Worker entry point
│   │   ├── algorithm.ts             # Lógica core: greedy line selection
│   │   ├── pin-layout.ts            # Distribución circular de 240 pines
│   │   ├── line-cache.ts            # Pre-cómputo de píxeles por línea (Bresenham)
│   │   └── types.ts
│   ├── output-generator/
│   │   ├── animation/               # Canvas animation controller, playback controls
│   │   ├── pdf/                     # jsPDF template, pin diagram, sequence pages
│   │   ├── audio/                   # TTS client, audio block manager, playback
│   │   └── types.ts
│   ├── i18n/
│   │   ├── locales/
│   │   │   ├── es.json              # Español (idioma principal)
│   │   │   ├── en.json              # Inglés
│   │   │   └── pt.json              # Portugués
│   │   └── config.ts                # next-intl configuration
│   └── auth/                        # ⚠️ DIFERIDO — no implementar hasta que el cliente defina
│       └── (vacío)
├── core/
│   ├── kit-spec.ts                  # Constantes inmutables del kit Hagalo
│   ├── types.ts                     # Tipos globales compartidos
│   └── utils/
│       ├── math.ts                  # Funciones matemáticas (distancia, ángulo, etc.)
│       └── canvas.ts                # Helpers de canvas compartidos
├── components/
│   ├── ui/                          # Design system: Button, Card, Slider, ProgressRing
│   └── layout/                      # Header, Footer, PageContainer, LanguageSwitch
├── styles/
│   ├── globals.css                  # Reset + estilos base
│   ├── tokens.css                   # Design tokens (colores, spacing, tipografía)
│   └── animations.css               # Keyframes y transiciones reutilizables
└── public/
    ├── fonts/                       # Outfit + Inter (self-hosted)
    └── images/
        └── hagalo-logo.svg          # Placeholder hasta que el cliente provea el logo
```

### Reglas de dependencia entre módulos

```
image-editor    → core ✅
algorithm       → core ✅
output-generator → core ✅, algorithm/types ✅ (solo tipos, no lógica)
i18n            → (independiente)
auth            → core ✅

image-editor    → algorithm ❌ (no importar directamente — comunicación via page component)
algorithm       → output-generator ❌
output-generator → image-editor ❌
```

Los módulos se comunican a través del **page component** (`generator/page.tsx`),
que orquesta el flujo: imagen → algoritmo → outputs. Nunca imports cruzados entre módulos.

---

## 5. Kit Hagalo — Especificación inmutable

```typescript
// core/kit-spec.ts — NUNCA modificar estos valores sin consultar al cliente
export const HAGALO_KIT = {
  boardDiameter: 500,        // mm (50 cm)
  totalPins: 240,            // cantidad de pines — FIJO, no configurable por el usuario
  stringLength: 3000,        // metros de cuerda incluidos en el kit
  stringThickness: 0.5,      // mm — para cálculo de escala visual en canvas
  boardShape: 'circle',      // forma del tablero — solo circular
} as const;

export type HagaloKit = typeof HAGALO_KIT;
```

### Distribución de pines

Los 240 pines se distribuyen **uniformemente en un círculo**:
- Ángulo entre pines: `360° / 240 = 1.5°`
- Pin 0 está en la posición "12 en punto" (top center)
- Numeración en sentido horario: 0, 1, 2, ..., 239
- La posición de cada pin se calcula como:
  ```
  x = center + radius * cos(pin_index * 2π / 240 - π/2)
  y = center + radius * sin(pin_index * 2π / 240 - π/2)
  ```

---

## 6. El Algoritmo — Leer antes de tocar

El algoritmo implementa **Continuous Line String Art** (Petros Vrellis, 2013).
Es el corazón del sistema y la pieza de mayor complejidad técnica.

### Flujo del algoritmo

```
1. Input: ImageData (escala de grises, normalizada 0-255)
   ↓
2. Pre-cómputo: para cada par (i,j) de pines, calcular los píxeles
   que la línea i→j atraviesa (algoritmo de Bresenham)
   Cache: ~28.800 líneas × ~500 píxeles promedio por línea
   ↓
3. Loop greedy:
   current_pin = 0 (o aleatorio)
   sequence = [current_pin]

   REPETIR hasta criterio de parada:
     best_score = -Infinity
     best_next = -1

     PARA CADA pin j ≠ current_pin (y j ≠ pin anterior, evitar reversa):
       score = Σ pixel_value(p) para cada píxel p en línea(current_pin, j)
       SI score > best_score:
         best_score = score
         best_next = j

     // "Dibujar" la línea: restar oscuridad del canvas de trabajo
     PARA CADA píxel p en línea(current_pin, best_next):
       pixel_value(p) -= LINE_DARKNESS  // típicamente 30-50 de 255

     current_pin = best_next
     sequence.push(current_pin)
   ↓
4. Output: number[] — secuencia ordenada de índices de pines
   Ejemplo: [0, 147, 83, 201, 45, ...]
```

### Criterios de parada

El algoritmo se detiene cuando se cumple **cualquiera** de:
1. Se alcanza el máximo de iteraciones (configurable por el usuario via slider)
2. El score de la mejor línea cae por debajo de un threshold mínimo
3. Se estima que se agotó la cuerda disponible (3000m)

### Cálculo de metros de cuerda consumidos

```
distancia_entre_pines(i, j) = 2 * radius * sin(|i - j| * π / totalPins)
metros_usados = Σ distancia_entre_pines(sequence[n], sequence[n+1]) para todo n
```

### Parámetros que el usuario puede ajustar

| Parámetro | UI Control | Rango | Default |
|---|---|---|---|
| Cantidad de hilos | Slider "Detalle" | 500 – 4000 | Calculado automáticamente |
| Contraste de entrada | Slider "Contraste" | 0.5 – 2.0 | 1.0 |

### Parámetros internos (NO expuestos al usuario)

| Parámetro | Valor | Nota |
|---|---|---|
| LINE_DARKNESS | 30 | Cuánto "oscurece" cada hilo (de 255). Ajustar con pruebas |
| MIN_PIN_DISTANCE | 20 | Mínimo de pines de separación para evitar líneas cortas |
| CANVAS_SIZE | 500 | Píxeles — resolución interna del algoritmo |

### Web Worker

El algoritmo corre en un Web Worker para no bloquear el hilo principal.
La comunicación es via `postMessage`:

```typescript
// Mensajes Worker ← Main
type WorkerInput = {
  type: 'start';
  imageData: ImageData;     // escala de grises
  maxIterations: number;
  contrastMultiplier: number;
};

// Mensajes Worker → Main
type WorkerOutput =
  | { type: 'progress'; current: number; total: number; preview?: ImageData }
  | { type: 'complete'; sequence: number[]; totalMeters: number }
  | { type: 'error'; message: string };
```

El Worker envía `progress` cada ~50 iteraciones para actualizar la UI.

---

## 7. Animación Canvas — Comportamiento exacto

La animación simula el proceso físico real de crear el string art:

1. **Estado inicial:** canvas con fondo color madera claro (`hsl(30, 30%, 85%)`)
   y los 240 pines dibujados como círculos pequeños (3px) en gris oscuro
2. **Cada "frame" de animación:** dibuja una línea del pin A al pin B usando
   `ctx.beginPath()` + `ctx.moveTo()` + `ctx.lineTo()` + `ctx.stroke()`
3. **Propiedades de la línea:**
   - `strokeStyle`: negro con alpha bajo (`rgba(0, 0, 0, 0.15)`) — la opacidad
     acumulativa genera el efecto de densidad real del hilo
   - `lineWidth`: 0.5-1px (a escala visual)
4. **La animación NO usa `clearRect`** entre frames — cada línea se suma sobre
   las anteriores, acumulando opacidad como el hilo real
5. **Velocidad controlada por N líneas por requestAnimationFrame:**
   - ×1: 1 línea por frame (~60 líneas/segundo)
   - ×5: 5 líneas por frame
   - ×20: 20 líneas por frame
   - ×100: 100 líneas por frame (fast-forward)
6. **Scrubbing:** Para saltar a un punto, re-dibujar todas las líneas
   desde 0 hasta ese punto (sin animación)

---

## 8. Audio Guide — Implementación

### Arquitectura del audio

```
Usuario presiona "Siguiente"
  → Verificar si el audio del bloque actual está en cache
  → SI: reproducir desde cache
  → NO: POST /api/tts con texto del bloque
        → API route hace request a Google Cloud TTS
        → Devuelve audio/mpeg (MP3)
        → Guardar en cache (Map<string, ArrayBuffer>)
        → Reproducir
```

### Formato del texto enviado a TTS

```
// Español
"Pin doscientos treinta y cuatro. Pin ochenta y siete. Pin ciento cuarenta y dos."

// Inglés
"Pin two hundred thirty four. Pin eighty seven. Pin one hundred forty two."

// Portugués
"Pino duzentos e trinta e quatro. Pino oitenta e sete. Pino cento e quarenta e dois."
```

Los números se convierten a **palabras escritas** (no dígitos) para que TTS los pronuncie
correctamente. La conversión se implementa en `modules/output-generator/audio/number-to-words.ts`
con funciones separadas por idioma.

### Bloques de audio

Los pines se agrupan en bloques de **10 pines** para reducir las llamadas a la API.
Mientras se reproduce el bloque N, se pre-carga el bloque N+1 en background.

### Fallback

Si Google TTS no está disponible (API key faltante, error de red, etc.):
1. Intentar Web Speech API nativa del browser
2. Si tampoco funciona: modo texto-only con números grandes en pantalla

---

## 9. Internacionalización (i18n)

### Configuración: next-intl

- Idioma default: `es` (español)
- Idiomas soportados: `['es', 'en', 'pt']`
- Routing: `/es/generator`, `/en/generator`, `/pt/generator`
- Detección automática por `Accept-Language` header del browser
- Persistencia: `localStorage('hacelo-art-locale')`

### Archivos de traducción

Ubicados en `modules/i18n/locales/{locale}.json`. Estructura flat con namespaces separados
por punto:

```json
{
  "landing.title": "Creá tu cuadro de hilos",
  "landing.subtitle": "Subí una foto y transformala en arte",
  "editor.upload": "Subí tu foto",
  "editor.crop": "Recortar",
  "editor.brightness": "Brillo",
  "editor.contrast": "Contraste",
  "editor.generate": "Generar String Art",
  "result.animation": "Ver animación",
  "result.pdf": "Descargar PDF",
  "result.audio": "Guía de audio",
  "guide.pin": "Pin",
  "guide.step": "Paso {current} de {total}",
  "guide.next": "Siguiente",
  "guide.prev": "Anterior"
}
```

### Regla crítica

**Toda cadena visible al usuario DEBE estar en los archivos de traducción.**
Nunca hardcodear texto en español directamente en componentes.

---

## 10. Design System

### Tokens CSS (styles/tokens.css)

```css
:root {
  /* Colores */
  --color-primary: hsl(270, 85%, 60%);
  --color-primary-dark: hsl(270, 85%, 45%);
  --color-primary-light: hsl(270, 85%, 75%);
  --color-accent: hsl(40, 100%, 60%);
  --color-accent-dark: hsl(40, 100%, 45%);

  /* Superficies — dark mode by default */
  --color-bg: hsl(220, 20%, 8%);
  --color-surface: hsl(220, 15%, 13%);
  --color-surface-elevated: hsl(220, 15%, 18%);
  --color-surface-hover: hsl(220, 15%, 22%);
  --color-border: hsl(220, 15%, 25%);

  /* Texto */
  --color-text: hsl(220, 10%, 95%);
  --color-text-muted: hsl(220, 10%, 65%);
  --color-text-subtle: hsl(220, 10%, 45%);

  /* Tipografía */
  --font-heading: 'Outfit', sans-serif;
  --font-body: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* Spacing (escala de 4px) */
  --space-1: 0.25rem;  /* 4px */
  --space-2: 0.5rem;   /* 8px */
  --space-3: 0.75rem;  /* 12px */
  --space-4: 1rem;     /* 16px */
  --space-6: 1.5rem;   /* 24px */
  --space-8: 2rem;     /* 32px */
  --space-12: 3rem;    /* 48px */
  --space-16: 4rem;    /* 64px */

  /* Radii */
  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 20px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px hsl(0 0% 0% / 0.3);
  --shadow-md: 0 4px 12px hsl(0 0% 0% / 0.4);
  --shadow-lg: 0 8px 24px hsl(0 0% 0% / 0.5);

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 250ms ease;
  --transition-slow: 400ms ease;

  /* Z-index scale */
  --z-base: 0;
  --z-dropdown: 100;
  --z-modal: 200;
  --z-toast: 300;
}
```

### Reglas de estilo

- **Dark mode es el único modo** — no implementar light mode
- Usar siempre tokens CSS, nunca valores hardcodeados (ej: `color: var(--color-primary)`, no `color: purple`)
- Mobile-first: escribir estilos base para mobile, media queries para desktop
- Breakpoints: `768px` (tablet), `1024px` (desktop)
- Animaciones: usar `prefers-reduced-motion` para respetar accesibilidad
- Fonts: self-hosted en `/public/fonts/`, no Google Fonts CDN

---

## 11. API Routes — Contratos

### POST /api/tts

Request:
```typescript
{
  text: string;           // Texto a convertir en audio (max 5000 chars)
  locale: 'es' | 'en' | 'pt';
}
```

Response: `audio/mpeg` (binary MP3 stream)

Implementación interna:
- Valida que el texto no exceda 5000 chars
- Selecciona voz según locale:
  - `es` → `es-US-Neural2-A`
  - `en` → `en-US-Neural2-F`
  - `pt` → `pt-BR-Neural2-A`
- Hace POST a Google Cloud TTS API con `GOOGLE_TTS_KEY` (env var)
- Devuelve el audio directamente al cliente

### POST /api/auth/validate *(diferido)*

```typescript
// Request
{ code: string }

// Response (200)
{ valid: true }
// Sets HttpOnly cookie: hacelo-art-session (JWT, 30 days)

// Response (401)
{ valid: false, message: string }
```

### GET /api/auth/me *(diferido)*

```typescript
// Response (200) — cookie válida
{ authenticated: true }

// Response (401) — sin cookie o expirada
{ authenticated: false }
```

---

## 12. Variables de entorno

```env
# Google Cloud TTS (requerido para audio)
GOOGLE_TTS_KEY=

# Auth JWT (requerido cuando se implemente auth)
JWT_SECRET=

# Vercel-specific (automáticas)
VERCEL_URL=
```

Todas las variables se leen desde `process.env` en las API routes.
**Nunca exponer variables en el código del cliente** — solo accesibles server-side.

---

## 13. Convenciones de código

### TypeScript
- `strict: true` en tsconfig — sin excepciones
- Preferir `type` sobre `interface` excepto para contratos de API
- Nunca usar `any` — si es necesario, usar `unknown` y narrowing
- Funciones puras siempre que sea posible en el módulo del algoritmo
- Exports explícitos — no `export default`, usar named exports

### CSS
- Una hoja de estilos `.css` por componente (colocación: junto al componente)
- Naming: BEM simplificado (`.component`, `.component__element`, `.component--modifier`)
- Variables CSS: siempre desde `tokens.css`, nunca valores mágicos
- Media queries: mobile-first (`min-width`)

### Componentes React
- Functional components siempre, nunca class components
- Hooks custom en carpeta `hooks/` del módulo correspondiente
- Props tipadas con `type ComponentProps = { ... }`
- Separar lógica de presentación: hooks para lógica, componentes para render
- Componentes del design system en `components/ui/` — reutilizables y sin lógica de negocio

### Archivos
- Nombres en `kebab-case`: `image-editor.tsx`, `pin-layout.ts`
- Un componente por archivo
- Índices (`index.ts`) solo para re-exportar — nunca lógica en index files
- Tests junto al código: `algorithm.test.ts` al lado de `algorithm.ts`

---

## 14. Lo que NO hacer

- ❌ No usar TailwindCSS — el proyecto usa Vanilla CSS con design tokens
- ❌ No implementar el módulo Auth hasta que el cliente final defina el mecanismo
- ❌ No cambiar los valores en `kit-spec.ts` sin aprobación del cliente
- ❌ No hardcodear texto visible al usuario — todo debe estar en archivos de i18n
- ❌ No enviar fotos del usuario a ningún servidor — procesamiento 100% local
- ❌ No usar `export default` — solo named exports
- ❌ No usar `any` en TypeScript
- ❌ No importar entre módulos directamente — la comunicación es via el page component
- ❌ No usar Google Fonts CDN — fonts self-hosted en `/public/fonts/`
- ❌ No modificar el algoritmo sin tests que verifiquen que el output sigue siendo válido
- ❌ No implementar light mode — el sistema es dark mode only
- ❌ No usar MediaRecorder — la animación es canvas puro, no se graba video
- ❌ No codear sin pasar por SDD (Spec-Driven Development) — todo cambio requiere spec → design → tasks → apply → verify

---

## 15. Contexto del negocio

- El kit se vende en Argentina por ~$83.725 ARS (~$70 USD)
- El comprador recibe: tablero 50cm, 3000m de cuerda, 240 alfileres, etiquetas numéricas
- El software es un **valor agregado del kit físico**, no se vende por separado
- Los usuarios NO son técnicos — la UX debe ser extremadamente simple
- El caso de uso típico: persona con celular en mano, trabajando en el tablero, necesita
  saber "¿cuál es el próximo pin?" → la interfaz del modo guiado es crítica
- Tres mercados objetivo: Argentina (ES), Brasil (PT), internacional (EN)
- Competidores: farostringart.com (actual, sin audio ni PDF), stringar.com (open-source, sin audio)
- Los diferenciadores clave son: audio guía, animación hilo por hilo, PDF, mobile-first, branding propio
