"use client";
import React from 'react';
import { useTranslations } from 'next-intl';
import { Check } from '../shared/icons';
import styles from './guide.module.css';

// Definición de las propiedades (props) para el componente SequenceListModal
interface SequenceListModalProps {
  onClose: () => void; // Acción para cerrar el modal
  session: {
    currentStep: number;
    sequence: Uint16Array | number[];
  };
}

/**
 * Modal que presenta el listado indexado y completo de los pasos del tejido.
 * Muestra el origen, destino y marca con un check los pasos ya completados.
 */
export function SequenceListModal({ onClose, session }: SequenceListModalProps) {
  // Hook de traducción de Next-intl
  const t = useTranslations('Guide');

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxHeight: '85vh' }}>
        {/* Título del listado de secuencia */}
        <h2 className={styles.modalTitle}>{t('sequenceList')}</h2>
        
        {/* Contenedor escaneable con scroll para todos los pasos */}
        <div className={styles.sequenceListContainer}>
          {Array.from(session.sequence).map((pin, idx) => {
            // El último pin de la secuencia no tiene un siguiente destino
            if (idx === session.sequence.length - 1) return null;
            
            const nextPin = session.sequence[idx + 1];
            const isDone = idx < session.currentStep;
            const isCurrent = idx === session.currentStep;
            
            // Determinación de clases dinámicas para el estado del paso
            let rowClass = styles.seqRow;
            if (isDone) rowClass += ' ' + styles.seqRowDone;
            if (isCurrent) rowClass += ' ' + styles.seqRowCurrent;
            
            return (
              <div key={idx} className={rowClass}>
                {/* Número correlativo del paso */}
                <span className={styles.seqStep}>{idx + 1}</span>
                
                {/* Pines origen y destino */}
                <span className={styles.seqPins}>{pin} → {nextPin}</span>
                
                {/* Icono de check si el paso ya fue realizado */}
                {isDone && (
                  <span className={styles.seqCheck} style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <Check size={14} strokeWidth={3} />
                  </span>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Botón de cierre */}
        <button
          className={styles.modalCloseBtn}
          onClick={onClose}
        >
          {t('close')}
        </button>
      </div>
    </div>
  );
}
