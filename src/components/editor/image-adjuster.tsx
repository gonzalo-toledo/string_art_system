"use client";
import React from 'react';
import { useTranslations } from 'next-intl';
import { ImageAdjustments, CropTransform } from '../../utils/image-adjustments';
import { CollapsiblePanel } from './collapsible-panel';
import { DragSlider } from './drag-slider';
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
          <label>
            <span>{t(labelKey)}</span>
            <span style={{ fontFamily: 'monospace', color: '#888' }}>{adjustments[key]}</span>
          </label>
          <DragSlider
            value={adjustments[key]}
            min={min}
            max={max}
            step={step}
            onChange={(val) => handleSliderChange(key, val)}
            disabled={disabled}
          />
        </div>
      ))}

      <div className={styles.desktopOnly}>
        <hr style={{ border: 'none', borderTop: '1px solid #333', margin: '12px 0' }} />

        {/* Controles de crop: zoom y posición */}
        <div className={styles.formGroup} style={{ marginBottom: '10px' }}>
          <label>
            <span>{t('zoom')}</span>
            <span style={{ fontFamily: 'monospace', color: '#888' }}>{crop.zoom.toFixed(2)}x</span>
          </label>
          <DragSlider
            value={crop.zoom}
            min={1}
            max={3}
            step={0.05}
            onChange={(val) => handleCropChange('zoom', val)}
            disabled={disabled}
          />
        </div>

        <div className={styles.formGroup} style={{ marginBottom: '10px' }}>
          <label>
            <span>{t('positionX')}</span>
            <span style={{ fontFamily: 'monospace', color: '#888' }}>{crop.offsetX.toFixed(2)}</span>
          </label>
          <DragSlider
            value={crop.offsetX}
            min={-1}
            max={1}
            step={0.02}
            onChange={(val) => handleCropChange('offsetX', val)}
            disabled={disabled}
          />
        </div>

        <div className={styles.formGroup} style={{ marginBottom: '10px' }}>
          <label>
            <span>{t('positionY')}</span>
            <span style={{ fontFamily: 'monospace', color: '#888' }}>{crop.offsetY.toFixed(2)}</span>
          </label>
          <DragSlider
            value={crop.offsetY}
            min={-1}
            max={1}
            step={0.02}
            onChange={(val) => handleCropChange('offsetY', val)}
            disabled={disabled}
          />
        </div>
      </div>
    </CollapsiblePanel>
  );
}
