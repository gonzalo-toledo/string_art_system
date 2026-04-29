"use client";
import React, { useRef } from 'react';
import styles from './editor.module.css';

interface Props {
  onImageSelected: (file: File) => void;
  disabled?: boolean;
}

export function ImageUploader({ onImageSelected, disabled }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageSelected(file);
    }
  };

  return (
    <div className={styles.panel}>
      <h3>1. Upload Photo</h3>
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
        Select Image
      </button>
    </div>
  );
}
