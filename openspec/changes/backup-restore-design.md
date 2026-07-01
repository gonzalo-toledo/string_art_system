# Design: Backup & Restore de Progreso

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        UI Layer                             │
├─────────────────────────────────────────────────────────────┤
│  GuideHeader          │  HomePage                           │
│  ┌──────────────┐     │  ┌─────────────────────────────┐   │
│  │ [📥 Backup]  │     │  │ [Restaurar desde Archivo]   │   │
│  └──────┬───────┘     │  └──────────────┬──────────────┘   │
│         │             │                 │                   │
├─────────┼─────────────┼─────────────────┼───────────────────┤
│         │             │                 │                   │
│  ┌──────▼─────────────▼─────────────────▼──────────────┐   │
│  │              BackupService (utils/backup.ts)         │   │
│  │  - exportAllData(): Blob                            │   │
│  │  - importData(file): Promise<BackupData>            │   │
│  │  - validateBackup(data): ValidationResult           │   │
│  │  - applyBackup(data): Promise<void>                 │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                   │
├─────────────────────────┼───────────────────────────────────┤
│                         │                                   │
│  ┌──────────────────────▼──────────────────────────────┐   │
│  │              Browser Storage Layer                   │   │
│  │  - localStorage.getItem(key)                        │   │
│  │  - localStorage.setItem(key, value)                 │   │
│  │  - localStorage.removeItem(key)                     │   │
│  │  - localStorage.length                              │   │
│  │  - localStorage.key(index)                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Component Design

### 1. BackupService (`src/utils/backup.ts`)

**Responsibilities:**
- Serializar/deserializar datos de localStorage
- Validar estructura de backups
- Manejar errores de archivos
- Gestionar descarga y selección de archivos

**API:**

```typescript
// Types
interface BackupData {
  version: string;
  app: string;
  timestamp: string;
  data: Record<string, string>;
}

interface ValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
}

// Functions
export function exportAllData(): Blob;
export async function importData(file: File): Promise<BackupData>;
export function validateBackup(data: unknown): ValidationResult;
export function applyBackup(data: BackupData): Promise<void>;
export function downloadBackup(blob: Blob, filename?: string): void;
export function generateBackupFilename(): string;
```

**Implementation Details:**

```typescript
// src/utils/backup.ts

const BACKUP_VERSION = "1.0.0";
const APP_NAME = "stringo";

export function exportAllData(): Blob {
  const data: BackupData = {
    version: BACKUP_VERSION,
    app: APP_NAME,
    timestamp: new Date().toISOString(),
    data: {}
  };

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key);
      if (value !== null) {
        data.data[key] = value;
      }
    }
  }

  return new Blob([JSON.stringify(data, null, 2)], { 
    type: "application/json" 
  });
}

export async function importData(file: File): Promise<BackupData> {
  return new Promise((resolve, reject) => {
    if (!file.name.endsWith('.json')) {
      reject(new Error("El archivo debe ser un JSON"));
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        const validation = validateBackup(data);
        
        if (!validation.valid) {
          reject(new Error(validation.error));
          return;
        }
        
        resolve(data as BackupData);
      } catch {
        reject(new Error("El archivo no es un JSON válido"));
      }
    };
    
    reader.onerror = () => {
      reject(new Error("No se pudo leer el archivo"));
    };
    
    reader.readAsText(file);
  });
}

export function validateBackup(data: unknown): ValidationResult {
  const warnings: string[] = [];
  
  if (!data || typeof data !== 'object') {
    return { valid: false, error: "El archivo no es un objeto válido" };
  }
  
  const backup = data as Record<string, unknown>;
  
  if (backup.app !== APP_NAME) {
    return { valid: false, error: "Este archivo no es un backup de Stringo" };
  }
  
  if (!backup.version || typeof backup.version !== 'string') {
    return { valid: false, error: "Backup sin versión" };
  }
  
  if (!backup.timestamp || typeof backup.timestamp !== 'string') {
    warnings.push("Backup sin timestamp");
  }
  
  if (!backup.data || typeof backup.data !== 'object') {
    return { valid: false, error: "Backup sin datos" };
  }
  
  // Check version compatibility
  const [major] = backup.version.split('.').map(Number);
  const [currentMajor] = BACKUP_VERSION.split('.').map(Number);
  
  if (major < currentMajor) {
    warnings.push(`Backup de versión ${backup.version} (actual: ${BACKUP_VERSION})`);
  }
  
  if (major > currentMajor) {
    return { valid: false, error: "Este backup es de una versión más reciente" };
  }
  
  return { valid: true, warnings };
}

export async function applyBackup(data: BackupData): Promise<void> {
  try {
    // Clear existing data first
    localStorage.clear();
    
    // Apply all data from backup
    for (const [key, value] of Object.entries(data.data)) {
      localStorage.setItem(key, value);
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      throw new Error("No hay espacio suficiente para restaurar los datos");
    }
    throw error;
  }
}

export function downloadBackup(blob: Blob, filename?: string): void {
  const name = filename || generateBackupFilename();
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

export function generateBackupFilename(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `stringo-backup-${year}-${month}-${day}.json`;
}
```

### 2. BackupButton Component (`src/components/shared/backup-button.tsx`)

**Props:**

```typescript
interface BackupButtonProps {
  variant?: 'icon' | 'full';
  onBackupComplete?: () => void;
  onBackupError?: (error: Error) => void;
}
```

**Implementation:**

```typescript
// src/components/shared/backup-button.tsx
'use client';

import { useState } from 'react';
import { Download, Check, AlertCircle } from '@/components/shared/icons';
import { exportAllData, downloadBackup } from '@/utils/backup';

interface BackupButtonProps {
  variant?: 'icon' | 'full';
  onBackupComplete?: () => void;
  onBackupError?: (error: Error) => void;
}

export function BackupButton({ 
  variant = 'icon', 
  onBackupComplete,
  onBackupError 
}: BackupButtonProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleBackup = async () => {
    try {
      setStatus('loading');
      const blob = exportAllData();
      downloadBackup(blob);
      setStatus('success');
      onBackupComplete?.();
      
      // Reset status after 2 seconds
      setTimeout(() => setStatus('idle'), 2000);
    } catch (error) {
      setStatus('error');
      onBackupError?.(error as Error);
      
      // Reset status after 3 seconds
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  if (variant === 'full') {
    return (
      <button
        onClick={handleBackup}
        disabled={status === 'loading'}
        className="backup-button backup-button--full"
        aria-label="Descargar copia de seguridad"
      >
        {status === 'loading' && (
          <>
            <span className="backup-button__spinner" />
            Descargando...
          </>
        )}
        {status === 'success' && (
          <>
            <Check size={16} />
            ¡Descargado!
          </>
        )}
        {status === 'error' && (
          <>
            <AlertCircle size={16} />
            Error al descargar
          </>
        )}
        {status === 'idle' && (
          <>
            <Download size={16} />
            Descargar Backup
          </>
        )}
      </button>
    );
  }

  // Icon variant for header
  return (
    <button
      onClick={handleBackup}
      disabled={status === 'loading'}
      className="icon-button"
      aria-label="Descargar copia de seguridad"
      title="Descargar copia de seguridad"
    >
      {status === 'loading' && <span className="icon-button__spinner" />}
      {status === 'success' && <Check size={18} />}
      {status === 'error' && <AlertCircle size={18} />}
      {status === 'idle' && <Download size={18} />}
    </button>
  );
}
```

### 3. RestoreButton Component (`src/components/shared/restore-button.tsx`)

**Props:**

```typescript
interface RestoreButtonProps {
  onRestoreComplete?: () => void;
  onRestoreError?: (error: Error) => void;
}
```

**Implementation:**

```typescript
// src/components/shared/restore-button.tsx
'use client';

import { useState, useRef } from 'react';
import { Upload, AlertCircle } from '@/components/shared/icons';
import { importData, applyBackup } from '@/utils/backup';

interface RestoreButtonProps {
  onRestoreComplete?: () => void;
  onRestoreError?: (error: Error) => void;
}

export function RestoreButton({ 
  onRestoreComplete,
  onRestoreError 
}: RestoreButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [backupInfo, setBackupInfo] = useState<{
    timestamp: string;
    keyCount: number;
  } | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setStatus('loading');
      setError(null);
      
      const data = await importData(file);
      
      setBackupInfo({
        timestamp: data.timestamp,
        keyCount: Object.keys(data.data).length
      });
      setShowConfirm(true);
    } catch (err) {
      setError((err as Error).message);
      setStatus('error');
    } finally {
      setStatus('idle');
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleConfirmRestore = async () => {
    if (!backupInfo) return;

    try {
      setStatus('loading');
      
      // Re-import to get full data
      const file = fileInputRef.current?.files?.[0];
      if (!file) throw new Error("No se encontró el archivo");
      
      const data = await importData(file);
      await applyBackup(data);
      
      setShowConfirm(false);
      onRestoreComplete?.();
      
      // Reload page to reflect changes
      window.location.reload();
    } catch (err) {
      setError((err as Error).message);
      setStatus('error');
      onRestoreError?.(err as Error);
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setBackupInfo(null);
    setError(null);
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileSelect}
        className="sr-only"
        id="restore-file-input"
      />
      
      <label
        htmlFor="restore-file-input"
        className="restore-button"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
      >
        {status === 'loading' ? (
          <>
            <span className="restore-button__spinner" />
            Cargando...
          </>
        ) : (
          <>
            <Upload size={16} />
            Restaurar desde Archivo
          </>
        )}
      </label>

      {error && (
        <div className="restore-error" role="alert">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {showConfirm && backupInfo && (
        <div className="restore-confirm-overlay">
          <div className="restore-confirm-modal" role="dialog" aria-modal="true">
            <h3>¿Restaurar backup?</h3>
            
            <div className="restore-confirm-info">
              <p>
                <strong>Fecha del backup:</strong>{' '}
                {new Date(backupInfo.timestamp).toLocaleString('es-AR')}
              </p>
              <p>
                <strong>Datos a restaurar:</strong>{' '}
                {backupInfo.keyCount} elementos
              </p>
            </div>
            
            <p className="restore-confirm-warning">
              Esto reemplazará todos los datos actuales de la aplicación.
            </p>
            
            <div className="restore-confirm-actions">
              <button
                onClick={handleCancel}
                className="restore-confirm-cancel"
                disabled={status === 'loading'}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmRestore}
                className="restore-confirm-accept"
                disabled={status === 'loading'}
              >
                {status === 'loading' ? 'Restaurando...' : 'Sí, restaurar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

### 4. Integration Points

#### GuideHeader (`src/components/guide/guide-header.tsx`)

Add BackupButton to headerActions:

```typescript
// In guide-header.tsx, add to imports:
import { BackupButton } from '@/components/shared/backup-button';

// In headerActions, add after List button:
<div className="header-actions">
  {/* Existing buttons */}
  <button onClick={toggleSpeech} className="icon-button">
    {speechEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
  </button>
  
  <button onClick={openVisualizer} className="icon-button">
    <Eye size={18} />
  </button>
  
  <button onClick={openSequenceList} className="icon-button">
    <List size={18} />
  </button>
  
  {/* NEW: Backup button */}
  <BackupButton variant="icon" />
</div>
```

#### HomePage (`src/app/[locale]/page.tsx`)

Add RestoreButton when no session active:

```typescript
// In page.tsx, add to imports:
import { RestoreButton } from '@/components/shared/restore-button';

// After the main CTA button, add:
<div className="home-actions">
  <Link href="/editor" className="home-cta">
    Subir Foto para Comenzar
  </Link>
  
  {/* NEW: Restore option */}
  <div className="home-restore">
    <span className="home-restore-divider">o</span>
    <RestoreButton onRestoreComplete={() => window.location.reload()} />
  </div>
</div>
```

### 5. CSS Styles

```css
/* Backup Button Styles */
.backup-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.backup-button--full {
  background: var(--color-primary);
  color: white;
}

.backup-button--full:hover:not(:disabled) {
  background: var(--color-primary-dark);
}

.backup-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.backup-button__spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
}

/* Restore Button Styles */
.restore-button {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border: 2px dashed var(--color-border);
  border-radius: 0.5rem;
  background: transparent;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.restore-button:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-light);
}

.restore-button:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-focus);
}

/* Restore Error */
.restore-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: var(--color-error-light);
  color: var(--color-error);
  border-radius: 0.375rem;
  font-size: 0.8125rem;
}

/* Restore Confirm Modal */
.restore-confirm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.restore-confirm-modal {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.restore-confirm-modal h3 {
  margin: 0 0 1rem 0;
  font-size: 1.125rem;
  font-weight: 600;
}

.restore-confirm-info {
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: var(--color-background);
  border-radius: 0.375rem;
}

.restore-confirm-info p {
  margin: 0.25rem 0;
  font-size: 0.875rem;
}

.restore-confirm-warning {
  margin-bottom: 1.5rem;
  padding: 0.75rem;
  background: var(--color-warning-light);
  color: var(--color-warning-dark);
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.restore-confirm-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.restore-confirm-cancel,
.restore-confirm-accept {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
}

.restore-confirm-cancel {
  background: var(--color-background);
  color: var(--color-text);
}

.restore-confirm-accept {
  background: var(--color-primary);
  color: white;
}

.restore-confirm-accept:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Home Restore Styles */
.home-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.home-restore {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.home-restore-divider {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

/* Spinner Animation */
@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Screen Reader Only */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

## File Structure

```
src/
├── utils/
│   └── backup.ts                    # NEW: Backup utility functions
├── components/
│   ├── shared/
│   │   ├── backup-button.tsx        # NEW: Export button component
│   │   └── restore-button.tsx       # NEW: Import button component
│   └── guide/
│       └── guide-header.tsx         # MODIFIED: Add BackupButton
└── app/
    └── [locale]/
        └── page.tsx                 # MODIFIED: Add RestoreButton
```

## Migration Strategy

Since this is a new feature with no existing backups, no migration is needed. The version field in BackupData ensures future compatibility.

## Performance Considerations

- **Export**: O(n) where n = number of localStorage keys (typically 4-10 items)
- **Import**: O(n) + JSON parse time
- **Memory**: Backup files will be small (< 100KB typically)
- **No blocking**: All operations are async where possible

## Testing Strategy

### Unit Tests
- `backup.test.ts`: Test export, import, validation, apply functions
- `backup-button.test.tsx`: Test button states and interactions
- `restore-button.test.tsx`: Test file selection, validation, confirmation flow

### Integration Tests
- Full backup/restore cycle
- Error handling scenarios
- UI component integration

### E2E Tests
- Download backup in guided mode
- Restore backup from home page
- Verify data persistence after restore
