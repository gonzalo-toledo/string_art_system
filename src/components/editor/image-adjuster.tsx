"use client";
import React from 'react';
import { ImageAdjustments, CropTransform } from '../../utils/imageAdjustments';
import styles from './editor.module.css';

interface Props {
  adjustments: ImageAdjustments;
  crop: CropTransform;
  onAdjustmentsChange: (adj: ImageAdjustments) => void;
  onCropChange: (crop: CropTransform) => void;
  onReset: () => void;
  disabled: boolean;
}

interface SliderConfig {
  key: keyof ImageAdjustments;
  label: string;
  min: number;
  max: number;
  step: number;
}

const SLIDERS: SliderConfig[] = [
  { key: 'brightness',  label: 'Brillo',     min: -100, max: 100, step: 1 },
  { key: 'contrast',    label: 'Contraste',  min: -100, max: 100, step: 1 },
  { key: 'whites',      label: 'Blancos',    min: -100, max: 100, step: 1 },
  { key: 'blacks',      label: 'Negros',     min: -100, max: 100, step: 1 },
  { key: 'sharpness',   label: 'Nitidez',    min: 0,    max: 100, step: 1 },
];

export function ImageAdjuster({ adjustments, crop, onAdjustmentsChange, onCropChange, onReset, disabled }: Props) {
  const handleSliderChange = (key: keyof ImageAdjustments, value: number) => {
    onAdjustmentsChange({ ...adjustments, [key]: value });
  };

  const handleCropChange = (key: keyof CropTransform, value: number) => {
    onCropChange({ ...crop, [key]: value });
  };

  return (
    <div className={styles.panel}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 style={{ margin: 0 }}>Ajustes de Imagen</h3>
        <button
          onClick={onReset}
          disabled={disabled}
          style={{
            background: 'none',
            border: '1px solid #ccc',
            borderRadius: '4px',
            padding: '4px 10px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontSize: '0.8rem',
            color: '#666',
          }}
        >
          Reset
        </button>
      </div>

      {SLIDERS.map(({ key, label, min, max, step }) => (
        <div key={key} className={styles.formGroup} style={{ marginBottom: '10px' }}>
          <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <span>{label}</span>
            <span style={{ fontFamily: 'monospace', color: '#888' }}>{adjustments[key]}</span>
          </label>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={adjustments[key]}
            onChange={(e) => handleSliderChange(key, parseFloat(e.target.value))}
            disabled={disabled}
            style={{ width: '100%', accentColor: 'var(--color-primary)' }}
          />
        </div>
      ))}

      <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '12px 0' }} />

      <div className={styles.formGroup} style={{ marginBottom: '10px' }}>
        <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
          <span>Zoom</span>
          <span style={{ fontFamily: 'monospace', color: '#888' }}>{crop.zoom.toFixed(2)}x</span>
        </label>
        <input
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={crop.zoom}
          onChange={(e) => handleCropChange('zoom', parseFloat(e.target.value))}
          disabled={disabled}
          style={{ width: '100%', accentColor: 'var(--color-primary)' }}
        />
      </div>

      <div className={styles.formGroup} style={{ marginBottom: '10px' }}>
        <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
          <span>Posición X</span>
          <span style={{ fontFamily: 'monospace', color: '#888' }}>{crop.offsetX.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={-1}
          max={1}
          step={0.02}
          value={crop.offsetX}
          onChange={(e) => handleCropChange('offsetX', parseFloat(e.target.value))}
          disabled={disabled}
          style={{ width: '100%', accentColor: 'var(--color-primary)' }}
        />
      </div>

      <div className={styles.formGroup} style={{ marginBottom: '10px' }}>
        <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
          <span>Posición Y</span>
          <span style={{ fontFamily: 'monospace', color: '#888' }}>{crop.offsetY.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min={-1}
          max={1}
          step={0.02}
          value={crop.offsetY}
          onChange={(e) => handleCropChange('offsetY', parseFloat(e.target.value))}
          disabled={disabled}
          style={{ width: '100%', accentColor: 'var(--color-primary)' }}
        />
      </div>
    </div>
  );
}
