"use client";
import React from 'react';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight, Play, Pause, Download } from '../shared/icons';
import { exportAllData, downloadBackup } from '@/utils/backup';
import styles from './guide.module.css';

// Definición de las propiedades (props) para el componente GuideControls
interface GuideControlsProps {
  isPlaying: boolean;                          // Estado de la reproducción automática (autoplay)
  onTogglePlay: () => void;                    // Acción para iniciar/pausar la reproducción automática
  playSpeed: number;                           // Velocidad de reproducción automática en milisegundos
  onChangePlaySpeed: (speed: number) => void;  // Acción para cambiar la velocidad de reproducción
  isWakeLockActive: boolean;                   // Estado del Wake Lock (pantalla siempre activa)
  onPrev: () => void;                          // Acción para volver al paso anterior
  onNext: () => void;                          // Acción para avanzar al siguiente paso
  manualDisabled?: boolean;                    // Deshabilitar controles manuales (during autoplay)
}

/**
 * Panel de navegación y controles del modo guiado.
 * Permite avanzar, retroceder, activar el autoplay y ver el estado de bloqueo de pantalla.
 */
export function GuideControls({
  isPlaying,
  onTogglePlay,
  playSpeed,
  onChangePlaySpeed,
  isWakeLockActive,
  onPrev,
  onNext,
  manualDisabled = false
}: GuideControlsProps) {
  // Hook de traducción de Next-intl
  const t = useTranslations('Guide');

  const handleBackup = () => {
    try {
      const blob = exportAllData();
      downloadBackup(blob);
    } catch (error) {
      console.error('Backup failed:', error);
    }
  };

  return (
    <div className={styles.controlsSection}>
      {/* Botones principales de navegación (Anterior y Siguiente) */}
      <div className={styles.navButtons}>
        <button
          className={`${styles.btn} ${styles.btnPrev}`}
          onClick={onPrev}
          disabled={manualDisabled}
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          <ChevronLeft size={16} /> {t('prev')}
        </button>
        <button
          className={`${styles.btn} ${styles.btnNext}`}
          onClick={onNext}
          disabled={manualDisabled}
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          {t('next')} <ChevronRight size={16} />
        </button>
      </div>

      {/* Controles secundarios (Autoplay, Backup y WakeLock) */}
      <div className={styles.subControls}>
        <div className={styles.autoplayGroup}>
          <button
            className={`${styles.btnPlayPause} ${isPlaying ? styles.btnPlayPauseActive : ''}`}
            onClick={onTogglePlay}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />} {t('play')}
          </button>

          {isPlaying && (
            <select
              value={playSpeed}
              onChange={(e) => onChangePlaySpeed(Number(e.target.value))}
              className={styles.speedSelector}
            >
              <option value={5000}>5.0s</option>
              <option value={10000}>10.0s</option>
              <option value={15000}>15.0s</option>
              <option value={20000}>20.0s</option>
              <option value={25000}>25.0s</option>
              <option value={30000}>30.0s</option>
            </select>
          )}
        </div>

        {/* Botón de backup - tamaño del btnNext */}
        <button
          className={`${styles.btn} ${styles.btnBackup}`}
          onClick={handleBackup}
          title={t('downloadBackup')}
          aria-label={t('downloadBackup')}
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
        >
          <Download size={16} /> {t('downloadProgress')}
        </button>
      </div>
    </div>
  );
}
