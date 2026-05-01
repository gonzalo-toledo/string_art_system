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

export function CanvasRenderer({ sequence, totalPins, canvasSize, previewUrl, lineOpacity = 0.15, lineWidth = 1 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sequenceIndexRef = useRef(0);

  // Initial draw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (!sequence || sequence.length <= 1) {
      sequenceIndexRef.current = 0;
      ctx.clearRect(0, 0, canvasSize, canvasSize);
      
      if (previewUrl) {
        const img = new Image();
        img.onload = () => {
          ctx.globalAlpha = 0.15;
          ctx.drawImage(img, 0, 0, canvasSize, canvasSize);
          ctx.globalAlpha = 1.0;
        };
        img.src = previewUrl;
      }
    }
  }, [previewUrl, canvasSize, sequence]);

  // Progressive drawing
  useEffect(() => {
    if (!sequence || sequence.length <= 1) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pins = generatePinCoordinates(totalPins, canvasSize, canvasSize);
    let animationFrameId: number;

    const drawLines = () => {
      if (sequenceIndexRef.current >= sequence.length - 1) return;

      // Dynamic line styles
      ctx.strokeStyle = `rgba(10, 10, 10, ${lineOpacity})`; 
      ctx.lineWidth = lineWidth;
      ctx.beginPath();

      // Draw batches
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
      />
    </div>
  );
}
