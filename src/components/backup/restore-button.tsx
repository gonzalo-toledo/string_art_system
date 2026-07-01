'use client';

import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Upload, AlertCircle } from '@/components/shared/icons';
import { importData, applyBackup, BackupImportError, BackupError } from '@/utils/backup';

/**
 * Restore button component for importing localStorage backup
 */
interface RestoreButtonProps {
  onRestoreComplete?: () => void;
  onRestoreError?: (error: Error) => void;
}

export function RestoreButton({ 
  onRestoreComplete,
  onRestoreError 
}: RestoreButtonProps) {
  const t = useTranslations('Editor');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getErrorMessage = (err: Error): string => {
    if (err instanceof BackupImportError) {
      const errorKey = `restoreError${err.code}` as const;
      // Try to get translation, fallback to code if not found
      try {
        return t(errorKey);
      } catch {
        return err.code;
      }
    }
    return t('restoreErrorGeneric');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setStatus('loading');
      setError(null);
      
      const data = await importData(file);
      await applyBackup(data);
      
      onRestoreComplete?.();
      window.location.reload();
    } catch (err) {
      const errorMessage = getErrorMessage(err as Error);
      setError(errorMessage);
      setStatus('error');
      onRestoreError?.(err as Error);
      
      setTimeout(() => {
        setError(null);
        setStatus('idle');
      }, 5000);
    } finally {
      setStatus('idle');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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
        aria-describedby="restore-description"
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
            {t('restoreLoading')}
          </>
        ) : (
          <>
            <Upload size={16} />
            {t('restoreButton')}
          </>
        )}
      </label>
      
      <span id="restore-description" className="sr-only">
        {t('restoreDescription')}
      </span>

      {error && (
        <div className="restore-error" role="alert">
          <AlertCircle size={16} />
          {error}
        </div>
      )}
    </>
  );
}
