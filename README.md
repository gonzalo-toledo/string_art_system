# Stringo: Generador de String Art

Aplicación web mobile-first para Stringo (stringo.ar) que genera patrones de String Art a partir de fotografías. El sistema calcula la secuencia óptima de hilos entre pines distribuidos en un tablero circular y produce una animación visual, PDF instructivo y audio guía.

---

## 🚀 Características Clave

- **Algoritmo Greedy (Client-side):** Ejecución 100% en el browser utilizando Web Workers para no bloquear la interfaz principal.
- **Audio Guía Dinámica:** Instrucciones paso a paso asistidas por voz usando la Web Speech API nativa.
- **Diseño Mobile-First & Dark-Only:** Interfaz pensada para operarse cómodamente con una sola mano en pantallas táctiles.
- **Internacionalización (i18n):** Traducción completa a Español (principal), Inglés y Portugués utilizando `next-intl`.
- **Persistencia Local:** Autoguardado automático en `localStorage` para retomar el trabajo en cualquier momento.

---

## 🛠️ Stack Tecnológico

- **Framework:** Next.js 14 (App Router)
- **Lenguaje:** TypeScript (Strict Mode)
- **Estilos:** Vanilla CSS con variables CSS (Design Tokens)
- **Cálculo:** HTML5 Canvas API + Bresenham Algorithm en Web Workers
- **Tests:** Jest + ts-jest

---

## ⚙️ Desarrollo Local

### 1. Requisitos Previos

Asegurate de tener instalados Node.js (versión 18 o superior) y npm.

### 2. Instalación de Dependencias

```bash
npm install
```

### 3. Levantar Servidor de Desarrollo

Iniciá el servidor de desarrollo local en `http://localhost:3000`:

```bash
npm run dev
```

### 4. Compilar para Producción

Para compilar la aplicación optimizada para producción:

```bash
npm run build
```

### 5. Correr los Tests

Para ejecutar las pruebas unitarias y de integración del algoritmo:

```bash
npm run test
```

---

## 🧠 Flujo de Memoria Colaborativa (Engram + Git)

Para mantener los agentes de IA sincronizados con el mismo contexto y aprendizajes del equipo, compartimos la memoria de Engram a través de Git usando la carpeta `.engram/` como puente.

### Para SUBIR tu memoria (antes de hacer commit):
Exportá tus nuevos descubrimientos locales para que se sumen a la carpeta `.engram/` del repositorio:
```bash
engram sync
git add .engram/
git commit -m "chore: sync engram memory"
```

### Para BAJAR la memoria del equipo (después de hacer pull):
Una vez descargados los cambios de Git, inyectá los archivos de `.engram/` en tu base de datos local:
```bash
git pull
engram sync --import
```

> [!NOTE]
> No hay necesidad de configurar usuarios manualmente. Al ejecutar `engram sync`, el sistema "firma" automáticamente cada archivo con tu nombre de usuario del sistema operativo (`created_by`), evitando colisiones y manteniendo la trazabilidad de quién descubrió qué.

---

Para más detalles sobre la arquitectura del proyecto, el algoritmo Greedy, el sistema de diseño y las convenciones de código, consultar [agents.md](./agents.md).
