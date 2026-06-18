"use client";
import React, { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import styles from './editor.module.css';

interface Props {
  onImageSelected: (file: File) => void;
  disabled?: boolean;
  hasImage?: boolean;
  previewUrl?: string | null;
}

/**
 * Componente de carga de imagen (Paso 1).
 * Estático (no colapsable) por definición UX.
 * Al cargarse una foto, se contrae a una vista previa compacta con opción a cambiarla.
 */
export function ImageUploader({ onImageSelected, disabled, hasImage, previewUrl }: Props) {
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

  // Renderizar estado de vista previa compacto una vez que se tiene una imagen cargada
  if (hasImage && previewUrl) {
    return (
      <div className={styles.panel} style={{ padding: '12px 16px', opacity: disabled ? 0.6 : 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '8px',
            overflow: 'hidden',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            flexShrink: 0,
            background: '#0a0a0a'
          }}>
            <img 
              src={previewUrl} 
              alt="Preview" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>
              {t('uploadTitle')}
            </span>
            <span style={{ fontSize: '0.8rem', color: '#888' }}>
              {t('imageLoaded')}
            </span>
            <button
              onClick={triggerFileInput}
              disabled={disabled}
              className={`${styles.button} ${styles.buttonOutline}`}
              style={{
                padding: '4px 12px',
                fontSize: '0.75rem',
                width: 'fit-content',
                minWidth: 'auto',
                height: 'auto',
                margin: 0
              }}
            >
              {t('changeImage')}
            </button>
          </div>
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          ref={fileInputRef}
          style={{ display: 'none' }}
        />
      </div>
    );
  }

  return (
    <div className={styles.panel} style={disabled ? { opacity: 0.6 } : undefined}>
      <div className={styles.panelHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none' }}>
        <h3 className={styles.panelHeaderTitle} style={{ fontSize: '1.05rem', fontWeight: 600, margin: 0 }}>
          {t('uploadTitle')}
        </h3>
      </div>
      <div className={styles.panelContent} style={{ marginTop: '12px' }}>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          ref={fileInputRef}
          style={{ display: 'none' }}
        />
        
        {/* Área de drop para desktop */}
        <div
          className={`${styles.dropZone} ${isDragActive ? styles.dragActive : ''}`}
          onClick={disabled ? undefined : triggerFileInput}
          onDragOver={disabled ? undefined : handleDragOver}
          onDragLeave={disabled ? undefined : handleDragLeave}
          onDrop={disabled ? undefined : handleDrop}
          style={disabled ? { cursor: 'not-allowed' } : undefined}
        >
          {t('dropOrSelectImage')}
        </div>

        {/* Botón tradicional para mobile */}
        <button
          className={`${styles.button} ${styles.mobileOnly}`}
          onClick={triggerFileInput}
          disabled={disabled}
          style={{ width: '100%' }}
        >
          {t('selectImage')}
        </button>
      </div>
    </div>
  );
}

