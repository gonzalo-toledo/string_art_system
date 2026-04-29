# Tasks: Fundación del Proyecto (Next.js & Setup)

## Phase 1: Next.js Initialization

- [ ] 1.1 Inicializar Next.js en carpeta temporal mediante bash (`npx create-next-app@14 temp-next --ts --eslint --tailwind=false --src-dir --app --import-alias "@/*" --use-npm`).
- [ ] 1.2 Mover todos los archivos de `temp-next` a la raíz del proyecto (incluyendo `package.json`, `tsconfig.json`, `src/app`, etc.) fusionando `src/`.
- [ ] 1.3 Eliminar la carpeta temporal `temp-next` y limpiar el CSS por defecto en `src/app/globals.css`.

## Phase 2: Testing Configuration

- [ ] 2.1 Instalar dependencias para testing mediante bash (`npm install -D jest ts-jest @types/jest`).
- [ ] 2.2 Crear archivo `jest.config.js` configurado para usar `ts-jest` y mapear los imports con alias `@/*`.
- [ ] 2.3 Modificar `package.json` para agregar el script `"test": "jest"` y ejecutarlo para verificar que los tests del worker (`bresenham.test.ts` y `greedy.test.ts`) pasan exitosamente.

## Phase 3: Internationalization (i18n)

- [ ] 3.1 Instalar la librería `next-intl` mediante bash (`npm install next-intl`).
- [ ] 3.2 Crear la carpeta `messages/` y dentro los archivos `es.json`, `en.json`, y `pt.json` con claves básicas (ej. "Index.title").
- [ ] 3.3 Crear `src/i18n.ts` para cargar los diccionarios dinámicamente y envolver `next.config.mjs` con `withNextIntl`.
- [ ] 3.4 Crear `src/middleware.ts` para interceptar las rutas y redirigir al prefijo de idioma correcto (ej `/es`).
- [ ] 3.5 Mover `src/app/page.tsx` y `src/app/layout.tsx` adentro de la estructura requerida `src/app/[locale]/` e inyectar el contexto de idioma y traducciones.

## Phase 4: Design System

- [ ] 4.1 Crear `src/styles/design-tokens.css` con las variables CSS base de color, tipografía y espaciado.
- [ ] 4.2 Importar `design-tokens.css` en `src/app/[locale]/layout.tsx` para que esté disponible globalmente.
