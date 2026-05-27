"use client";
import React, { useEffect, useRef } from 'react';
import { generatePinCoordinates } from '../../core/algorithm/bresenham';
import styles from './editor.module.css';

interface Props {
  sequence: Uint16Array | null;
  totalPins: number;
  canvasSize: number;
  previewUrl: string | null;
  lineOpacity?: number;
  lineWidth?: number;
}

/**
 * Renderizador del canvas de string art.
 *
 * Tiene dos modos:
 * 1. Sin secuencia: muestra la preview de la imagen procesada (grayscale circular)
 * 2. Con secuencia: dibuja animación progresiva de los hilos (50 líneas por frame)
 *
 * Las líneas se acumulan SIN limpiar el canvas entre frames,
 * simulando la opacidad creciente del hilo real.
 */
export function CanvasRenderer({ sequence, totalPins, canvasSize, previewUrl, lineOpacity = 0.15, lineWidth = 1 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sequenceIndexRef = useRef(0);

  // Dibuja el estado inicial: fondo blanco circular + preview de imagen
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!sequence || sequence.length <= 1) {
      sequenceIndexRef.current = 0;
      ctx.clearRect(0, 0, canvasSize, canvasSize);

      // Fondo blanco circular (simula el tablero real)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(canvasSize / 2, canvasSize / 2, canvasSize / 2, 0, Math.PI * 2);
      ctx.fill();

      // Si hay preview, dibujarla a opacidad completa para ver los ajustes
      if (previewUrl) {
        const img = new Image();
        img.onload = () => {
          ctx.save();
          ctx.beginPath();
          ctx.arc(canvasSize / 2, canvasSize / 2, canvasSize / 2, 0, Math.PI * 2);
          ctx.clip();

          ctx.globalAlpha = 1.0; // Opacidad completa para que los ajustes sean visibles
          ctx.drawImage(img, 0, 0, canvasSize, canvasSize);
          ctx.restore();
        };
        img.src = previewUrl;
      }
    }
  }, [previewUrl, canvasSize, sequence]);

  // Dibuja la animación progresiva de hilos cuando hay secuencia
  useEffect(() => {
    if (!sequence || sequence.length <= 1) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    sequenceIndexRef.current = 0;
    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // Fondo blanco circular
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(canvasSize / 2, canvasSize / 2, canvasSize / 2, 0, Math.PI * 2);
    ctx.fill();

    const pins = generatePinCoordinates(totalPins, canvasSize, canvasSize);
    let animationFrameId: number;

    const drawLines = () => {
      if (sequenceIndexRef.current >= sequence.length - 1) return;

      // Estilo de los hilos: negro semi-transparente para efecto de acumulación
      ctx.strokeStyle = `rgba(10, 10, 10, ${lineOpacity})`;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();

      // Dibujar en lotes de 50 líneas por frame para velocidad
      let linesDrawn = 0;
      while (sequenceIndexRef.current < sequence.length - 1 && linesDrawn < 50) {
        const pinA = sequence[sequenceIndexRef.current];
        const pinB = sequence[sequenceIndexRef.current + 1];

        ctx.moveTo(pins[pinA].x, pins[pinA].y);
        ctx.lineTo(pins[pinB].x, pins[pinB].y);

        sequenceIndexRef.current++;
        linesDrawn++;
      }

      ctx.stroke();

      // Continuar animación si quedan líneas por dibujar
      if (sequenceIndexRef.current < sequence.length - 1) {
        animationFrameId = requestAnimationFrame(drawLines);
      }
    };

    animationFrameId = requestAnimationFrame(drawLines);

    return () => cancelAnimationFrame(animationFrameId);
  }, [sequence, totalPins, canvasSize, lineOpacity, lineWidth]);

  return (
    <div className={styles.canvasContainer}>
      <canvas
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
        className={styles.canvas}
      />
    </div>
  );
}
