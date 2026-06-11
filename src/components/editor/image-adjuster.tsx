"use client";
import React from 'react';
import { useTranslations } from 'next-intl';
import { ImageAdjustments, CropTransform } from '../../utils/image-adjustments';
import { CollapsiblePanel } from './collapsible-panel';
import styles from './editor.module.css';

interface Props {
  adjustments: ImageAdjustments;
  crop: CropTransform;
  onAdjustmentsChange: (adj: ImageAdjustments) => void;
  onCropChange: (crop: CropTransform) => void;
  onReset: () => void;
  disabled: boolean;
}

// Configuración de cada slider de ajuste (labelKey se resuelve con t())
interface SliderConfig {
  key: keyof ImageAdjustments;
  labelKey: string;
  min: number;
  max: number;
  step: number;
}

// Definición de los sliders de ajuste tonal
const SLIDERS: SliderConfig[] = [
  { key: 'brightness',  labelKey: 'brightness',  min: -100, max: 100, step: 1 },
  { key: 'contrast',    labelKey: 'contrast',    min: -100, max: 100, step: 1 },
  { key: 'whites',      labelKey: 'whites',      min: -100, max: 100, step: 1 },
  { key: 'blacks',      labelKey: 'blacks',      min: -100, max: 100, step: 1 },
  { key: 'sharpness',   labelKey: 'sharpness',   min: 0,    max: 100, step: 1 },
];

/**
 * Panel de ajustes de imagen.
 * Permite modificar brillo, contraste, blancos, negros, nitidez,
 * zoom y posición (crop) de la imagen antes de procesarla.
 * Envuelto en un componente colapsable.
 */
export function ImageAdjuster({ adjustments, crop, onAdjustmentsChange, onCropChange, onReset, disabled }: Props) {
  const t = useTranslations('Editor');

  const handleSliderChange = (key: keyof ImageAdjustments, value: number) => {
    onAdjustmentsChange({ ...adjustments, [key]: value });
  };

  const handleCropChange = (key: keyof CropTransform, value: number) => {
    onCropChange({ ...crop, [key]: value });
  };

  return (
    <CollapsiblePanel
      title={t('adjustmentsTitle')}
      defaultOpen={false}
      headerRight={
        <button
          onClick={onReset}
          disabled={disabled}
          style={{
            background: 'none',
            border: '1px solid #555',
            borderRadius: '6px',
            padding: '4px 10px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            fontSize: '0.8rem',
            color: '#aaa',
            transition: 'border-color 0.2s, color 0.2s'
          }}
          onMouseOver={(e) => { if (!disabled) { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.color = '#fff'; } }}
          onMouseOut={(e) => { e.currentTarget.style.borderColor = '#555'; e.currentTarget.style.color = '#aaa'; }}
        >
          {t('reset')}
        </button>
      }
    >
      {/* Sliders de ajuste tonal */}
      {SLIDERS.map(({ key, labelKey, min, max, step }) => (
        <div key={key} className={styles.formGroup} style={{ marginBottom: '10px' }}>
          <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <span>{t(labelKey)}</span>
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

      <div className={styles.desktopOnly}>
        <hr style={{ border: 'none', borderTop: '1px solid #333', margin: '12px 0' }} />

        {/* Controles de crop: zoom y posición */}
        <div className={styles.formGroup} style={{ marginBottom: '10px' }}>
          <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
            <span>{t('zoom')}</span>
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
            <span>{t('positionX')}</span>
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
            <span>{t('positionY')}</span>
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
    </CollapsiblePanel>
  );
}
