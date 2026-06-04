"use client";
import React, { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { CollapsiblePanel } from './collapsible-panel';
import styles from './editor.module.css';

interface Props {
  onImageSelected: (file: File) => void;
  disabled?: boolean;
}

/**
 * Componente de carga de imagen.
 * En desktop: muestra un área de drag & drop.
 * En mobile: mantiene el botón de selección tradicional.
 */
export function ImageUploader({ onImageSelected, disabled }: Props) {
  const t = useTranslations('Editor');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageSelected(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onImageSelected(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
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
      
      {/* Área de drop para desktop */}
      <div
        className={`${styles.dropZone} ${isDragActive ? styles.dragActive : ''}`}
        onClick={triggerFileInput}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {t('dropOrSelectImage')}
      </div>

      {/* Botón tradicional para mobile */}
      <button
        className={`${styles.button} ${styles.mobileOnly}`}
        onClick={triggerFileInput}
        disabled={disabled}
      >
        {t('selectImage')}
      </button>
    </CollapsiblePanel>
  );
}
