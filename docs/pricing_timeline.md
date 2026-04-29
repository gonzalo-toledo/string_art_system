# 💰 HáceloArt — Estimación de Costos, Timeline y Workflow

## 1. Análisis de Complejidad por Módulo

| Módulo | Complejidad | Horas Estimadas | Justificación |
|---|:---:|:---:|---|
| **Fundación** (Next.js, design system, i18n, estructura) | Media | 30-40h | Setup + tokens CSS + 3 idiomas + arquitectura de carpetas |
| **Image Editor** (upload, crop, brillo, contraste, pre-proceso) | Media | 25-35h | react-easy-crop + procesamiento canvas para escala de grises |
| **Algoritmo Core** (Continuous Line String Art) | **Alta** | 50-70h | Algoritmo matemático complejo, optimización de performance, Web Worker, testing extensivo |
| **Animación Canvas** (simulación hilo por hilo) | **Alta** | 35-45h | requestAnimationFrame, controles, progreso scrubable, mobile performance |
| **PDF Generator** (jsPDF, template Hagalo) | Baja-Media | 15-20h | Template con diagrama de pines, secuencia paginada, 3 idiomas |
| **Audio Guide** (Google TTS, modo guiado) | Media-Alta | 30-40h | API proxy, caching, bloques de audio, fallback, UI táctil mobile |
| **Auth** *(diferido)* | Baja | 15-20h | JWT simple, sin BD — pero pendiente del cliente |
| **UI/UX Premium** (responsive, animaciones, polish) | Media-Alta | 40-50h | Mobile-first, modo guiado táctil, micro-animaciones, dark mode |
| **Testing & QA** | Media | 20-30h | Tests del algoritmo, cross-browser, mobile testing |

### Totales

| Concepto | Horas | Observación |
|---|:---:|---|
| **Desarrollo core** (sin auth) | **245 - 330h** | Todo lo necesario para un sistema funcional |
| **Auth** (cuando se defina) | +15-20h | Se suma después |
| **Buffer de imprevistos** (15%) | +37-50h | Siempre hay sorpresas, especialmente con el algoritmo |
| **TOTAL ESTIMADO** | **300 - 400h** | — |

---

## 2. Modelos de Pricing

> [!IMPORTANT]
> Estos rangos son para presentar al cliente. Ajustá el número final según tu relación con ellos
> y la capacidad del equipo. Lo importante es que el PISO cubra costos + margen razonable.

### Opción A — Por hora (transparente, menor riesgo para vos)

```
Rango de tarifa:     $15 - $25 USD/hora (tarifa junior/mid Argentina)
Total estimado:      $4,500 - $10,000 USD
En ARS (aprox):      $5.400.000 - $12.000.000 ARS (al cambio actual ~1200 ARS/USD)
```

**Pros:** Si la complejidad del algoritmo se dispara, no perdés plata.
**Contras:** El cliente no sabe cuánto va a pagar al final.

### Opción B — Precio fijo con hitos (más confianza para el cliente)

```
Precio fijo total:   $6,000 - $8,000 USD
En ARS (aprox):      $7.200.000 - $9.600.000 ARS
```

Pagado en **4 hitos:**

| Hito | % Pago | Entregable |
|---|:---:|---|
| Kick-off + Fundación completada | 25% | Proyecto armado, design system, i18n, landing |
| Editor + Algoritmo funcional | 30% | Se puede subir foto y generar string art |
| Outputs completos (Animación + PDF + Audio) | 30% | Sistema 100% funcional sin auth |
| Polish + Auth + Deploy | 15% | Entrega final, deploy en producción |

**Pros:** El cliente sabe exactamente cuánto paga. Genera confianza.
**Contras:** Si el algoritmo requiere más trabajo del esperado, absorbes vos el costo.

### Opción C — Mixto (mi recomendación) ✅

```
Base fija:           $5,000 USD ($6.000.000 ARS)
                     Cubre Fundación + Editor + UI/UX + PDF + i18n

Variable (por hora): $20 USD/hora para:
                     - Algoritmo core (la parte más impredecible)
                     - Audio TTS integration
                     - Auth (cuando se defina)

Estimación variable: $2,000 - $3,500 USD adicionales
TOTAL ESTIMADO:      $7,000 - $8,500 USD ($8.4M - $10.2M ARS)
```

**Pros:** Protege al equipo en lo impredecible (algoritmo), da certeza al cliente en lo predecible.
**Contras:** Ligeramente más complejo de explicar.

---

## 3. Costos Recurrentes (post-lanzamiento)

| Concepto | Costo/mes | Notas |
|---|:---:|---|
| Vercel Pro (hosting) | $20 USD | Incluye serverless functions |
| Google Cloud TTS | $5-15 USD | ~$0.08/sesión × ~100-200 sesiones/mes |
| Dominio (si es nuevo) | $1-2 USD | $12-24/año |
| **Total mensual** | **$26-37 USD** | ~$31K - $44K ARS/mes |

> [!TIP]
> El costo operativo es MUY bajo comparado con el precio del kit (~$70 USD).
> Si venden 50 kits/mes → el software cuesta ~$0.60 por kit vendido.

---

## 4. Timeline con SDD

> [!NOTE]
> El timeline es más largo que los "6 semanas" del plan original porque incluimos:
> SDD completo, agents.md, skills, y la premisa de "no código sin consulta".

```
Semana 0-1:   Setup de proyecto (agents.md, skills, SDD init, SDD explore + propuesta)
Semana 1-2:   SDD specs + design + tasks → PRIMERA CONSULTA antes de codear
Semana 2-4:   Fase 1 — Fundación + Image Editor (SDD apply + verify)
Semana 4-6:   Fase 2 — Algoritmo Core (SDD apply + verify) ← LA MÁS CRÍTICA
Semana 6-8:   Fase 3 — Outputs (Animación + PDF + Audio)
Semana 8-9:   Fase 4 — UI Polish + Mobile optimization
Semana 9-10:  QA + Deploy + Auth (si ya tenemos la definición del cliente)
```

**Total estimado: 8-10 semanas** (con 1-2 desarrolladores, ritmo sostenible).

El algoritmo es la pieza más riesgosa — si lleva más tiempo del esperado, las semanas 4-6 pueden estirarse a 4-7.

---

## 5. Workflow de Desarrollo — Paso a paso antes de codear

Este es el orden exacto de lo que haremos:

### Paso 1: Crear `agents.md` 📋
El "cerebro" del proyecto para cualquier agente de IA que trabaje en él.
Siguiendo el formato establecido en barcontrol, adaptado a Next.js + TypeScript.

### Paso 2: Cargar Skills 🧠
Activar las skills de SDD que ya tenemos:
- `sdd-init` → Detectar stack, convenciones, testing
- `sdd-explore` → Investigar antes de comprometerse
- `sdd-propose` → Propuesta formal del cambio
- `sdd-spec` → Especificaciones con escenarios
- `sdd-design` → Diseño técnico detallado
- `sdd-tasks` → Checklist de implementación
- `sdd-apply` → Implementación (cuando lleguemos acá)
- `sdd-verify` → Validación contra specs

### Paso 3: SDD Init 🚀
```
/sdd-init → bootstrapear el proyecto con SDD
```
Esto detecta el stack, establece convenciones, y prepara el terreno.

### Paso 4: SDD Explore — Algoritmo
El primer `/sdd-explore` debería ser sobre el algoritmo de string art,
porque es la pieza de mayor riesgo técnico y la que más impacta el timeline.

### Paso 5: Consulta antes de cada fase
Antes de cada `/sdd-apply`, revisamos juntos:
- Las specs generadas
- El diseño técnico
- El breakdown de tasks

**Nada se codea sin tu revisión.**

---

## 6. Valor del Proyecto — Argumento de venta para el cliente

Para presentarle el precio a Hagalo, estos son los argumentos:

1. **Elimina dependencia de terceros** — Hoy dependen de farostringart.com. Si ese sitio se cae o cambia, pierden la experiencia de sus clientes.

2. **Diferenciación competitiva** — Audio guía + animación hilo por hilo + PDF. Ningún competidor tiene las tres juntas.

3. **Branding propio** — La experiencia digital completa lleva su marca. Es extensión del producto físico.

4. **Costo operativo irrisorio** — ~$30 USD/mes vs. el valor de marca y retención de clientes.

5. **Optimizado para SU kit** — 240 pines, 50cm, 3000m. Sin configuración innecesaria. El usuario abre y usa.

6. **Mobile-first** — Diseñado para que el usuario use el celular MIENTRAS arma el cuadro. La competencia no piensa en eso.

