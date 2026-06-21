"use client";
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { generatePinCoordinates } from '../../core/algorithm/bresenham';
import { CropTransform, ImageAdjustments, applyWhitesAndBlacks, applySharpen } from '../../utils/image-adjustments';
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
  const [supportsNativeFilter, setSupportsNativeFilter] = useState(true);

  // Referencias para control gestual multitáctil (pinch-to-zoom y pan con dos dedos)
  const initialDistanceRef = useRef<number | null>(null);
  const initialCenterRef = useRef<{ x: number; y: number } | null>(null);
  const initialCropRef = useRef<CropTransform | null>(null);

  // Estado y referencias para control de arrastre con mouse (drag-to-pan en escritorio)
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const dragStartCropRef = useRef<CropTransform | null>(null);

  // Detectar Safari/iOS (donde ctx.filter no funciona correctamente)
  useEffect(() => {
    const isSafariOrIOS = typeof navigator !== 'undefined' && (
      /iPad|iPhone|iPod/.test(navigator.platform) ||
      (navigator.userAgent.includes("Mac") && "ontouchend" in document) ||
      /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
    );
    const hasFilterSupport = typeof CanvasRenderingContext2D !== 'undefined' &&
      'filter' in CanvasRenderingContext2D.prototype &&
      !isSafariOrIOS;
    setSupportsNativeFilter(hasFilterSupport);
  }, []);

  // Determinar si estamos en modo preview (sin secuencia, con imagen)
  const isPreviewMode = (!sequence || sequence.length <= 1) && !!sourceImage;

  // Filtro CSS para Safari/iOS (se aplica al elemento canvas completo)
  const cssFilter = (() => {
    if (supportsNativeFilter || !isPreviewMode) return 'none';
    let filter = 'grayscale(100%)';
    if (adjustments) {
      filter += ` brightness(${100 + adjustments.brightness}%) contrast(${100 + adjustments.contrast}%)`;
    }
    return filter;
  })();

  // Cargar logotipo de Stringo para marca de agua en vacío
  useEffect(() => {
    const img = new Image();
    img.src = '/stringo-logo.png';
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

  const dismissGestureHint = useCallback(() => {
    if (showGestureHint) {
      setShowGestureHint(false);
      try {
        localStorage.setItem('has_seen_gesture_hint', 'true');
      } catch {
        // Silently ignore — non-critical preference
      }
    }
  }, [showGestureHint]);

  // Manejador de eventos touch nativo para soportar scrolling vertical con un solo dedo
  // e interceptar gestos multitáctiles (zoom/pan con dos dedos) de forma no pasiva.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onTouchStart = (e: TouchEvent) => {
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

    const onTouchMove = (e: TouchEvent) => {
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
        if (initialCenterRef.current) {
          const cx = (touch1.clientX + touch2.clientX) / 2;
          const cy = (touch1.clientY + touch2.clientY) / 2;

          const deltaX = cx - initialCenterRef.current.x;
          const deltaY = cy - initialCenterRef.current.y;

          const rect = canvas.getBoundingClientRect();

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

    const onTouchEnd = () => {
      initialDistanceRef.current = null;
      initialCenterRef.current = null;
      initialCropRef.current = null;
    };

    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd, { passive: true });
    canvas.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return () => {
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
      canvas.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [disabled, crop, onCropChange, dismissGestureHint]);

  // Manejador de eventos de mouse para soportar arrastre (drag/pan) en escritorio
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onMouseDown = (e: MouseEvent) => {
      // Solo permitir arrastre con el botón izquierdo y cuando esté en modo preview
      if (e.button !== 0 || disabled || !crop || !onCropChange || !isPreviewMode) return;

      dismissGestureHint();
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      dragStartCropRef.current = { ...crop };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current || !dragStartCropRef.current || !onCropChange) return;

      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      const rect = canvas.getBoundingClientRect();

      // Sensibilidad de arrastre (similar a la del touch)
      const sensitivity = 1.8;
      let newOffsetX = dragStartCropRef.current.offsetX - (deltaX / rect.width) * sensitivity;
      let newOffsetY = dragStartCropRef.current.offsetY - (deltaY / rect.height) * sensitivity;

      newOffsetX = Math.max(-1, Math.min(1, newOffsetX));
      newOffsetY = Math.max(-1, Math.min(1, newOffsetY));

      onCropChange({
        ...dragStartCropRef.current,
        offsetX: newOffsetX,
        offsetY: newOffsetY
      });
    };

    const onMouseUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
      dragStartCropRef.current = null;
    };

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [disabled, crop, onCropChange, isPreviewMode, dismissGestureHint]);

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
        if (supportsNativeFilter) {
          let baseFilter = 'grayscale(100%)';
          if (adjustments) {
            baseFilter += ` brightness(${100 + adjustments.brightness}%) contrast(${100 + adjustments.contrast}%)`;
          }
          ctx.filter = baseFilter + ' blur(8px) opacity(0.35)';
          ctx.drawImage(sourceImage, drawX, drawY, scaledW, scaledH);
        } else {
          // Fallback para Safari/iOS (atenuación manual de la periferia)
          ctx.globalAlpha = 0.25;
          ctx.drawImage(sourceImage, drawX, drawY, scaledW, scaledH);
          ctx.globalAlpha = 1.0;
          ctx.fillStyle = 'rgba(22, 22, 22, 0.45)';
          ctx.fillRect(0, 0, canvasSize, canvasSize);
        }
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
        if (supportsNativeFilter) {
          let baseFilter = 'grayscale(100%)';
          if (adjustments) {
            baseFilter += ` brightness(${100 + adjustments.brightness}%) contrast(${100 + adjustments.contrast}%)`;
          }
          ctx.filter = baseFilter;
        }
        ctx.drawImage(sourceImage, drawX, drawY, scaledW, scaledH);
        ctx.restore();

        // Aplicar blancos, negros y nitidez a nivel de píxeles (no soportados por CSS filters)
        // Usar canvas temporal para que putImageData no sobreescriba el fondo fuera del círculo
        if (adjustments && (adjustments.whites !== 0 || adjustments.blacks !== 0 || adjustments.sharpness > 0)) {
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = canvasSize;
          tempCanvas.height = canvasSize;
          const tempCtx = tempCanvas.getContext('2d')!;
          tempCtx.drawImage(canvas, 0, 0);

          const imageData = tempCtx.getImageData(0, 0, canvasSize, canvasSize);
          if (adjustments.whites !== 0 || adjustments.blacks !== 0) {
            applyWhitesAndBlacks(imageData.data, adjustments);
          }
          if (adjustments.sharpness > 0) {
            applySharpen(imageData.data, canvasSize, canvasSize, adjustments.sharpness);
          }
          tempCtx.putImageData(imageData, 0, 0);

          // Redibujar solo dentro del círculo (respeta el fondo)
          ctx.save();
          ctx.beginPath();
          ctx.arc(canvasSize / 2, canvasSize / 2, canvasSize / 2 - 2, 0, Math.PI * 2);
          ctx.clip();
          ctx.clearRect(0, 0, canvasSize, canvasSize);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
          ctx.drawImage(tempCanvas, 0, 0);
          ctx.restore();
        }

        ctx.restore(); // restaurar clip circular

        // 4. Borde del bastidor azul elegante de Stringo
        ctx.strokeStyle = 'rgba(59, 110, 187, 0.65)';
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
          ctx.strokeStyle = 'rgba(59, 110, 187, 0.65)';
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

        // Marca de agua del logotipo de Stringo difuso en el centro con relación de aspecto correcta
        if (logoImage) {
          ctx.save();
          ctx.globalAlpha = 0.5; // transparencia del logo en el bastidor

          const maxLogoSize = canvasSize * 0.65; // Agrandado
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
        style={{
          ...(cssFilter !== 'none' ? { filter: cssFilter, WebkitFilter: cssFilter } : {}),
          cursor: isDragging ? 'grabbing' : (isPreviewMode && !disabled ? 'grab' : 'default')
        }}
      />
      {showGestureHint && (
        <div className={`${styles.gestureHint} ${styles.mobileOnly}`}>
          {t('gestureHint')}
        </div>
      )}
    </div>
  );
}
