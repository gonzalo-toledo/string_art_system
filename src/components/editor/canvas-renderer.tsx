"use client";
import React, { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { generatePinCoordinates } from '../../core/algorithm/bresenham';
import { CropTransform, ImageAdjustments } from '../../utils/image-adjustments';
import styles from './editor.module.css';

interface Props {
  sequence: Uint16Array | null;
  totalPins: number;
  canvasSize: number;
  previewUrl: string | null;
  sourceImage?: HTMLImageElement | null;
  adjustments?: ImageAdjustments;
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
 * 1. Sin secuencia: muestra la preview de la imagen original en tiempo real con
 *    filtros CSS acelerados por GPU, máscara de desenfoque exterior, y control multitáctil.
 * 2. Con secuencia: dibuja la animación progresiva de los hilos.
 */
export function CanvasRenderer({
  sequence,
  totalPins,
  canvasSize,
  previewUrl,
  sourceImage,
  adjustments,
  lineOpacity = 0.35,
  lineWidth = 1,
  crop,
  onCropChange,
  disabled = false,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sequenceIndexRef = useRef(0);
  const t = useTranslations('Editor');

  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null);
  const [showGestureHint, setShowGestureHint] = useState(false);

  // Referencias para control gestual multitáctil (pinch-to-zoom y pan con dos dedos)
  const initialDistanceRef = useRef<number | null>(null);
  const initialCenterRef = useRef<{ x: number; y: number } | null>(null);
  const initialCropRef = useRef<CropTransform | null>(null);

  // Cargar logotipo de HÁGALO para marca de agua en vacío
  useEffect(() => {
    const img = new Image();
    img.src = '/hagalo-logo.png';
    img.onload = () => {
      setLogoImage(img);
    };
  }, []);

  // Controlar visibilidad del tooltip gestual
  useEffect(() => {
    if (sourceImage) {
      const hasSeenHint = localStorage.getItem('has_seen_gesture_hint');
      if (!hasSeenHint) {
        setShowGestureHint(true);
      }
    } else {
      setShowGestureHint(false);
    }
  }, [sourceImage]);

  const dismissGestureHint = () => {
    if (showGestureHint) {
      setShowGestureHint(false);
      localStorage.setItem('has_seen_gesture_hint', 'true');
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled || !crop || !onCropChange) return;
    dismissGestureHint();

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

  // Dibuja el estado inicial (preview/imagen) o vacío
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!sequence || sequence.length <= 1) {
      sequenceIndexRef.current = 0;
      ctx.clearRect(0, 0, canvasSize, canvasSize);

      if (sourceImage) {
        // Calcular escala base (modo cover)
        const baseScale = Math.max(canvasSize / sourceImage.width, canvasSize / sourceImage.height);
        const scale = baseScale * (crop?.zoom ?? 1);

        // Dimensiones escaladas
        const scaledW = sourceImage.width * scale;
        const scaledH = sourceImage.height * scale;

        // Centrar por defecto, luego aplicar offset
        const maxOffsetX = (scaledW - canvasSize) / 2;
        const maxOffsetY = (scaledH - canvasSize) / 2;

        const drawX = (canvasSize - scaledW) / 2 - (crop?.offsetX ?? 0) * maxOffsetX;
        const drawY = (canvasSize - scaledH) / 2 - (crop?.offsetY ?? 0) * maxOffsetY;

        // 1. Dibujar fondo negro sólido para el canvas cuadrado exterior
        ctx.fillStyle = '#161616';
        ctx.fillRect(0, 0, canvasSize, canvasSize);

        // 2. Dibujar la imagen de fondo borrosa (fuera del círculo)
        ctx.save();
        let baseFilter = 'grayscale(100%)';
        if (adjustments) {
          baseFilter += ` brightness(${100 + adjustments.brightness}%) contrast(${100 + adjustments.contrast}%)`;
        }
        ctx.filter = baseFilter + ' blur(8px) opacity(0.35)';
        ctx.drawImage(sourceImage, drawX, drawY, scaledW, scaledH);
        ctx.restore();

        // 3. Dibujar el círculo de recorte nítido
        ctx.save();
        ctx.beginPath();
        ctx.arc(canvasSize / 2, canvasSize / 2, canvasSize / 2 - 2, 0, Math.PI * 2);
        ctx.clip();

        // Fondo blanco dentro del círculo
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Dibujar la imagen nítida dentro de la máscara circular
        ctx.save();
        ctx.filter = baseFilter;
        ctx.drawImage(sourceImage, drawX, drawY, scaledW, scaledH);
        ctx.restore();

        ctx.restore(); // restaurar clip circular

        // 4. Borde del bastidor dorado/elegante
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.6)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(canvasSize / 2, canvasSize / 2, canvasSize / 2 - 2, 0, Math.PI * 2);
        ctx.stroke();
      } else if (previewUrl) {
        const img = new Image();
        img.onload = () => {
          if (sequence && sequence.length > 1) return;
          ctx.save();
          // Limpiar y dibujar fondo de recorte exterior
          ctx.clearRect(0, 0, canvasSize, canvasSize);
          ctx.fillStyle = '#161616';
          ctx.fillRect(0, 0, canvasSize, canvasSize);

          ctx.beginPath();
          ctx.arc(canvasSize / 2, canvasSize / 2, canvasSize / 2 - 2, 0, Math.PI * 2);
          ctx.clip();
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.globalAlpha = 1.0;
          ctx.drawImage(img, 0, 0, canvasSize, canvasSize);
          ctx.restore();

          // Borde del bastidor
          ctx.strokeStyle = 'rgba(212, 175, 55, 0.6)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(canvasSize / 2, canvasSize / 2, canvasSize / 2 - 2, 0, Math.PI * 2);
          ctx.stroke();
        };
        img.src = previewUrl;
      } else {
        // Fondo blanco circular cuando no hay imagen
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(canvasSize / 2, canvasSize / 2, canvasSize / 2 - 1, 0, Math.PI * 2);
        ctx.fill();

        // Borde del bastidor gris elegante
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(canvasSize / 2, canvasSize / 2, canvasSize / 2 - 1, 0, Math.PI * 2);
        ctx.stroke();

        // Marca de agua del logotipo de HÁGALO difuso en el centro con relación de aspecto correcta
        if (logoImage) {
          ctx.save();
          ctx.globalAlpha = 0.08;
          
          const maxLogoSize = canvasSize * 0.45;
          const logoAspect = logoImage.width / logoImage.height;
          
          let logoW = maxLogoSize;
          let logoH = maxLogoSize;
          
          if (logoAspect > 1) {
            // Ancho > Alto: ajustar altura en base al ancho
            logoH = maxLogoSize / logoAspect;
          } else {
            // Alto >= Ancho: ajustar ancho en base a la altura
            logoW = maxLogoSize * logoAspect;
          }
          
          const logoX = (canvasSize - logoW) / 2;
          const logoY = (canvasSize - logoH) / 2;
          
          ctx.drawImage(logoImage, logoX, logoY, logoW, logoH);
          ctx.restore();
        }
      }
    }
  }, [sourceImage, previewUrl, logoImage, crop, adjustments, canvasSize, sequence]);

  // Dibuja la secuencia de hilos progresivos
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
      {showGestureHint && (
        <div className={`${styles.gestureHint} ${styles.mobileOnly}`}>
          {t('gestureHint')}
        </div>
      )}
    </div>
  );
}
