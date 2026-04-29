# Proposal: Fundación del Proyecto (Next.js & Setup)

## Intent

Inicializar la infraestructura principal de la aplicación web sobre la cual correrá el algoritmo y la interfaz de usuario. Esto establecerá el marco de trabajo estructurado para el renderizado, el enrutamiento, las pruebas unitarias y la internacionalización.

## Scope

### In Scope
- Inicialización de Next.js (App Router, TypeScript).
- Configuración de Jest y testing library para poder ejecutar los tests del algoritmo ya creados.
- Sistema de Diseño Vanilla CSS (Tokens de colores, tipografía, espaciado).
- Configuración inicial de `next-intl` para soporte de tres idiomas (Español, Inglés, Portugués).
- Limpieza de los archivos por defecto de Next.js.

### Out of Scope
- Diseño e implementación de la Interfaz de Usuario final (Landing, Editor de fotos).
- Conexión con APIs externas (Google TTS) u autenticación.
- Integración del Worker de String Art dentro de la UI (eso será otra fase).

## Capabilities

### New Capabilities
- `core-infrastructure`: El entorno base de ejecución y pruebas (Next.js + Jest).
- `design-system`: Las variables globales de CSS (colores, fuentes) sin depender de Tailwind.
- `i18n`: El ruteo dinámico basado en el idioma del navegador/usuario.

### Modified Capabilities
- Ninguna.

## Approach

Se utilizará `npx create-next-app` para el andamiaje inicial, rechazando TailwindCSS para mantener el acuerdo de usar Vanilla CSS con Design Tokens, lo que permite un control más granular sobre las animaciones y un diseño premium. Se configurará Jest y `ts-jest` apuntando a la carpeta `src/core/algorithm` para validar que nuestro desarrollo matemático anterior corre correctamente en Node. Finalmente, se instalará `next-intl` usando middleware para el enrutamiento `/es`, `/en`, `/pt`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| Raíz del proyecto | New | `package.json`, `next.config.mjs`, `jest.config.js` |
| `src/app` | New | App Router base (layout, page), middleware de i18n |
| `src/styles` | New | Archivos CSS globales y Design Tokens |
| `messages/` | New | Diccionarios JSON de idiomas |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Conflictos entre el código base de Next.js y los archivos ya creados (`src/core`) | Low | Inicializar Next.js temporalmente en una subcarpeta y mover los archivos, o crear manualmente los archivos de configuración. |
| Complejidad de `next-intl` con App Router | Medium | Seguir estrictamente la documentación oficial de `next-intl` para Next.js 14, que requiere una estructura de carpetas específica `[locale]`. |

## Rollback Plan

Eliminar los archivos autogenerados de Next.js (`node_modules`, `package.json`, `src/app`, etc.) manteniendo a salvo la carpeta `src/core` y `src/workers` que desarrollamos en la fase anterior.

## Dependencies

- Node.js environment
- Librerías: `next`, `react`, `jest`, `next-intl`

## Success Criteria

- [ ] Correr `npm run dev` carga una página en blanco sin errores.
- [ ] Correr `npm run test` ejecuta y pasa con éxito los tests de `bresenham.ts` y `greedy.ts`.
- [ ] Navegar a `/es` o `/en` cambia el texto de la página base según el diccionario.
- [ ] Existen variables CSS globales definidas.
