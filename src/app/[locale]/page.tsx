"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { generatePinCoordinates } from '@/core/algorithm/bresenham';
import styles from './page.module.css';

// Secuencia precalculada óptima del logotipo de Stringo para evitar cálculos pesados
// en el cliente y garantizar consistencia de renderizado idéntica en todos los dispositivos
const LOGO_INTRO_SEQUENCE = [
  0, 88, 1, 87, 176, 86, 175, 87, 2, 89, 3, 92, 4, 93, 3, 90, 2, 91, 0, 89,
  179, 94, 4, 95, 5, 96, 6, 95, 1, 91, 176, 88, 178, 94, 177, 92, 2, 93, 179, 90,
  4, 91, 3, 88, 177, 85, 174, 89, 177, 86, 179, 87, 178, 93, 176, 92, 1, 90, 175, 83,
  174, 81, 173, 85, 178, 89, 176, 90, 177, 91, 5, 93, 1, 96, 7, 101, 6, 92, 5, 99,
  4, 98, 8, 92, 7, 95, 0, 87, 177, 84, 167
];

export default function SplashScreen() {
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || 'es';

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const logoRef = useRef<HTMLImageElement | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [skipped, setSkipped] = useState(false);

  useEffect(() => {
    let active = true;
    let animationId: number;

    const TARGET_SIZE = 512;
    const pins = generatePinCoordinates(180, TARGET_SIZE, TARGET_SIZE);
    const sequence = LOGO_INTRO_SEQUENCE;

    setIsReady(true);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animStartTime: number | null = null;
    const TOTAL_DURATION = 3000; // 3 segundos de transición/espera
    const WEAVE_DURATION = 2200; // 2.2 segundos tejiendo, 0.8s estático para apreciar el resultado

    const easeInOutCubic = (x: number) => {
      return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    };

    const animate = (currentTime: number) => {
      if (!active) return;

      // Inicializa el tiempo de inicio con el primer frame para evitar desfases en Safari/iOS
      if (animStartTime === null) {
        animStartTime = currentTime;
      }
      const elapsed = currentTime - animStartTime;

      // Redirección al terminar los 3 segundos
      if (elapsed >= TOTAL_DURATION) {
        if (active && !skipped) {
          setSkipped(true);
          router.push(`/${locale}/editor`);
        }
        return;
      }

      // Calcular progreso suavizado de tejido (0 a 1)
      const rawProgress = Math.min(1.0, elapsed / WEAVE_DURATION);
      const progress = easeInOutCubic(rawProgress);

      // Controlar la opacidad del logotipo de fondo en base al progreso
      if (logoRef.current) {
        logoRef.current.style.opacity = (0.05 + progress * 0.9).toString();
      }

      // Cantidad de hilos a dibujar (omitimos el último hilo para evitar líneas cruzadas no estéticas)
      const linesToDraw = Math.floor(progress * (sequence.length - 2));

      // Limpiar lienzo
      ctx.clearRect(0, 0, TARGET_SIZE, TARGET_SIZE);

      // 1. Dibujar hilos normales con azul sutil y elegante
      const normalLinesCount = Math.max(0, linesToDraw - 8);
      ctx.strokeStyle = 'rgba(59, 110, 187, 0.35)';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      for (let i = 0; i < normalLinesCount; i++) {
        const p0 = pins[sequence[i]];
        const p1 = pins[sequence[i + 1]];
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
      }
      ctx.stroke();

      // 2. Dibujar la cola de hilos "calientes" activos (últimos 8 hilos de forma fluida y brillante)
      if (linesToDraw > normalLinesCount) {
        ctx.save();
        ctx.strokeStyle = 'rgba(59, 110, 187, 0.85)';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#3b6ebb';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        for (let i = normalLinesCount; i < linesToDraw; i++) {
          const p0 = pins[sequence[i]];
          const p1 = pins[sequence[i + 1]];
          ctx.moveTo(p0.x, p0.y);
          ctx.lineTo(p1.x, p1.y);
        }
        ctx.stroke();
        ctx.restore();
      }

      // 3. Dibujar la aguja azul brillante (el punto en movimiento con pulso de luz)
      if (linesToDraw > 0) {
        const lastPinIdx = sequence[linesToDraw];
        const needlePos = pins[lastPinIdx];

        ctx.save();
        // Efecto de pulso de brillo
        const pulse = elapsed > WEAVE_DURATION
          ? 12 + Math.sin((elapsed - WEAVE_DURATION) * 0.015) * 3
          : 8;

        ctx.shadowColor = '#3b6ebb';
        ctx.shadowBlur = pulse;
        ctx.fillStyle = '#ffffff'; // Centro blanco de alta intensidad lumínica
        ctx.strokeStyle = '#3b6ebb'; // Contorno azul
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(needlePos.x, needlePos.y, 4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      active = false;
      cancelAnimationFrame(animationId);
    };
  }, [locale, router, skipped]);

  return (
    <div className={styles.splashContainer}>
      <style dangerouslySetInnerHTML={{
        __html: `
        header, footer {
          display: none !important;
        }
      ` }} />

      <div className={styles.logoContainer}>
        <img ref={logoRef} src="/stringo-logo.png" alt="Stringo" className={styles.logoImage} />
        <canvas
          ref={canvasRef}
          width={512}
          height={512}
          className={styles.canvas}
        />
      </div>
    </div>
  );
}
