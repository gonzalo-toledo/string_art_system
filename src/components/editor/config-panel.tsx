"use client";
import React from 'react';
import { useTranslations } from 'next-intl';
import { AlgorithmParams } from '../../core/algorithm/types';
import { CollapsiblePanel } from './collapsible-panel';
import { DragSlider } from './drag-slider';
import styles from './editor.module.css';

interface Props {
  params: AlgorithmParams;
  onChange: (params: AlgorithmParams) => void;
  disabled?: boolean;
}

/**
 * Panel de configuración del algoritmo.
 * Expone sliders para ajustar la cantidad de líneas y pines.
 * Envuelto en un componente colapsable.
 */
export function ConfigPanel({ params, onChange, disabled }: Props) {
  const t = useTranslations('Editor');

  return (
    <CollapsiblePanel title={t('settingsTitle')} defaultOpen={true}>
      <div className={styles.formGroup}>
        <label>{t('lines')}: {params.maxIterations}</label>
        <DragSlider
          value={params.maxIterations}
          min={1000}
          max={5000}
          step={100}
          onChange={(val) => onChange({ ...params, maxIterations: val })}
          disabled={disabled}
        />
      </div>

      <div className={styles.formGroup} style={{ marginTop: '12px' }}>
        <label>
          <span>{t('pins')}</span>
          <span style={{ fontWeight: 'bold', color: 'var(--color-accent)' }}>{params.totalPins}</span>
        </label>
        <p className={styles.panelDescription}>
          {t('fixedPinsDesc')}
        </p>
      </div>
    </CollapsiblePanel>
  );
}
