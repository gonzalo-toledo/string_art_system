"use client";
import React, { useEffect, useRef } from 'react';
import { generatePinCoordinates } from '../../core/algorithm/bresenham';
import { CropTransform } from '../../utils/image-adjustments';
import styles from './editor.module.css';

interface Props {
  sequence: Uint16Array | null;
  totalPins: number;
  canvasSize: number;
  previewUrl: string | null;
  lineOpacity?: number;
  lineWidth?: number;
  crop?: CropTransform;
  onCropChange?: (crop: CropTransform) => void;
  disabled?: boolean;
}

/**
 * Renderizador del canvas de string art.
 *
 * Soporta dos modos:
 * 1. Sin secuencia: muestra la preview de la imagen procesada con controles gestuales multitáctiles.
 * 2. Con secuencia: dibuja la animación progresiva de los hilos.
 */
export function CanvasRenderer({
  sequence,
  totalPins,
  canvasSize,
  previewUrl,
  lineOpacity = 0.35,
  lineWidth = 1,
  crop,
  onCropChange,
  disabled = false,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sequenceIndexRef = useRef(0);

  // Referencias para control gestual multitáctil (pinch-to-zoom y pan con dos dedos)
  const initialDistanceRef = useRef<number | null>(null);
  const initialCenterRef = useRef<{ x: number; y: number } | null>(null);
  const initialCropRef = useRef<CropTransform | null>(null);

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled || !crop || !onCropChange) return;

    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      
      const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
      const cx = (touch1.clientX + touch2.clientX) / 2;
      const cy = (touch1.clientY + touch2.clientY) / 2;

      initialDistanceRef.current = dist;
      initialCenterRef.current = { x: cx, y: cy };
      initialCropRef.current = { ...crop };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled || !crop || !onCropChange || !initialCropRef.current) return;

    if (e.touches.length === 2) {
      // Previene scroll nativo de la pantalla al usar dos dedos en el canvas
      if (e.cancelable) e.preventDefault();

      const touch1 = e.touches[0];
      const touch2 = e.touches[1];

      // 1. Zoom (pinch)
      let newZoom = crop.zoom;
      if (initialDistanceRef.current && initialDistanceRef.current > 0) {
        const dist = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
        const scaleFactor = dist / initialDistanceRef.current;
        newZoom = initialCropRef.current.zoom * scaleFactor;
        newZoom = Math.max(1.0, Math.min(3.0, newZoom)); // límite de zoom entre 1.0x y 3.0x
      }

      // 2. Desplazamiento (drag/pan)
      let newOffsetX = crop.offsetX;
      let newOffsetY = crop.offsetY;
      if (initialCenterRef.current && canvasRef.current) {
        const cx = (touch1.clientX + touch2.clientX) / 2;
        const cy = (touch1.clientY + touch2.clientY) / 2;

        const deltaX = cx - initialCenterRef.current.x;
        const deltaY = cy - initialCenterRef.current.y;

        const rect = canvasRef.current.getBoundingClientRect();
        
        // Sensibilidad escalada con el tamaño en pantalla del canvas
        const sensitivity = 1.8;
        newOffsetX = initialCropRef.current.offsetX - (deltaX / rect.width) * sensitivity;
        newOffsetY = initialCropRef.current.offsetY - (deltaY / rect.height) * sensitivity;

        newOffsetX = Math.max(-1, Math.min(1, newOffsetX));
        newOffsetY = Math.max(-1, Math.min(1, newOffsetY));
      }

      onCropChange({
        zoom: newZoom,
        offsetX: newOffsetX,
        offsetY: newOffsetY
      });
    }
  };

  const handleTouchEnd = () => {
    initialDistanceRef.current = null;
    initialCenterRef.current = null;
    initialCropRef.current = null;
  };

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
      ctx.arc(canvasSize / 2, canvasSize / 2, canvasSize / 2 - 1, 0, Math.PI * 2);
      ctx.fill();

      // Si hay preview, dibujarla a opacidad completa para ver los ajustes
      if (previewUrl) {
        const img = new Image();
        img.onload = () => {
          ctx.save();
          ctx.beginPath();
          ctx.arc(canvasSize / 2, canvasSize / 2, canvasSize / 2 - 1, 0, Math.PI * 2);
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
    ctx.arc(canvasSize / 2, canvasSize / 2, canvasSize / 2 - 1, 0, Math.PI * 2);
    ctx.fill();

    const pins = generatePinCoordinates(totalPins, canvasSize, canvasSize);
    let animationFrameId: number;

    const drawLines = () => {
      if (sequenceIndexRef.current >= sequence.length - 1) return;

          // Estilo de los hilos: negro puro semi-transparente para máximo realismo
      // Coincide con el renderizado de referencia
      ctx.strokeStyle = `rgba(0, 0, 0, ${lineOpacity})`;
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
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      />
    </div>
  );
}
