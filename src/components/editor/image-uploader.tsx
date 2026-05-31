"use client";
import React, { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { CollapsiblePanel } from './collapsible-panel';
import styles from './editor.module.css';

interface Props {
  onImageSelected: (file: File) => void;
  disabled?: boolean;
}

/**
 * Componente de carga de imagen.
 * Envuelto en un componente colapsable para consistencia.
 */
export function ImageUploader({ onImageSelected, disabled }: Props) {
  const t = useTranslations('Editor');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageSelected(file);
    }
  };

  return (
    <CollapsiblePanel title={t('uploadTitle')} defaultOpen={true}>
      <input
        type="file"
        accept="image/png, image/jpeg"
        onChange={handleFileChange}
        ref={fileInputRef}
        style={{ display: 'none' }}
      />
      <button
        className={styles.button}
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
      >
        {t('selectImage')}
      </button>
    </CollapsiblePanel>
  );
}
