"use client";
import React from 'react';
import { useTranslations } from 'next-intl';
import styles from './guide.module.css';

// Definición de las propiedades (props) para el componente ProgressBar
interface ProgressBarProps {
  currentStep: number;     // Paso actual de la sesión de tejido (0-indexed)
  totalSteps: number;      // Total de pasos en la secuencia
  progressPercent: number; // Porcentaje calculado de progreso (0 a 100)
}

/**
 * Componente que muestra el progreso numérico y una barra visual
 * de la secuencia del tejido.
 */
export function ProgressBar({
  currentStep,
  totalSteps,
  progressPercent
}: ProgressBarProps) {
  // Hook de traducción de Next-intl
  const t = useTranslations('Guide');

  return (
    <div className={styles.progressSection}>
      {/* Información textual del paso actual y el porcentaje */}
      <div className={styles.progressText}>
        <span>
          {t('step', { 
            current: currentStep + 1, 
            total: totalSteps + 1 
          })}
        </span>
        <span>{progressPercent}%</span>
      </div>
      
      {/* Contenedor de la barra de progreso */}
      <div className={styles.progressBar}>
        {/* Relleno animado que indica el progreso real */}
        <div
          className={styles.progressFill}
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>
    </div>
  );
}
