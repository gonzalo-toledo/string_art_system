# Design: Fundación del Proyecto (Next.js & Setup)

## Technical Approach

Vamos a inicializar el andamiaje de Next.js 14 App Router usando una instalación limpia sin Tailwind. Dado que ya tenemos una carpeta `src/core` con el algoritmo, inicializaremos Next.js en una carpeta temporal y fusionaremos los archivos para evitar que el CLI de `create-next-app` falle por directorio no vacío. Luego, instalaremos `jest` y `next-intl` y configuraremos sus archivos base.

## Architecture Decisions

### Decision: Inicialización de Next.js
**Choice**: Crear el proyecto Next.js en un directorio temporal (`./temp-next`) y mover sus contenidos a la raíz, fusionando la carpeta `src/`.
**Alternatives considered**: Usar `npx create-next-app . --force`.
**Rationale**: `create-next-app` puede sobreescribir configuraciones o fallar si detecta archivos existentes. Mover los archivos manualmente garantiza que no perdamos el código de nuestro Worker ni nuestros directorios de especificaciones (`openspec/`).

### Decision: Herramienta de Testing
**Choice**: `jest` junto con `ts-jest`.
**Alternatives considered**: `vitest` o Node's native test runner.
**Rationale**: Jest es el estándar de la industria y se integra nativamente muy bien con Next.js cuando necesitemos testear componentes de React más adelante. `ts-jest` nos permite correr los tests de matemáticas de TypeScript sin compilar previamente.

### Decision: Internacionalización
**Choice**: Usar la librería `next-intl` basada en App Router (`[locale]`).
**Alternatives considered**: `next-i18next` o ruteo de dominios.
**Rationale**: `next-intl` es la solución más robusta recomendada por Vercel para Next 14 con Server Components. Permite tener los diccionarios cargados del lado del servidor sin inflar el bundle de JavaScript del cliente.

## Data Flow (i18n Middleware)

    Browser Request (/) ──→ Next.js Middleware ──→ Detecta Idioma (Accept-Language)
                                  │
                                  └─→ Redirige a /es (o /en) ──→ Renderiza [locale]/page.tsx
                                                                    (inyectando messages/es.json)

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `package.json` | Create/Modify | Dependencias de Next.js, Jest, next-intl. Scripts de dev, build, test. |
| `tsconfig.json` | Create | Configuración base de TS. |
| `jest.config.js` | Create | Configuración de ts-jest y mapeo de alias. |
| `src/middleware.ts` | Create | Interceptor de rutas para inyectar locale. |
| `src/i18n.ts` | Create | Cargador dinámico de diccionarios de `next-intl`. |
| `src/app/[locale]/layout.tsx` | Create | Layout principal inyectando el contexto de idiomas y CSS global. |
| `src/app/[locale]/page.tsx` | Create | Página de inicio placeholder. |
| `src/styles/design-tokens.css` | Create | Variables de colores y fuentes (Vanilla CSS). |
| `messages/es.json` | Create | Diccionario Español. |
| `messages/en.json` | Create | Diccionario Inglés. |
| `messages/pt.json` | Create | Diccionario Portugués. |

## Interfaces / Contracts

**Estructura de Diccionarios (messages/es.json)**
```json
{
  "Index": {
    "title": "HáceloArt",
    "description": "Crea arte con hilos."
  }
}
```

**Design Tokens Base (src/styles/design-tokens.css)**
```css
:root {
  --color-primary: #111111;
  --color-secondary: #f0f0f0;
  --color-accent: #d4af37; /* Ejemplo dorado */
  
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 32px;
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Algoritmo | Validar que el comando `npm run test` localiza la carpeta `src/core/algorithm/__tests__` y los pasa con verde usando `ts-jest`. |
| E2E | Rutas de Idioma | Validar manualmente en el navegador que `/` redirige y `/en` muestra el texto en inglés. |

## Migration / Rollout

No data migration required. Esta es la base inicial.
