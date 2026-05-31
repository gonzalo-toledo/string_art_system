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

        // 2. Precalcular la secuencia de hilos (150 iteraciones es perfecto para que no tape el logo)
        const algoParams = {
          width: TARGET_SIZE,
          height: TARGET_SIZE,
          totalPins: 180,
          maxIterations: 150,
          lineWeight: 28,
          penaltyMultiplier: 1.5,
          minPinDistance: 15,
          boardRadius: 250
        };

        const algo = new GreedyAlgorithm(floatData, algoParams);
        const pins = generatePinCoordinates(180, TARGET_SIZE, TARGET_SIZE);
        
        const sequence: number[] = [0];
        for (let i = 0; i < 150; i++) {
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
        const TOTAL_DURATION = 3000; // Exactamente 3 segundos
        const HALF_CYCLE = 1500;    // 1.5s por ciclo completo (coser + descoser)

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

          // Calcular en qué parte del ciclo de 1.5 segundos estamos
          const cycleElapsed = elapsed % HALF_CYCLE;
          let progress = 0;

          if (cycleElapsed < HALF_CYCLE / 2) {
            // Cociendo (0 a 750ms): de 0 a 100% de hilos
            progress = cycleElapsed / (HALF_CYCLE / 2);
          } else {
            // Descosiendo (750 a 1500ms): de 100% a 0 de hilos
            progress = 1 - (cycleElapsed - HALF_CYCLE / 2) / (HALF_CYCLE / 2);
          }

          // Cantidad de hilos a dibujar
          const linesToDraw = Math.floor(progress * (sequence.length - 1));

          // Limpiar lienzo
          ctx.clearRect(0, 0, TARGET_SIZE, TARGET_SIZE);

          // Dibujar líneas
          ctx.strokeStyle = 'rgba(212, 175, 55, 0.65)'; // Hilo dorado premium
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          
          for (let i = 0; i < linesToDraw; i++) {
            const p0 = pins[sequence[i]];
            const p1 = pins[sequence[i + 1]];
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p1.y);
          }
          ctx.stroke();

          // Dibujar la aguja dorada en la posición del último pin
          if (linesToDraw > 0) {
            const lastPinIdx = sequence[linesToDraw];
            const needlePos = pins[lastPinIdx];
            
            ctx.fillStyle = '#d4af37';
            ctx.shadowColor = '#d4af37';
            ctx.shadowBlur = 8;
            ctx.beginPath();
            ctx.arc(needlePos.x, needlePos.y, 3.5, 0, 2 * Math.PI);
            ctx.fill();
            
            // Reset de sombra para performance
            ctx.shadowBlur = 0;
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
      <style dangerouslySetInnerHTML={{ __html: `
        header, footer {
          display: none !important;
        }
      ` }} />

      <div className={styles.logoContainer}>
        <img src="/hagalo-logo.png" alt="HÁGALO" className={styles.logoImage} />
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
