"use client";
import React from 'react';
import { useTranslations } from 'next-intl';
import styles from './guide.module.css';

// Definición de las propiedades (props) para el componente PinDisplay
interface PinDisplayProps {
  currentPin: number | string;                 // Pin de origen actual
  targetPin: number | string | null;            // Pin de destino actual
  onRepeatSpeech: () => void;                  // Acción al hacer clic en el número (reproducir audio)
  onTouchStart: (e: React.TouchEvent) => void; // Manejador del inicio del gesto táctil (swipe)
  onTouchEnd: (e: React.TouchEvent) => void;   // Manejador del fin del gesto táctil (swipe)
}

/**
 * Componente interactivo central del guiado.
 * Muestra los pines origen/destino y maneja los gestos táctiles (swipe).
 */
export function PinDisplay({
  currentPin,
  targetPin,
  onRepeatSpeech,
  onTouchStart,
  onTouchEnd
}: PinDisplayProps) {
  // Hook de traducción de Next-intl
  const t = useTranslations('Guide');

  return (
    <div
      className={styles.centerSection}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Etiqueta superior del pin de destino */}
      <span className={styles.label}>{t('toPin')}</span>
      
      {/* Contenedor principal del pin de destino (táctil para repetir la voz) */}
      <div className={styles.targetPinContainer} onClick={onRepeatSpeech}>
        <span className={styles.targetPinNumber}>{targetPin}</span>
      </div>
      
      {/* Indicador del pin de origen */}
      <div className={styles.originPin}>
        {t('fromPin')}: <span className={styles.originPinHighlight}>{currentPin}</span>
      </div>
    </div>
  );
}
