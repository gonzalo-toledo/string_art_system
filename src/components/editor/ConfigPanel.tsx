"use client";
import React from 'react';
import { AlgorithmParams } from '../../core/algorithm/types';
import styles from './editor.module.css';

interface Props {
  params: AlgorithmParams;
  onChange: (params: AlgorithmParams) => void;
  disabled?: boolean;
}

export function ConfigPanel({ params, onChange, disabled }: Props) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onChange({
      ...params,
      [name]: Number(value)
    });
  };

  return (
    <div className={styles.panel}>
      <h3>2. Settings</h3>
      
      <div className={styles.formGroup}>
        <label>Lines: {params.maxIterations}</label>
        <input 
          type="range" name="maxIterations" 
          min="1000" max="5000" step="100" 
          value={params.maxIterations} onChange={handleChange} 
          disabled={disabled}
        />
      </div>

      <div className={styles.formGroup}>
        <label>Pins: {params.totalPins}</label>
        <input 
          type="range" name="totalPins" 
          min="150" max="300" step="10" 
          value={params.totalPins} onChange={handleChange} 
          disabled={disabled}
        />
      </div>
    </div>
  );
}
