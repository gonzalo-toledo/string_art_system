'use client';

import { useState } from 'react';
import { Download, Check, AlertCircle } from '@/components/shared/icons';
import { exportAllData, downloadBackup } from '@/utils/backup';

/**
 * Backup button component for downloading localStorage backup
 * 
 * @example
 * ```tsx
 * // Icon variant for header
 * <BackupButton variant="icon" />
 * 
 * // Full variant with label
 * <BackupButton variant="full" />
 * ```
 */
interface BackupButtonProps {
  /** Button variant: 'icon' for header, 'full' with label */
  variant?: 'icon' | 'full';
  /** Callback when backup completes successfully */
  onBackupComplete?: () => void;
  /** Callback when backup fails */
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
            Descargar progreso actual
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
