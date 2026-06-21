/**
 * Backup & Restore utilities for Stringo
 * 
 * Provides functions to export/import all localStorage data
 * for backup and restore purposes.
 */

/**
 * Backup data structure containing all localStorage data
 */
export interface BackupData {
  /** Schema version for future compatibility */
  version: string;
  /** Application identifier */
  app: string;
  /** ISO 8601 timestamp of when backup was created */
  timestamp: string;
  /** All localStorage key-value pairs */
  data: Record<string, string>;
}

/**
 * Validation result for backup data
 */
export interface ValidationResult {
  /** Whether the backup is valid */
  valid: boolean;
  /** Error code if invalid */
  error?: BackupError;
  /** Warnings for non-critical issues */
  warnings?: string[];
}

/**
 * Backup error codes for translation
 */
export type BackupError = 
  | 'INVALID_FILE_TYPE'
  | 'INVALID_JSON'
  | 'READ_ERROR'
  | 'NOT_OBJECT'
  | 'WRONG_APP'
  | 'NO_VERSION'
  | 'NO_DATA'
  | 'NEWER_VERSION'
  | 'STORAGE_FULL';

/** Current backup schema version */
const BACKUP_VERSION = "1.0.0";

/** Application identifier */
const APP_NAME = "stringo";

/**
 * Export all localStorage data to a Blob
 * 
 * @returns Blob containing JSON backup data
 */
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

/**
 * Import backup data from a File
 */
export async function importData(file: File): Promise<BackupData> {
  return new Promise((resolve, reject) => {
    if (!file.name.endsWith('.json')) {
      reject(new BackupImportError('INVALID_FILE_TYPE'));
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        const validation = validateBackup(data);
        
        if (!validation.valid) {
          reject(new BackupImportError(validation.error!));
          return;
        }
        
        resolve(data as BackupData);
      } catch {
        reject(new BackupImportError('INVALID_JSON'));
      }
    };
    
    reader.onerror = () => {
      reject(new BackupImportError('READ_ERROR'));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Custom error class for backup operations
 */
export class BackupImportError extends Error {
  code: BackupError;
  
  constructor(code: BackupError) {
    super(code);
    this.code = code;
    this.name = 'BackupImportError';
  }
}

/**
 * Validate backup data structure and content
 */
export function validateBackup(data: unknown): ValidationResult {
  const warnings: string[] = [];
  
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'NOT_OBJECT' };
  }
  
  const backup = data as Record<string, unknown>;
  
  if (backup.app !== APP_NAME) {
    return { valid: false, error: 'WRONG_APP' };
  }
  
  if (!backup.version || typeof backup.version !== 'string') {
    return { valid: false, error: 'NO_VERSION' };
  }
  
  if (!backup.timestamp || typeof backup.timestamp !== 'string') {
    warnings.push('NO_TIMESTAMP');
  }
  
  if (!backup.data || typeof backup.data !== 'object') {
    return { valid: false, error: 'NO_DATA' };
  }
  
  const [major] = backup.version.split('.').map(Number);
  const [currentMajor] = BACKUP_VERSION.split('.').map(Number);
  
  if (major < currentMajor) {
    warnings.push('OLD_VERSION');
  }
  
  if (major > currentMajor) {
    return { valid: false, error: 'NEWER_VERSION' };
  }
  
  return { valid: true, warnings };
}

/**
 * Apply backup data to localStorage
 */
export async function applyBackup(data: BackupData): Promise<void> {
  try {
    localStorage.clear();
    
    for (const [key, value] of Object.entries(data.data)) {
      localStorage.setItem(key, value);
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      throw new BackupImportError('STORAGE_FULL');
    }
    throw error;
  }
}

/**
 * Download a Blob as a file
 */
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

/**
 * Generate a backup filename with current date
 */
export function generateBackupFilename(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `stringo-backup-${year}-${month}-${day}.json`;
}
