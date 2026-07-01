# Proposal: Backup & Restore de Progreso

## Intent
Proveer a los usuarios de Stringo la capacidad de descargar y restaurar su progreso completo de la aplicación, resolviendo el problema de pérdida de datos en dispositivos Apple donde iOS limpia localStorage agresivamente.

## Problem Statement
Los usuarios están perdiendo su progreso de sesiones guiadas porque:
1. iOS limpia localStorage agresivamente en dispositivos con bajo almacenamiento
2. Safari Private Browsing puede bloquear o limpiar localStorage
3. No hay mecanismo de recuperación cuando los datos se pierden

**Impacto**: Usuarios que completan cuadros en más de una semana pierden todo su progreso.

## Scope

### In-Scope
- Botón "Descargar Progreso" en el header del modo guiado
- Botón "Restaurar desde Archivo" en la pantalla principal cuando no hay sesión activa
- Exportación de TODOS los datos de localStorage a archivo JSON
- Importación de archivo JSON y restauración completa del estado
- Manejo de errores robusto para operaciones de archivos
- Schema versioning para compatibilidad futura

### Out-of-Scope
- Sincronización entre dispositivos (requiere backend)
- Backup automático en la nube
- Migración de formatos anteriores

## Business Rules
1. El archivo de backup debe incluir TODOS los datos de localStorage de la app
2. El archivo debe ser un JSON con metadata (versión, timestamp, nombre de app)
3. La restauración debe reemplazar completamente el localStorage actual
4. El usuario debe recibir confirmación antes de restaurar (puede sobrescribir datos existentes)
5. Los botones deben ser accesibles y visibles en los contextos correctos

## Current State
- **localStorage keys**: 4 keys (`hacelo-art-session`, `hacelo-art-speech-enabled`, `stringo-editor-state`, `has_seen_gesture_hint`)
- **Error handling**: Lecturas tienen try/catch, escrituras NO
- **UI**: Guided mode tiene header con acciones, editor tiene sidebar con panel "proyecto en progreso"
- **Icons**: `Download` ya existe, necesita `Upload` o `FolderOpen`

## Proposed Solution

### 1. Utilidad de Backup (`src/utils/backup.ts`)
- `exportAllData(): Blob` - Exporta todo localStorage a JSON con metadata
- `importData(file: File): Promise<void>` - Importa y restaura desde archivo
- `hasActiveSession(): boolean` - Verifica si hay sesión activa

### 2. UI en Modo Guiado (`guide-header.tsx`)
- Agregar botón "Descargar Progreso" en `headerActions`
- Icono: Download (ya existe)
- Tooltip: "Descargar copia de seguridad"

### 3. UI en Pantalla Principal (`page.tsx`)
- Agregar "Restaurar desde Archivo" cuando NO hay sesión activa
- Ubicación: debajo del splash/call-to-action principal
- Estilo: botón secundario discreto

### 4. Manejo de Errores
- Try/catch en todas las operaciones de escritura a localStorage
- Mensajes de error claros para el usuario
- Fallbacks apropiados

## Risk Assessment
- **Bajo riesgo**: Cambios son aditivos, no modifican comportamiento existente
- **Consideración**: Archivos de backup grandes (>50KB) pueden confundir usuarios
- **Mitigación**: Incluir nombre legible y timestamp en el nombre del archivo

## Success Criteria
1. Usuario puede descargar backup que incluye todos los datos de la app
2. Usuario puede restaurar desde archivo y recuperar sesión exactamente donde la dejó
3. La UI es intuitiva y no interfiere con el flujo normal
4. Los errores se manejan gracefully con mensajes claros
5. Los tests cubren las nuevas utilidades

## Dependencies
- Ninguna dependencia externa nueva
- Usa APIs nativas del navegador (File API, Blob, FileReader)
