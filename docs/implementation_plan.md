# 🎨 HáceloArt — Generador de String Art
## Plan de Arquitectura y Diseño del Sistema

> **Estado:** ✅ APROBADO — listo para comenzar el desarrollo.

---

## 1. Contexto del Problema

**Hagalo** vende un kit físico de String Art que incluye:
- Tablero perforado de **50 cm**
- **3.000 metros** de cuerda
- **240 alfileres** numerados
- Etiquetas numéricas y herramientas

El cliente actualmente deriva a sus compradores a **farostringart.com**, que no es de su propiedad. El objetivo es tener **su propio sistema** — branded, escalable y con más funcionalidades que la competencia.

### Sistemas de referencia analizados
| Sistema | Fortalezas | Debilidades |
|---|---|---|
| farostringart.com | Simple, funcional | Sin branding propio, sin audio, sin PDF |
| stringar.com | Más completo, open-source base | Sin idioma nativo AR, sin audio, sin video paso a paso |

### Diferenciadores que debemos superar
- ✅ Audio guía (voz lee los números en tiempo real)
- ✅ Video de preview mostrando cómo se va formando la imagen
- ✅ PDF instructivo descargable con toda la secuencia
- ✅ 3 idiomas: Español, Inglés, Portugués
- ✅ Editor de imagen integrado (crop, contraste, brillo, rotación)
- ✅ Calibrado para el kit específico de Hagalo (50cm, 240 pines)
- ✅ Branding propio, experiencia premium

---

## 2. Visión del Producto

Un **generador web mobile-first** para clientes de Hagalo que permite:
1. Subir una foto desde el dispositivo (cámara del celular o galería)
2. Editarla (recortar, ajustar contraste, brillo, zoom)
3. Generar automáticamente la secuencia óptima de hilos con el algoritmo de string art
4. Ver una **animación en canvas** del proceso de construcción hilo por hilo
5. Descargar un **PDF instructivo** con la secuencia completa
6. Escuchar un **audio guía** que lee los números en voz alta mientras se trabaja

> [!IMPORTANT]
> **Mobile-first es CRÍTICO.** La mayoría de los usuarios van a usar el celular mientras arman el cuadro.
> La interfaz del "Modo Guiado" debe estar optimizada para uso táctil con una sola mano,
> con números grandes y botones amplios. El diseño desktop es secundario.

---

## 3. Arquitectura del Sistema

### Decisión tomada: Fullstack mínimo ✅

El sistema requiere un **backend mínimo** por dos razones concretas derivadas de las decisiones del cliente:

1. **Autenticación** — el acceso es exclusivo para clientes que compraron el kit
2. **Google TTS** — la API key no puede exponerse en el frontend

Todo lo demás (algoritmo, PDF, animación) corre en el **browser del usuario**.

```
┌─────────────────────────────────────┐
│           Browser (Client)           │
│  Algoritmo (Web Worker)              │
│  Animación canvas (requestAnimFrame) │
│  PDF (jsPDF)                         │
└────────────────┬────────────────────┘
                 │ HTTPS
┌────────────────▼────────────────────┐
│       Backend mínimo (Next.js API)   │
│  /api/auth  — validar código de kit  │
│  /api/tts   — proxy a Google TTS     │
└─────────────────────────────────────┘
```

> [!NOTE]
> El backend es solo un proxy ligero. No hay base de datos, no hay almacenamiento de proyectos. La sesión de auth se guarda en una cookie firmada (JWT simple).

---

## 4. Stack Tecnológico

### Frontend
```
Framework:    Next.js 14 (App Router)
Estilos:      Vanilla CSS + CSS custom properties (design tokens)
Lenguaje:     TypeScript
Canvas:       HTML5 Canvas API (rendering del string art + animación)
Workers:      Web Workers (algoritmo en background thread)
i18n:         next-intl (ES/EN/PT)
PDF:          jsPDF
Audio:        Google Cloud TTS (via API route proxy)
Animación:    requestAnimationFrame loop sobre canvas (NO MediaRecorder)
Editor:       react-easy-crop (crop circular de imagen)
Auth:         Cookie JWT firmada (jose library)
```

### Backend (Next.js API Routes — serverless)
```
/api/auth/validate   — valida código de kit, emite cookie JWT
/api/auth/me         — verifica sesión activa
/api/tts             — proxy a Google Cloud TTS (oculta API key)
```

### Deploy
```
Hosting:      Vercel (serverless functions incluidas)
Assets:       Vercel Edge Network (CDN)
Dominio:      Por definir — placeholder mientras tanto
Secrets:      Vercel Environment Variables (GOOGLE_TTS_KEY, JWT_SECRET)
```

### Algoritmo (core)
```
Lenguaje:     TypeScript (Web Worker)
Base math:    Continuous Line String Art (Petros Vrellis, 2013)
Canvas ops:   OffscreenCanvas para performance
Pines:        240 fijos, distribución circular uniforme (inmutable)
```

---

## 5. Módulos del Sistema (Bounded Contexts)

El sistema se divide en 5 módulos bien delimitados, siguiendo principios de SDD (Software Design Document):

```
┌─────────────────────────────────────────────────────────┐
│                    HáceloArt Web App                    │
├──────────────┬──────────────┬──────────────┬────────────┤
│   [IMAGE]    │  [ALGORITHM] │   [OUTPUT]   │   [I18N]   │
│   Upload &   │  String Art  │  PDF / Video │  Language  │
│   Editor     │  Calculator  │  / Audio     │  System    │
├──────────────┴──────────────┴──────────────┴────────────┤
│                    [CORE / SHARED]                       │
│           Types, Config, KitSpec, Utils                  │
└─────────────────────────────────────────────────────────┘
```

### Módulo 1: Image Upload & Editor
**Responsabilidad:** Gestión y edición de la imagen fuente
- Drag & drop de imagen
- Preview en tiempo real
- Controles: Brillo, Contraste, Saturación, Zoom, Rotación, Crop circular
- Conversión a escala de grises (para el algoritmo)
- Pre-procesamiento: normalización, suavizado Gaussiano

### Módulo 2: String Art Algorithm (Core)
**Responsabilidad:** El corazón del sistema — calcular la secuencia óptima de hilos

El algoritmo funciona así:
1. **Disposición de pines:** 240 pines distribuidos uniformemente en círculo (50cm de diámetro)
2. **Grafo de líneas:** Precomputar todas las ~28.000 líneas posibles entre pares de pines
3. **Selección greedy:** En cada paso, seleccionar la línea que más "oscurece" los píxeles objetivo de la imagen
4. **Actualización del canvas:** Restar la oscuridad aplicada de la imagen objetivo
5. **Repetición:** Hasta que se agoten los metros de cuerda o se alcance la fidelidad deseada
6. **Output:** Lista ordenada de números de pines (ej: 0 → 47 → 123 → 89 → ...)

**Parámetros configurables por el usuario:**
- Cantidad de pasos/hilos (slider: "rápido" ↔ "detallado", default: optimizado para 3000m)
- Contraste de entrada (pre-procesamiento de la imagen)

**Parámetros fijos del kit Hagalo (no configurables):**
- 240 pines — posición fija en círculo de 50cm
- Sistema de una sola cuerda continua

### Módulo 3: Output Generator
**Responsabilidad:** Generar los 3 formatos de output

#### 3a. Animación del proceso ("Preview")

Simulación visual interactiva del proceso físico real, **hilo por hilo**. No es un video descargable — es una animación en canvas dentro del browser (más liviana y sin dependencias de encoding).

**Comportamiento:**
- El canvas arranca **vacío** — tablero color madera con los 240 pines marcados como puntos
- Cada frame dibuja una **línea desde pin A → pin B** simulando el recorrido del hilo:
  - Grosor proporcional al hilo físico (~0.5mm a escala)
  - Opacidad acumulativa: los hilos se superponen, oscureciendo igual que en el objeto real
  - Color configurable (negro default, admite colores para kit de colores futuro)
- La imagen **emerge progresivamente** del caos de líneas — el efecto "wow" del producto
- **Controles:**
  - ▶ Play / ⏸ Pause / ↺ Reiniciar
  - Velocidad: ×1 / ×5 / ×20 / ×100 (para ver el resultado final rápido)
  - Contador visible: `Hilo 347 / 1.240`
  - Barra de progreso scrubable
- **Implementación:** `requestAnimationFrame` loop dibujando N líneas por frame según velocidad; sin MediaRecorder ni descarga de video

#### 3b. PDF Instructivo
- Generado con jsPDF
- Incluye:
  - Header con logo de Hagalo
  - Imagen original vs. preview del resultado
  - Diagrama del tablero con pines numerados
  - Lista de la secuencia completa (paginada)
  - Instrucciones básicas de uso
- Descarga directa

#### 3c. Audio Guía
- Botón "Iniciar guía de voz"
- **Google Cloud TTS** (voz neural clara y natural, no robótica):
  - ES: voz `es-US-Neural2-A` o `es-ES-Neural2-A`
  - EN: voz `en-US-Neural2-F`
  - PT: voz `pt-BR-Neural2-A`
- Los números se leen mientras el usuario trabaja: *"Pin cuarenta y siete... Pin ciento veintitrés..."*
- El audio se solicita en bloques (no pin por pin) para reducir latencia: pre-carga el bloque siguiente mientras reproduce el actual
- Controles: Play/Pause, velocidad (×0.75 / ×1 / ×1.25), saltar al paso actual
- El usuario indica manualmente en qué paso está (contador con +/- táctil)
- **Fallback:** Si la API falla o no hay conectividad → Web Speech API del browser con aviso al usuario

### Módulo 4: Internacionalización (i18n)
**Responsabilidad:** Soporte completo de 3 idiomas
- Español (es) — idioma principal
- Inglés (en)
- Portugués (pt)
- Switch de idioma persistido en localStorage
- La voz de Google TTS cambia automáticamente al idioma seleccionado
- PDF generado en el idioma seleccionado

### Módulo 5: Core / Shared
**Responsabilidad:** Contratos de datos, configuración del kit, utilidades
```typescript
// KitSpec — configuración del kit de Hagalo (inmutable)
export const HAGALO_KIT = {
  boardDiameter: 500,        // mm
  totalPins: 240,            // fijo — no configurable por el usuario
  stringLength: 3000,        // metros disponibles
  stringThickness: 0.5,      // mm (para escala visual)
} as const;
```

### Módulo 6: Auth *(diferido)*
**Responsabilidad:** Acceso exclusivo para clientes con kit

> [!WARNING]
> **El mecanismo de autenticación está pendiente de definición por el cliente final (Hagalo).**
> Desarrollaremos el sistema completo SIN auth en primera instancia.
> El módulo Auth se diseñará e implementará como una fase separada cuando el cliente confirme
> el mecanismo de distribución de códigos.

**Lo que sabemos:**
- El acceso será exclusivo para compradores del kit
- No hay registro de usuario, no hay contraseña
- La implementación será simple (código de acceso → JWT cookie)

**Lo que NO sabemos (pendiente del cliente final):**
- ¿Código en el paquete físico, email post-compra, o URL secreta?
- ¿Códigos de un solo uso o reutilizables?

---

## 6. Arquitectura de Carpetas (Next.js)

```
hacelo-art/
├── app/
│   ├── [locale]/                    # i18n routing
│   │   ├── layout.tsx
│   │   ├── page.tsx                 # Landing/Home
│   │   └── generator/
│   │       └── page.tsx             # App principal
│   └── api/
│       └── (vacío en MVP)
├── modules/
│   ├── image-editor/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── types.ts
│   ├── string-art-algorithm/
│   │   ├── worker.ts               # Web Worker
│   │   ├── algorithm.ts            # Lógica core
│   │   ├── pin-layout.ts           # Distribución de pines
│   │   └── types.ts
│   ├── output-generator/
│   │   ├── video/
│   │   ├── pdf/
│   │   ├── audio/
│   │   └── types.ts
│   └── i18n/
│       ├── locales/
│       │   ├── es.json
│       │   ├── en.json
│       │   └── pt.json
│       └── config.ts
├── core/
│   ├── kit-spec.ts                 # Configuración del kit Hagalo
│   ├── types.ts                    # Tipos globales
│   └── utils/
├── components/
│   ├── ui/                         # Design system components
│   └── layout/
├── styles/
│   ├── globals.css
│   ├── tokens.css                  # Design tokens (colores, spacing, etc)
│   └── animations.css
└── public/
    ├── fonts/
    └── images/
        └── hagalo-logo.svg
```

---

## 7. Flujo de Usuario (UX Flow)

```
[0] Landing Page
  ↓ "Tengo mi kit → Ingresar"

[1] Pantalla de Acceso
  ↓ El cliente ingresa su código de kit
  ↓ Backend valida → JWT cookie emitido

[2] Subir Foto
  ↓ Drag & drop o file picker
  ↓ Preview instantáneo

[3] Editor de Imagen
  ↓ Crop circular (se ajusta al tablero redondo)
  ↓ Controles: Brillo / Contraste / Zoom / Rotación
  ↓ "Generar String Art" button

[4] Procesando... (Web Worker)
  ↓ Progress bar animado con % y "Calculando hilo N de X..."
  ↓ Preview del resultado aparece conforme avanza

[5] Resultado
  ├── Canvas con el String Art final (resultado completo)
  ├── [▶ Animación] — canvas hilo por hilo
  ├── [🔊 Guía de Audio] — modo guiado por voz (Google TTS)
  └── [📄 Descargar PDF] — instructivo completo

[6] Modo Guiado en Vivo (mientras el usuario trabaja en el tablero)
  ↓ Pantalla simplificada: pin actual grande + siguiente pin
  ↓ Audio lee el número automáticamente
  ↓ Botones táctiles: [← Anterior] [Siguiente →]
  ↓ Progreso: "Paso 234 de 1.240 — 19%"
```

---

## 8. El Algoritmo de String Art — Detalles Técnicos

### ¿Cómo funciona?

El algoritmo implementa el método de **"Continuous Line String Art"** popularizado por Petros Vrellis (2013):

1. **Preparación:**
   - Convertir imagen a escala de grises
   - Normalizar píxeles 0–255
   - Crear un canvas de trabajo (imagen objetivo)

2. **Pre-cómputo de líneas:**
   - Para cada par de pines (i, j), almacenar los píxeles que atraviesa (algoritmo de Bresenham)
   - Cache en memoria: ~240² / 2 ≈ 28.800 líneas

3. **Loop de selección (greedy):**
   ```
   Para cada iteración:
     Para cada posible próximo pin desde el pin actual:
       Calcular score = suma de valores de píxeles que oscurecería
     Seleccionar el pin con mayor score
     "Dibujar" la línea en el canvas de trabajo (restar oscuridad)
     Agregar pin a la secuencia
   ```

4. **Criterio de parada:**
   - Se agotan los metros de cuerda
   - O: No hay mejora significativa (threshold)

### Complejidad computacional
- Pre-cómputo: O(N² × L) donde N=240 pines, L≈longitud promedio de línea
- Loop principal: O(iteraciones × N) 
- En práctica: **< 30 segundos en browser** para configuración estándar

### Optimizaciones planeadas
- Web Worker para no bloquear el hilo principal
- OffscreenCanvas para rendering en background
- Cache de líneas pre-computadas (se computa una sola vez por sesión)
- Early termination configurable

---

## 9. Design System

### Paleta de colores (branded para Hagalo)
```css
/* Tokens principales */
--color-primary: hsl(270, 85%, 60%);      /* Violeta premium */
--color-primary-dark: hsl(270, 85%, 45%);
--color-accent: hsl(40, 100%, 60%);       /* Dorado */
--color-bg: hsl(220, 20%, 8%);            /* Dark mode base */
--color-surface: hsl(220, 15%, 13%);
--color-surface-elevated: hsl(220, 15%, 18%);
--color-text: hsl(220, 10%, 95%);
--color-text-muted: hsl(220, 10%, 65%);
```

### Tipografía
- Headings: **Outfit** (Google Fonts) — moderna, geométrica
- Body: **Inter** — legibilidad perfecta

### Componentes UI clave
- `FileDropzone` — zona de drag & drop animada
- `ImageEditor` — canvas interactivo con controles
- `ProgressRing` — progreso circular del algoritmo
- `StringArtCanvas` — resultado interactivo
- `VideoPlayer` — player custom del video generado
- `AudioGuide` — player de audio con estado de paso actual
- `LanguageSwitch` — selector de idioma flotante

---

## 10. Fases de Desarrollo

### Fase 0 — Fundación (1 semana)
- Setup Next.js + TypeScript + estructura de carpetas
- Design system (tokens CSS, tipografías, colores)
- Sistema de i18n (next-intl)
- Landing page básica

### Fase 1 — Image Editor (1 semana)
- Componente de upload con drag & drop
- Editor de imagen (crop, brillo, contraste)
- Pre-procesamiento (escala de grises, normalización)

### Fase 2 — Algoritmo Core (1.5 semanas)
- Implementación del algoritmo en Web Worker
- Visualización en tiempo real del progreso
- Configuración de parámetros (pines, iteraciones)
- Tests del algoritmo con imágenes de prueba

### Fase 3 — Outputs (1.5 semanas)
- Video generator (canvas animation + MediaRecorder)
- PDF generator (jsPDF con template de Hagalo)
- Audio guide (Web Speech API + controles de sesión)

### Fase 4 — Pulido y Lanzamiento (1 semana)
- Responsive design (mobile first)
- Performance optimization
- Testing cross-browser
- Deploy en Vercel
- Integración con URL de Hagalo

**Total estimado: 6 semanas** para un MVP completo y funcional.

---

## 11. Decisiones Confirmadas por el Cliente

| Decisión | Respuesta | Impacto en arquitectura |
|---|---|---|
| Logo / URL | Sin definir aún | Usamos placeholders para MVP |
| Acceso | Solo para clientes con kit | Requiere módulo Auth (Módulo 6) |
| Pines configurables | No — siempre 240 | KitSpec inmutable, sin UI de configuración |
| Guardar proyectos | No | Sin base de datos, sin historial |
| Calidad de voz | Clara y natural | Google Cloud TTS (Neural2) |
| Video descargable | No necesario | Canvas animado sin MediaRecorder |

---

## 11b. Preguntas Diferidas

| Pregunta | Estado | Bloqueante para |
|---|---|---|
| Mecanismo de auth (código en kit, email, URL secreta) | Pendiente del cliente final | Módulo 6 Auth |
| Logo en SVG/PNG | Pendiente | PDF branding + landing page |
| URL / dominio definitivo | Pendiente | Deploy a producción |

> [!NOTE]
> Ninguna de estas preguntas bloquea el inicio del desarrollo. El core (algoritmo, editor, animación, PDF, audio)
> se puede desarrollar completamente sin estas respuestas. Auth se implementa al final como módulo independiente.

---

## 12. Consideraciones Técnicas Especiales

### Performance del algoritmo en móviles
El algoritmo puede ser pesado en dispositivos de gama baja. Estrategias:
- Ofrecer "modo rápido" (menor resolución de canvas, menos iteraciones)
- Detectar capacidad del dispositivo y ajustar automáticamente

### Privacidad
- Las fotos NO deben subirse a ningún servidor en el MVP
- Todo el procesamiento es local en el browser del usuario
- Esto es un diferenciador de privacidad que se puede comunicar

### Audio con Google TTS — consideraciones
- Los audios se generan on-demand via `/api/tts` (proxy serverless)
- Se cachean en el cliente para evitar re-pedidos del mismo pin
- Latencia esperada: < 300ms por número (aceptable)
- Fallback: si la API falla → Web Speech API nativa del browser
- Costo estimado Google TTS Neural2: ~$0.000016 USD por carácter → una sesión completa (~5.000 chars) cuesta ~$0.08 USD. Muy bajo.

### Animación Canvas — compatibilidad
- `requestAnimationFrame`: ✅ todos los browsers modernos
- Sin MediaRecorder, sin WebM, sin server-side encoding
- Funciona igual en mobile y desktop

---

## 13. Criterios de Éxito

Un MVP exitoso debe:
- [ ] Procesar una foto en menos de 60 segundos en un ordenador promedio
- [ ] Generar un string art visualmente reconocible de la imagen original
- [ ] Producir un PDF descargable con la secuencia completa
- [ ] Leer los números en audio en los 3 idiomas
- [ ] Generar un video preview del proceso
- [ ] Funcionar en mobile y desktop
- [ ] Cargarse en menos de 3 segundos

