"use client";

import { useEffect, useRef, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { GreedyAlgorithm } from '@/core/algorithm/greedy';
import { generatePinCoordinates } from '@/core/algorithm/bresenham';
import styles from './page.module.css';

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

    const TARGET_SIZE = 512; // Mayor resolución para hilos más definidos
    const img = new Image();
    img.src = '/hagalo-logo.png';

    img.onload = () => {
      if (!active) return;

      try {
        // 1. Dibujar el logo en un canvas temporal (contain mode con margen)
        const canvasObj = document.createElement('canvas');
        canvasObj.width = TARGET_SIZE;
        canvasObj.height = TARGET_SIZE;
        const ctxObj = canvasObj.getContext('2d')!;

        // Fondo blanco para el procesamiento de color
        ctxObj.fillStyle = '#ffffff';
        ctxObj.fillRect(0, 0, TARGET_SIZE, TARGET_SIZE);

        // Contain con margen para que el logo quepa holgadamente dentro del círculo de pines
        const margin = TARGET_SIZE * 0.15;
        const usableSize = TARGET_SIZE - margin * 2;
        const scale = Math.min(usableSize / img.width, usableSize / img.height);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = (TARGET_SIZE - w) / 2;
        const y = (TARGET_SIZE - h) / 2;

        ctxObj.drawImage(img, x, y, w, h);

        // Convertir a escala de grises invertida
        const imgData = ctxObj.getImageData(0, 0, TARGET_SIZE, TARGET_SIZE);
        const data = imgData.data;
        const floatData = new Float32Array(TARGET_SIZE * TARGET_SIZE);
        const radius = TARGET_SIZE / 2;

        for (let cy = 0; cy < TARGET_SIZE; cy++) {
          for (let cx = 0; cx < TARGET_SIZE; cx++) {
            const idx = (cy * TARGET_SIZE + cx) * 4;
            const dist = Math.sqrt(Math.pow(cx - radius, 2) + Math.pow(cy - radius, 2));

            if (dist > radius) {
              floatData[cy * TARGET_SIZE + cx] = 0;
            } else {
              const r = data[idx];
              const g = data[idx + 1];
              const b = data[idx + 2];
              const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
              floatData[cy * TARGET_SIZE + cx] = 255 - luminance;
            }
          }
        }

        // 2. Precalcular la secuencia de hilos (90 iteraciones para evitar hilos cruzados tardíos)
        const algoParams = {
          width: TARGET_SIZE,
          height: TARGET_SIZE,
          totalPins: 180,
          maxIterations: 90,
          lineWeight: 28,
          penaltyMultiplier: 1.5,
          minPinDistance: 15,
          boardRadius: 250
        };

        const algo = new GreedyAlgorithm(floatData, algoParams);
        const pins = generatePinCoordinates(180, TARGET_SIZE, TARGET_SIZE);

        const sequence: number[] = [0];
        for (let i = 0; i < 90; i++) {
          const result = algo.computeNextLine();
          if (!result) break;
          sequence.push(result.nextPin);
        }

        setIsReady(true);

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const startTime = performance.now();
        const TOTAL_DURATION = 3000; // 3 segundos de transición/espera
        const WEAVE_DURATION = 2200; // 2.2 segundos tejiendo, 0.8s estático para apreciar el resultado

        const easeInOutCubic = (x: number) => {
          return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
        };

        const animate = (currentTime: number) => {
          if (!active) return;

          const elapsed = currentTime - startTime;

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

          // 1. Dibujar hilos normales con dorado sutil y elegante
          const normalLinesCount = Math.max(0, linesToDraw - 8);
          ctx.strokeStyle = 'rgba(212, 175, 55, 0.4)';
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
            ctx.strokeStyle = 'rgba(212, 175, 55, 0.85)';
            ctx.lineWidth = 1.5;
            ctx.shadowColor = '#d4af37';
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

          // 3. Dibujar la aguja dorada brillante (el punto en movimiento con pulso de luz)
          if (linesToDraw > 0) {
            const lastPinIdx = sequence[linesToDraw];
            const needlePos = pins[lastPinIdx];

            ctx.save();
            // Efecto de pulso de brillo
            const pulse = elapsed > WEAVE_DURATION
              ? 12 + Math.sin((elapsed - WEAVE_DURATION) * 0.015) * 3
              : 8;

            ctx.shadowColor = '#d4af37';
            ctx.shadowBlur = pulse;
            ctx.fillStyle = '#ffffff'; // Centro blanco de alta intensidad lumínica
            ctx.strokeStyle = '#d4af37'; // Contorno dorado
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
      } catch (err) {
        console.error("Error in splash screen animation", err);
        router.push(`/${locale}/editor`);
      }
    };

    img.onerror = () => {
      console.error("Error loading logo image");
      router.push(`/${locale}/editor`);
    };

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
        <img ref={logoRef} src="/hagalo-logo.png" alt="HÁGALO" className={styles.logoImage} />
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
