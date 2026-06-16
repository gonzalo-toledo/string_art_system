"use client";
import React from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeft, Volume2, VolumeX, Eye, List } from '../shared/icons';
import styles from './guide.module.css';

// Definición de las propiedades (props) para el encabezado del guiado
interface GuideHeaderProps {
  onBack: () => void;           // Acción para regresar al editor
  isSpeechEnabled: boolean;     // Estado de la guía por voz (activo/inactivo)
  onToggleSpeech: () => void;   // Acción para alternar la guía por voz
  onOpenVisualizer: () => void;  // Acción para abrir el visualizador de hilos
  onOpenSequenceList: () => void; // Acción para abrir el listado de secuencias
}

/**
 * Encabezado de la pantalla de guiado.
 * Contiene controles rápidos de audio, visualización y lista de secuencias.
 */
export function GuideHeader({
  onBack,
  isSpeechEnabled,
  onToggleSpeech,
  onOpenVisualizer,
  onOpenSequenceList
}: GuideHeaderProps) {
  // Hook de traducción de Next-intl
  const t = useTranslations('Guide');

  return (
    <div className={styles.header}>
      {/* Botón de retroceso al Editor principal */}
      <button
        className={styles.iconButton}
        onClick={onBack}
        aria-label={t('backToEditor')}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <ArrowLeft size={20} />
      </button>

      {/* Título de la página de guiado */}
      {/* <h1 className={styles.headerTitle}>{t('title')}</h1> */}

      <div className={styles.headerActions}>
        {/* Control para activar/desactivar la voz del guiado */}
        <button
          className={`${styles.iconButton} ${isSpeechEnabled ? styles.iconButtonActive : ''}`}
          onClick={onToggleSpeech}
          title={t('audio')}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {isSpeechEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>

        {/* Control para abrir el modal del visualizador (canvas) */}
        <button
          className={styles.iconButton}
          onClick={onOpenVisualizer}
          title={t('visualize')}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Eye size={20} />
        </button>

        {/* Control para abrir el listado con todos los pasos del tejido */}
        <button
          className={styles.iconButton}
          onClick={onOpenSequenceList}
          title={t('sequenceList')}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <List size={20} />
        </button>
      </div>
    </div>
  );
}
