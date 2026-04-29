# 🔬 Exploración: Algoritmo de String Art

## Estado Actual

No hay código en el proyecto todavía. Esta exploración define el algoritmo ANTES de escribir una sola línea.

**Restricciones del kit Hagalo:**
- 240 pines fijos en círculo de 50cm
- 3.000 metros de cuerda (una sola continua)
- Hilo negro sobre tablero claro

---

## El Algoritmo — De la Teoría a la Práctica

### Origen: Petros Vrellis (2013)

Artista griego que creó obras de string art físicas usando un único hilo continuo sobre un marco circular con clavos. Nunca publicó su código, pero la comunidad matemática y de CS reverseó el método. La técnica se basa en un principio simple:

> **Cada línea de hilo oscurece los píxeles que atraviesa. Si elegimos la línea que más se parece a lo que nos falta por oscurecer, eventualmente reconstruimos la imagen.**

### Fundamento Matemático

```
Sea T[x,y] la imagen objetivo en escala de grises (0=blanco, 255=negro)
Sea C[x,y] el canvas actual (arranca en 0 — blanco)
Sea E[x,y] = T[x,y] - C[x,y] el error residual (lo que falta por oscurecer)

Para cada par de pines (i, j):
  Sea L(i,j) = {(x₁,y₁), (x₂,y₂), ..., (xₖ,yₖ)} los píxeles de la línea (Bresenham)
  
  Score(i,j) = Σ E[xₙ,yₙ] para cada píxel en L(i,j)
               ─────────────────────────────
               |L(i,j)|  (normalizado por longitud)

Elegir j* = argmax Score(current_pin, j)
Actualizar: C[x,y] += LINE_WEIGHT para cada píxel en L(current_pin, j*)
```

---

## Enfoques Investigados

### Approach A: Greedy Básico (Petros Vrellis original)

El más simple y el más documentado.

```
PARA CADA iteración:
  best_score = -∞
  best_pin = -1
  
  PARA CADA pin j (j ≠ current, j ≠ previous):
    pixels = bresenham(current_pin, j)
    score = SUM(error_image[p] para p en pixels) / len(pixels)
    
    SI score > best_score:
      best_score = score
      best_pin = j
  
  PARA CADA pixel en bresenham(current_pin, best_pin):
    error_image[pixel] -= LINE_WEIGHT  // restar oscuridad aplicada
  
  sequence.push(best_pin)
  current_pin = best_pin
```

- **Pros:** Simple, rápido, resultados decentes
- **Cons:** Tiende a sobre-oscurecer zonas ya oscuras, genera "manchas" en áreas de alto contraste
- **Esfuerzo:** Bajo

### Approach B: Greedy con Penalty por sobre-oscurecimiento ✅

Mejora del A donde los píxeles que ya se pasaron de oscuro PENALIZAN el score.

```
PARA CADA pin j:
  pixels = bresenham(current_pin, j)
  score = 0
  
  PARA CADA pixel p en pixels:
    remaining = error_image[p]
    SI remaining > 0:
      score += min(remaining, LINE_WEIGHT)   // recompensa: oscurecer lo que falta
    SINO:
      score -= abs(remaining) * PENALTY_MULT  // penalización: ya está demasiado oscuro
  
  score /= len(pixels)  // normalizar por longitud
```

**`PENALTY_MULT`** controla cuánto "duele" pasarse. Valores típicos: 1.5 – 3.0.

- **Pros:** Distribución más uniforme del hilo, evita "manchas negras", mejor para retratos
- **Cons:** Ligeramente más lento, requiere tuning de PENALTY_MULT
- **Esfuerzo:** Medio

### Approach C: Greedy con Importance Mask (detección facial)

Agrega una capa de pesos por región: zonas como ojos y boca pesan más en el score.

```
importance_map[x,y] = 1.0  // default
importance_map[eye_region] = 3.0
importance_map[mouth_region] = 2.0
importance_map[background] = 0.5

score += error_image[p] * importance_map[p]
```

- **Pros:** Resultados espectaculares en retratos — los ojos quedan nítidos
- **Cons:** Requiere face detection (browser API o modelo), complejidad alta, no aplica a paisajes/objetos
- **Esfuerzo:** Alto

---

## Recomendación

> [!IMPORTANT]
> **Implementar Approach B (Greedy con Penalty)** como primera versión. Es el mejor balance entre calidad y complejidad.

**Approach C (Importance Mask)** se deja como mejora futura — no es necesario para el MVP pero sería un diferenciador potente en v2.

**Justificación:**
1. El 90%+ de las imágenes que subirán los usuarios de Hagalo serán **retratos de personas** (pareja, familia, mascota). El penalty function maneja bien este caso sin necesitar face detection.
2. El Approach A produce "manchas" visibles que pueden decepcionar al usuario.
3. El Approach C agrega dependencia de face detection API y no funciona con mascotas/paisajes.

---

## Detalles Críticos de Implementación

### 1. Pre-cómputo de Líneas (Bresenham Cache)

**Este es el paso más importante para la performance.**

Para 240 pines → `240 × 239 / 2 = 28.680` líneas únicas.
Cada línea tiene ~300-700 píxeles (dependiendo de la resolución del canvas).

```typescript
// Estructura del cache
type LineCache = Map<string, Uint16Array>;  // key: "i-j", value: [x1,y1, x2,y2, ...]

// Pre-cómputo (una sola vez por sesión)
function precomputeLines(pins: Point[], canvasSize: number): LineCache {
  const cache = new Map();
  for (let i = 0; i < pins.length; i++) {
    for (let j = i + 1; j < pins.length; j++) {
      const pixels = bresenham(pins[i], pins[j]);
      cache.set(`${i}-${j}`, new Uint16Array(pixels.flat()));
    }
  }
  return cache;
}
```

**Memoria estimada:** 28.680 líneas × 500 píxeles × 2 coords × 2 bytes ≈ **57 MB**

> [!WARNING]
> 57 MB es mucho para un móvil de gama baja. Alternativa: calcular Bresenham on-the-fly en vez de cachear.
> Trade-off: más CPU, menos RAM. Hay que testear ambas opciones.

### 2. Resolución del Canvas Interno

El algoritmo NO necesita correr a la resolución del canvas visual. Usar una resolución interna menor:

| Resolución interna | Calidad | Tiempo estimado (240 pines, 2000 hilos) |
|:---:|:---:|:---:|
| 200 × 200 px | Aceptable | ~5 seg |
| 400 × 400 px | Buena | ~15 seg |
| 500 × 500 px | Muy buena | ~25 seg |
| 800 × 800 px | Excelente | ~60+ seg |

**Recomendación: 400×400 px.** Buen balance. El resultado se escala al renderizar en el canvas visual.

### 3. Representación del Error Image

Usar un `Float32Array` unidimensional (no un array 2D de objetos):

```typescript
// ✅ Bueno — operaciones rápidas, memory-efficient
const errorImage = new Float32Array(width * height);

// ❌ Malo — lento, memory overhead
const errorImage = Array.from({length: height}, () => Array(width).fill(0));
```

Acceso: `errorImage[y * width + x]`

### 4. Evitar Líneas Muy Cortas

Pines adyacentes (1-2 pines de distancia) producen líneas visualmente invisibles. Filtrar:

```typescript
const MIN_PIN_DISTANCE = 20;  // mínimo 20 pines de separación

// En el loop:
if (Math.abs(j - currentPin) < MIN_PIN_DISTANCE && 
    Math.abs(j - currentPin) > totalPins - MIN_PIN_DISTANCE) {
  continue;  // skip — línea demasiado corta
}
```

### 5. Evitar Reversa Inmediata

No permitir ir de pin A → pin B → pin A (ida y vuelta inmediata):

```typescript
if (j === previousPin) continue;
```

### 6. LINE_WEIGHT — El Parámetro Más Sensible

`LINE_WEIGHT` es cuánto "oscurece" cada hilo en el error image. Demasiado alto → pocas iteraciones, manchas. Demasiado bajo → muchas iteraciones, imagen diluida.

| LINE_WEIGHT | Efecto | Iteraciones típicas |
|:---:|---|:---:|
| 15 | Sutil, gradual, muchas iteraciones | 3000-5000 |
| 25 | Equilibrado | 1500-2500 |
| 40 | Agresivo, pocas iteraciones | 800-1500 |

**Recomendación: empezar con 25, hacer ajustable internamente para tuning.**

### 7. Cálculo de Metros de Cuerda

```typescript
function calculateStringLength(sequence: number[], radius: number, totalPins: number): number {
  let totalMeters = 0;
  for (let i = 0; i < sequence.length - 1; i++) {
    const pinA = sequence[i];
    const pinB = sequence[i + 1];
    const angleDiff = Math.abs(pinA - pinB);
    const minAngle = Math.min(angleDiff, totalPins - angleDiff);
    const chordLength = 2 * radius * Math.sin((minAngle * Math.PI) / totalPins);
    totalMeters += chordLength;
  }
  return totalMeters / 1000; // mm → metros
}
```

Para 240 pines en un tablero de 500mm (radio = 250mm):
- Diámetro (línea más larga): 500mm
- Promedio: ~350mm por hilo
- Con 2000 hilos: ~700 metros (~23% de los 3000m disponibles)
- Con 4000 hilos: ~1400 metros (~47% de los 3000m)

**Conclusión: 3000m de cuerda es MÁS que suficiente para cualquier configuración razonable.**

---

## Trampas Documentadas (de la investigación)

| # | Trampa | Solución |
|---|---|---|
| 1 | **Polaridad invertida** — si la imagen tiene fondo oscuro, el algoritmo intenta oscurecer el fondo (que ya es oscuro) | Invertir los grises ANTES del algoritmo: `pixel = 255 - pixel` |
| 2 | **Manchas negras (over-darkening)** — zonas que se oscurecen de más | Penalty function (Approach B) + clamping a 0 |
| 3 | **Líneas cortas invisibles** — pines adyacentes | MIN_PIN_DISTANCE = 20 |
| 4 | **Starburst artifacts** — un pin se usa demasiado | Pin usage penalty opcional (v2) |
| 5 | **Sesgo geométrico** — líneas diagonales lucen más delgadas que horizontales | Anti-aliased Bresenham (Xiaolin Wu) — v2 |
| 6 | **Mobile performance** — 28K evaluaciones × 2000 iteraciones = lento | Resolución interna de 400px + Web Worker |
| 7 | **Imagen de entrada mala** — baja resolución, poco contraste | Pre-procesamiento: normalización de histograma + contraste automático |

---

## Web Worker — Protocolo de Comunicación

```typescript
// === MAIN THREAD → WORKER ===

type AlgorithmConfig = {
  type: 'start';
  imageData: Uint8ClampedArray;  // escala de grises, 1 canal
  width: number;
  height: number;
  totalPins: number;            // 240
  maxIterations: number;        // del slider del usuario
  lineWeight: number;           // 25 default
  penaltyMultiplier: number;    // 2.0 default
  minPinDistance: number;       // 20 default
  boardRadius: number;          // 250mm
};

// === WORKER → MAIN THREAD ===

type ProgressMessage = {
  type: 'progress';
  iteration: number;
  totalIterations: number;
  percentComplete: number;
  currentScore: number;         // para detectar diminishing returns
  // Cada 100 iteraciones: snapshot del canvas para preview
  previewData?: Uint8ClampedArray;
};

type CompleteMessage = {
  type: 'complete';
  sequence: Uint16Array;        // secuencia de pines (más eficiente que number[])
  totalIterations: number;
  totalStringMeters: number;
  computeTimeMs: number;
};

type ErrorMessage = {
  type: 'error';
  message: string;
};
```

---

## Performance Estimada (browser)

### Desktop (laptop moderna, Chrome)

| Config | Pre-cómputo | Loop | Total |
|---|:---:|:---:|:---:|
| 400px, 2000 hilos | ~2 seg | ~12 seg | **~14 seg** |
| 400px, 3000 hilos | ~2 seg | ~18 seg | **~20 seg** |
| 500px, 2000 hilos | ~3 seg | ~20 seg | **~23 seg** |

### Mobile (gama media, Chrome Android)

| Config | Pre-cómputo | Loop | Total |
|---|:---:|:---:|:---:|
| 400px, 2000 hilos | ~5 seg | ~30 seg | **~35 seg** |
| 300px, 2000 hilos | ~3 seg | ~18 seg | **~21 seg** |

> [!NOTE]
> Estos son estimados basados en benchmarks de implementaciones similares.
> Los tiempos reales dependerán del dispositivo. Con TypedArrays y Web Workers
> estamos en el rango aceptable (< 60 seg en mobile).

### Optimización: Bresenham on-the-fly vs. Cached

| Estrategia | RAM | CPU | Mejor para |
|---|---|---|---|
| Cache completo (Map) | ~57 MB | Rápido | Desktop |
| On-the-fly (sin cache) | ~0 MB | 2-3x más lento | Mobile gama baja |
| **Híbrido** (cache parcial) | ~10 MB | Balanceado | **Recomendado** |

**Estrategia híbrida recomendada:** cachear solo las líneas más largas (>150px) y calcular on-the-fly las cortas. Reduce RAM a ~10MB y mantiene buena velocidad.

---

## Riesgos Identificados

1. **Performance en móviles de gama baja** — El loop principal hace 240 evaluaciones × N iteraciones. Si N=2000 → 480.000 evaluaciones de Bresenham. Mitigación: resolución baja (300px) + early termination.

2. **Calidad visual del resultado** — El tuning de LINE_WEIGHT y PENALTY_MULT requiere pruebas extensivas con diferentes tipos de imágenes. No hay "valores mágicos" universales.

3. **Imágenes no aptas** — Fotos de bajo contraste, con mucho fondo, o muy coloridas sin estructura clara van a producir resultados pobres. Necesitamos pre-procesamiento robusto Y feedback al usuario ("Tu imagen tiene poco contraste, ¿querés ajustarlo?").

4. **Expectativa vs. Realidad** — El string art digital siempre luce mejor que el físico. La animación va a mostrar líneas perfectas, pero el hilo real tiene grosor, textura, y la tensión varía. Gestionar expectativas en la UX.

---

## Ready for Proposal

**Sí.** La investigación está completa. Lo que necesitamos para arrancar:

1. **Approach B (Greedy + Penalty)** como algoritmo base
2. **400×400px** resolución interna default (con opción de bajar a 300 en mobile)
3. **TypedArrays** (Float32Array, Uint16Array) para todo el cálculo
4. **Web Worker** con protocolo de progress cada 50-100 iteraciones
5. **Bresenham híbrido** (cache parcial)
6. **LINE_WEIGHT=25, PENALTY_MULT=2.0** como defaults iniciales
7. **Tests con 5-10 imágenes de prueba** variadas (retrato, mascota, paisaje, alto/bajo contraste)

El siguiente paso sería un `/sdd-new` para la fase de fundación, o directamente para el algoritmo si preferís empezar por el corazón del sistema.

