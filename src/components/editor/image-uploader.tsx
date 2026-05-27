"use client";
import React, { useRef } from 'react';
import { useTranslations } from 'next-intl';
import styles from './editor.module.css';

interface Props {
  onImageSelected: (file: File) => void;
  disabled?: boolean;
}

/**
 * Componente de carga de imagen.
 * Renderiza un botón que abre el selector de archivos del sistema.
 * Solo acepta PNG y JPEG.
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
    <div className={styles.panel}>
      <h3>{t('uploadTitle')}</h3>
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
    </div>
  );
}
