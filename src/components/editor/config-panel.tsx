"use client";
import React from 'react';
import { useTranslations } from 'next-intl';
import { AlgorithmParams } from '../../core/algorithm/types';
import { CollapsiblePanel } from './collapsible-panel';
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onChange({
      ...params,
      [name]: Number(value)
    });
  };

  return (
    <CollapsiblePanel title={t('settingsTitle')} defaultOpen={true}>
      <div className={styles.formGroup}>
        <label style={{ fontSize: '0.85rem', color: '#aaa' }}>{t('lines')}: {params.maxIterations}</label>
        <input
          type="range" name="maxIterations"
          min="1000" max="5000" step="100"
          value={params.maxIterations} onChange={handleChange}
          disabled={disabled}
        />
      </div>

      <div className={styles.formGroup} style={{ marginTop: '12px' }}>
        <label style={{ fontSize: '0.85rem', color: '#aaa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{t('pins')}</span>
          <span style={{ fontWeight: 'bold', color: 'var(--color-accent, #d4af37)' }}>{params.totalPins}</span>
        </label>
        <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '4px', margin: 0, lineHeight: '1.3' }}>
          {t('fixedPinsDesc')}
        </p>
      </div>
    </CollapsiblePanel>
  );
}
