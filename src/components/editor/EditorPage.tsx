"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { ImageUploader } from './ImageUploader';
import { ConfigPanel } from './ConfigPanel';
import { ImageAdjuster } from './ImageAdjuster';
import { CanvasRenderer } from './CanvasRenderer';
import { useStringArtWorker } from '../../hooks/useStringArtWorker';
import { useGuidedSession } from '../../hooks/useGuidedSession';
import { loadImage, processImage } from '../../utils/imageProcessor';
import { ImageAdjustments, CropTransform, DEFAULT_ADJUSTMENTS, DEFAULT_CROP } from '../../utils/imageAdjustments';
import { AlgorithmParams } from '../../core/algorithm/types';
import styles from './editor.module.css';

const CANVAS_SIZE = 500;

const DEFAULT_PARAMS: AlgorithmParams = {
  width: CANVAS_SIZE,
  height: CANVAS_SIZE,
  totalPins: 240,
  maxIterations: 3000,
  lineWeight: 25,
  penaltyMultiplier: 2.0,
  minPinDistance: 20,
  boardRadius: 250
};

export function EditorPage() {
  const t = useTranslations('Index');
  const router = useRouter();
  const paramsRoute = useParams();
  const locale = (paramsRoute.locale as string) || 'es';
  const { session, startSession, clearSession } = useGuidedSession();

  const [params, setParams] = useState<AlgorithmParams>(DEFAULT_PARAMS);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pixelData, setPixelData] = useState<Float32Array | null>(null);
  const [adjustments, setAdjustments] = useState<ImageAdjustments>(DEFAULT_ADJUSTMENTS);
  const [crop, setCrop] = useState<CropTransform>(DEFAULT_CROP);
  
  // Store the raw loaded image so we can reprocess on adjustment changes
  const sourceImageRef = useRef<HTMLImageElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const worker = useStringArtWorker();

  // Reprocess image when adjustments or crop change
  const reprocessImage = useCallback(() => {
    const img = sourceImageRef.current;
    if (!img) return;

    const { imageData, previewUrl } = processImage(img, CANVAS_SIZE, adjustments, crop);
    setPixelData(imageData);
    setPreviewUrl(previewUrl);
  }, [adjustments, crop]);

  // Debounced reprocess on adjustment/crop changes
  useEffect(() => {
    if (!sourceImageRef.current) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      reprocessImage();
    }, 100);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [reprocessImage]);

  const handleImageSelected = async (file: File) => {
    // Guard: warn user if there's an active session
    if (session) {
      const confirmed = window.confirm(
        'You have a project in progress. Uploading a new image will erase all your progress. Continue?'
      );
      if (!confirmed) return;
      clearSession();
    }

    try {
      worker.reset();
      
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }

      const { img, objectUrl } = await loadImage(file);
      sourceImageRef.current = img;
      objectUrlRef.current = objectUrl;

      setAdjustments(DEFAULT_ADJUSTMENTS);
      setCrop(DEFAULT_CROP);

      const result = processImage(img, CANVAS_SIZE);
      setPixelData(result.imageData);
      setPreviewUrl(result.previewUrl);
    } catch (err) {
      console.error("Failed to process image", err);
    }
  };

  const handleGenerate = () => {
    if (pixelData) {
      worker.start(pixelData, params);
    }
  };

  const handleResetAdjustments = () => {
    setAdjustments(DEFAULT_ADJUSTMENTS);
    setCrop(DEFAULT_CROP);
  };

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        {session && (
          <div className={styles.banner} style={{
            background: 'rgba(212, 175, 55, 0.12)',
            border: '1px solid #d4af37',
            borderRadius: '8px',
            padding: '12px',
            width: '100%',
            marginBottom: '16px',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1, paddingRight: '8px' }}>
                <h4 style={{ margin: 0, color: '#fff', fontSize: '0.95rem' }}>Project in progress</h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#aaa' }}>
                  Step {session.currentStep + 1} of {session.totalSteps + 1} ({Math.round((session.currentStep / session.totalSteps) * 100)}%)
                </p>
              </div>
              <button
                onClick={() => router.push(`/${locale}/guide`)}
                style={{
                  background: '#d4af37',
                  color: '#111',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                Continue
              </button>
            </div>
            <button
              onClick={() => {
                const confirmed = window.confirm(
                  'This will erase all your progress. Are you sure?'
                );
                if (confirmed) clearSession();
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#ef4444',
                cursor: 'pointer',
                fontSize: '0.8rem',
                marginTop: '8px',
                padding: 0,
                textDecoration: 'underline'
              }}
            >
              Cancel project
            </button>
          </div>
        )}

        <h2 className={styles.title}>{t('title')} Editor</h2>
        
        <div className={styles.stepOne}>
          <ImageUploader 
            onImageSelected={handleImageSelected} 
            disabled={worker.isRunning} 
          />
        </div>

        {sourceImageRef.current && (
          <div className={styles.adjuster}>
            <ImageAdjuster
              adjustments={adjustments}
              crop={crop}
              onAdjustmentsChange={setAdjustments}
              onCropChange={setCrop}
              onReset={handleResetAdjustments}
              disabled={worker.isRunning}
            />
          </div>
        )}
        
        <div className={styles.stepTwo}>
          <ConfigPanel 
            params={params} 
            onChange={setParams} 
            disabled={worker.isRunning} 
          />
        </div>

        <div className={styles.stepThree}>
          <div className={styles.panel}>
            <h3>3. Generate</h3>
            <button 
              className={styles.button} 
              onClick={handleGenerate}
              disabled={!pixelData || worker.isRunning}
            >
              {worker.isRunning ? `Generating... (${worker.progress}/${worker.total})` : 'Start Generation'}
            </button>
            
            {worker.sequence && !worker.isRunning && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                <button 
                  className={styles.button}
                  style={{ backgroundColor: '#2196F3' }}
                  onClick={() => {
                    startSession(Array.from(worker.sequence!), params.totalPins, params.maxIterations);
                    router.push(`/${locale}/guide`);
                  }}
                >
                  Modo Guiado 🚀
                </button>
                <button 
                  className={styles.button}
                  style={{ backgroundColor: '#4CAF50' }}
                  onClick={() => {
                    navigator.clipboard.writeText(worker.sequence!.join(','));
                    alert('Secuencia copiada al portapapeles!');
                  }}
                >
                  Copiar Secuencia
                </button>
              </div>
            )}

            {worker.error && <p style={{ color: 'red', marginTop: '8px' }}>{worker.error}</p>}
          </div>
        </div>
      </div>

      <CanvasRenderer 
        sequence={worker.sequence} 
        totalPins={params.totalPins} 
        canvasSize={CANVAS_SIZE} 
        previewUrl={previewUrl}
      />
    </div>
  );
}
