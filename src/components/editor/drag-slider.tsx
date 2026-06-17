"use client";
import React, { useRef, useCallback, useEffect } from 'react';
import styles from './editor.module.css';

interface Props {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

/**
 * Slider custom que solo permite mover el valor agarrando y arrastrando el thumb.
 * Click o toque en el track NO mueve el valor (a diferencia del input[type=range] nativo).
 */
export function DragSlider({ value, min, max, step, onChange, disabled = false }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const clampToStep = useCallback((raw: number) => {
    const clamped = Math.max(min, Math.min(max, raw));
    return Math.round(clamped / step) * step;
  }, [min, max, step]);

  const getValueFromPosition = useCallback((clientX: number) => {
    const track = trackRef.current;
    if (!track) return value;
    const rect = track.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    return clampToStep(min + ratio * (max - min));
  }, [min, max, value, clampToStep]);

  const handleThumbMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    draggingRef.current = true;

    const handleMouseMove = (ev: MouseEvent) => {
      if (!draggingRef.current) return;
      onChange(getValueFromPosition(ev.clientX));
    };

    const handleMouseUp = () => {
      draggingRef.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [disabled, onChange, getValueFromPosition]);

  const handleThumbTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    e.stopPropagation();
    draggingRef.current = true;

    const handleTouchMove = (ev: TouchEvent) => {
      if (!draggingRef.current || !ev.touches.length) return;
      ev.preventDefault();
      onChange(getValueFromPosition(ev.touches[0].clientX));
    };

    const handleTouchEnd = () => {
      draggingRef.current = false;
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  }, [disabled, onChange, getValueFromPosition]);

  // Cleanup global listeners si el componente se desmonta durante un drag
  useEffect(() => {
    return () => {
      draggingRef.current = false;
    };
  }, []);

  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div
      className={`${styles.dragSliderTrack} ${disabled ? styles.dragSliderDisabled : ''}`}
      ref={trackRef}
    >
      <div
        className={styles.dragSliderFill}
        style={{ width: `${percent}%` }}
      />
      <div
        className={styles.dragSliderThumb}
        style={{ left: `${percent}%` }}
        onMouseDown={handleThumbMouseDown}
        onTouchStart={handleThumbTouchStart}
      />
    </div>
  );
}
