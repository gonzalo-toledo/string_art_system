"use client";
import React, { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { generatePinCoordinates } from '../../core/algorithm/bresenham';
import styles from './guide.module.css';

// Definición de las propiedades (props) para el componente VisualizerModal
interface VisualizerModalProps {
  onClose: () => void; // Acción para cerrar el modal
  session: {
    currentStep: number;
    totalSteps: number;
    sequence: Uint16Array | number[];
    config: {
      totalPins: number;
    };
  };
}

/**
 * Modal que contiene el canvas interactivo para visualizar
 * el progreso acumulado del tejido de hilos.
 */
export function VisualizerModal({ onClose, session }: VisualizerModalProps) {
  // Hook de traducción de Next-intl
  const t = useTranslations('Guide');

  // Referencia al elemento canvas del DOM
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Efecto secundario encargado de dibujar el estado actual del tejido en el canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    ctx.clearRect(0, 0, size, size);

    // Fondo blanco del tablero (igual que el producto físico)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    const boardRadius = size / 2 - 10;
    const centerX = size / 2;
    const centerY = size / 2;

    // Dibujado del borde del tablero circular
    ctx.beginPath();
    ctx.arc(centerX, centerY, boardRadius, 0, Math.PI * 2);
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Generar las coordenadas espaciales para cada pin
    const pins = generatePinCoordinates(session.config.totalPins, size, size);

    // Dibujar hilos completados con un renderizado realista (acumulación)
    ctx.lineWidth = 1; // Grosor del hilo (sincronizado con CanvasRenderer)
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)'; // Opacidad del hilo (CanvasRenderer es 0.35)

    for (let i = 0; i <= session.currentStep; i++) {
      if (i + 1 < session.sequence.length) {
        const pA = pins[session.sequence[i]];
        const pB = pins[session.sequence[i + 1]];
        ctx.beginPath();
        ctx.moveTo(pA.x, pA.y);
        ctx.lineTo(pB.x, pB.y);
        ctx.stroke();
      }
    }

    // Dibujar la línea de hilo activa actual resaltada en color azul de la marca
    if (session.currentStep < session.totalSteps) {
      const pStart = pins[session.sequence[session.currentStep]];
      const pEnd = pins[session.sequence[session.currentStep + 1]];
      ctx.beginPath();
      ctx.strokeStyle = '#3b6ebb';
      ctx.lineWidth = 1.5;
      ctx.moveTo(pStart.x, pStart.y);
      ctx.lineTo(pEnd.x, pEnd.y);
      ctx.stroke();
    }

    // Dibujar los alfileres/pines en el perímetro del círculo
    pins.forEach((p, idx) => {
      const isCurrentOrigin = idx === session.sequence[session.currentStep];
      const isCurrentTarget = idx === session.sequence[session.currentStep + 1];

      if (isCurrentTarget) {
        // Pin de destino: Rojo y de mayor tamaño
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (isCurrentOrigin) {
        // Pin de origen: Azul
        ctx.fillStyle = '#2b4a80';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Pines estándar: Pequeños puntos negros
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }, [session]);

  const isCompleted = session.currentStep >= session.totalSteps;
  const currentPin = session.sequence[session.currentStep];
  const targetPin = isCompleted ? null : session.sequence[session.currentStep + 1];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Título del modal */}
        <h2 className={styles.modalTitle}>{t('visualize')}</h2>

        {/* Contenedor y canvas */}
        <div className={styles.modalCanvasContainer}>
          <canvas
            ref={canvasRef}
            width={350}
            height={350}
            className={styles.modalCanvas}
          />
        </div>

        {/* Indicador numérico actual entre el render y el botón cerrar */}
        <div className={styles.modalPinDisplay}>
          <span className={styles.modalPinLabel}>{t('toPin')}</span>
          <div className={styles.modalTargetPinNumber}>
            {targetPin !== null ? targetPin : '-'}
          </div>
          <div className={styles.modalOriginPin}>
            {t('fromPin')} <span className={styles.modalOriginHighlight}>{currentPin}</span>
          </div>
        </div>

        {/* Botón para cerrar */}
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
