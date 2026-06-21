# Specification: Backup & Restore de Progreso

## Overview
Sistema de respaldo y restauración de datos de la aplicación Stringo que permite a los usuarios descargar una copia de seguridad de todos sus datos locales y restaurarlos desde un archivo.

## User Stories

### US-1: Descargar Backup
**Como** usuario del modo guiado
**Quiero** poder descargar una copia de seguridad de mi progreso
**Para** tener una respaldo por si iOS borra mis datos locales

**Criterios de aceptación:**
- [ ] Botón visible en el header del modo guiado
- [ ] Al hacer click, se descarga un archivo JSON con todos los datos de localStorage
- [ ] El archivo incluye metadata: versión, timestamp, nombre de la app
- [ ] El nombre del archivo es descriptivo: `stringo-backup-YYYY-MM-DD.json`
- [ ] Se muestra confirmación después de la descarga
- [ ] La UI deja claro que la sesión se guarda automáticamente y el backup es precaución adicional

### US-2: Restaurar desde Archivo
**Como** usuario que perdió su progreso
**Quiero** poder restaurar mis datos desde un archivo de backup
**Para** recuperar mi sesión donde la dejé

**Criterios de aceptación:**
- [ ] Botón visible en la pantalla principal cuando NO hay sesión activa
- [ ] Al hacer click, se abre selector de archivos
- [ ] Se valida que el archivo sea JSON válido con el formato correcto
- [ ] Se muestra preview de lo que se va a restaurar (fecha del backup, tamaño)
- [ ] Se pide confirmación antes de restaurar (puede sobrescribir datos existentes)
- [ ] Después de restaurar, la sesión se carga automáticamente
- [ ] Se muestra mensaje de éxito con instrucciones

### US-3: Manejo de Errores
**Como** usuario
**Quiero** recibir mensajes claros cuando algo falla
**Para** entender qué pasó y qué puedo hacer

**Criterios de aceptación:**
- [ ] Error al descargar: mensaje claro + fallback a descarga directa
- [ ] Error al leer archivo: "Archivo no válido o corrupto"
- [ ] Error al restaurar: "No se pudieron restaurar los datos"
- [ ] Archivo con versión incompatible: "Este backup es de una versión anterior"

## Technical Specification

### Data Structure

```typescript
interface BackupData {
  version: string;           // "1.0.0"
  app: string;               // "stringo"
  timestamp: string;         // ISO 8601
  data: {
    [key: string]: string;   // Todos los pares key-value de localStorage
  }
}
```

### LocalStorage Keys to Backup

| Key | Type | Description |
|-----|------|-------------|
| `hacelo-art-session` | JSON | Sesión guiada completa |
| `hacelo-art-speech-enabled` | "true"/"false" | Preferencia de voz |
| `stringo-editor-state` | JSON | Estado del editor |
| `has_seen_gesture_hint` | "true" | Hint de gestos visto |

### UI Components

#### Guide Header (Modo Guiado)
```
┌─────────────────────────────────────────────┐
│ ← Modo Guiado          🔊  👁  📋  📥      │
│                                └─ Backup    │
└─────────────────────────────────────────────┘
```

- **Posición**: Después del botón de lista de secuencia
- **Icono**: Download (ya existe)
- **Tooltip**: "Descargar copia de seguridad"
- **Texto辅助**: Debajo del header o en tooltip: "Tu sesión se guarda automáticamente. Descarga un backup por si acaso."

#### Home Page (Sin Sesión Activa)
```
┌─────────────────────────────────────────────┐
│                                             │
│           [Logo Stringo]                    │
│                                             │
│        [Subir Foto para Comenzar]           │
│                                             │
│     ─────────── o ───────────               │
│                                             │
│     [Restaurar desde Archivo]               │
│     "¿Tenés un backup? Restaurá tu progreso"│
│                                             │
└─────────────────────────────────────────────┘
```

- **Posición**: Debajo del botón principal, con separador visual
- **Estilo**: Botón secundario, texto más pequeño
- **Visibilidad**: Solo cuando NO hay sesión activa

### File Operations

#### Export
```typescript
function exportAllData(): Blob {
  const data: BackupData = {
    version: "1.0.0",
    app: "stringo",
    timestamp: new Date().toISOString(),
    data: {}
  };
  
  // Recopilar todas las keys de localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      data.data[key] = localStorage.getItem(key) || "";
    }
  }
  
  return new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
}
```

#### Import
```typescript
async function importData(file: File): Promise<BackupData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as BackupData;
        
        // Validaciones
        if (data.app !== "stringo") {
          reject(new Error("Este archivo no es un backup de Stringo"));
          return;
        }
        
        if (!data.version || !data.data) {
          reject(new Error("Formato de backup inválido"));
          return;
        }
        
        resolve(data);
      } catch {
        reject(new Error("Archivo JSON inválido o corrupto"));
      }
    };
    reader.onerror = () => reject(new Error("No se pudo leer el archivo"));
    reader.readAsText(file);
  });
}
```

### Error Handling

| Scenario | Error Message | Action |
|----------|---------------|--------|
| Export fails | "No se pudo crear el backup. Intentá de nuevo." | Log error, show toast |
| Import - invalid file | "Este archivo no es un backup válido de Stringo" | Show error dialog |
| Import - corrupt data | "El archivo está corrupto o no se puede leer" | Show error dialog |
| Import - version mismatch | "Este backup es de una versión anterior. Algunos datos podrían no restaurarse." | Show warning, allow continue |
| Import - storage full | "No hay espacio suficiente para restaurar los datos" | Show error, suggest cleanup |
| Import - generic error | "No se pudieron restaurar los datos. Intentá de nuevo." | Log error, show toast |

### Accessibility
- Botones deben ser navegables con teclado
- Tooltips deben ser accesibles por screen readers
- Mensajes de error deben announced by screen readers
- Focus management correcto en modales de confirmación

## Non-Functional Requirements

### Performance
- Export debe completar en < 100ms
- Import debe completar en < 200ms
- No bloquear el UI thread

### Security
- No ejecutar código del archivo importado
- Validar estructura antes de procesar
- Sanitizar datos antes de guardar en localStorage

### Compatibility
- Chrome 90+, Firefox 90+, Safari 14+, Edge 90+
- iOS Safari 14+
- Sin dependencias externas

## Testing Strategy

### Unit Tests
- `exportAllData()` genera JSON válido
- `importData()` valida archivos correctamente
- Manejo de errores en operaciones de archivo

### Integration Tests
- Flujo completo: export → import → verificar datos
- Compatibilidad con versiones futuras del schema

### Manual Tests
- Descargar backup en Safari iOS
- Restaurar backup en diferentes dispositivos
- Probar con archivos corruptos
- Probar con archivos de versiones anteriores
