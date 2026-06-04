"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { ImageUploader } from './image-uploader';
import { ConfigPanel } from './config-panel';
import { ImageAdjuster } from './image-adjuster';
import { CanvasRenderer } from './canvas-renderer';
import { CollapsiblePanel } from './collapsible-panel';
import { useStringArtWorker } from '../../hooks/use-string-art-worker';
import { useGuidedSession } from '../../hooks/use-guided-session';
import { loadImage, processImage } from '../../utils/image-processor';
import { ImageAdjustments, CropTransform, DEFAULT_ADJUSTMENTS, DEFAULT_CROP } from '../../utils/image-adjustments';
import { AlgorithmParams } from '../../core/algorithm/types';
import { CANVAS_SIZE, DEFAULT_PARAMS } from '../../core/kit-spec';
import { exportPDFGuide } from '../../utils/pdf-generator';
import { Play, Copy, Download } from '../shared/icons';
import styles from './editor.module.css';

/**
 * Página principal del editor.
 * Orquesta todo el flujo: subir imagen → ajustar → configurar → generar.
 *
 * Flujo de datos:
 * 1. El usuario sube una foto → se guarda en sourceImageRef
 * 2. Se procesa con los ajustes actuales → genera pixelData (Float32Array) + previewUrl
 * 3. Al modificar ajustes/crop → se reprocesa con debounce de 100ms
 * 4. Al presionar "Generar" → se envía pixelData al Web Worker
 * 5. El worker calcula y devuelve la secuencia de pines
 * 6. La secuencia se puede enviar al Modo Guiado o copiar al portapapeles
 */
export function EditorPage() {
  const t = useTranslations('Editor');
  const router = useRouter();
  const paramsRoute = useParams();
  const locale = (paramsRoute.locale as string) || 'es';
  const { session, startSession, clearSession } = useGuidedSession();

  const [params, setParams] = useState<AlgorithmParams>(DEFAULT_PARAMS);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pixelData, setPixelData] = useState<Float32Array | null>(null);
  const [adjustments, setAdjustments] = useState<ImageAdjustments>(DEFAULT_ADJUSTMENTS);
  const [crop, setCrop] = useState<CropTransform>(DEFAULT_CROP);
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Referencia a la imagen original cargada (para reprocesar al cambiar ajustes)
  const sourceImageRef = useRef<HTMLImageElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const worker = useStringArtWorker();

  // Reprocesar imagen cuando cambian ajustes o crop
  const reprocessImage = useCallback(() => {
    const img = sourceImageRef.current;
    if (!img) return;

    const { imageData, previewUrl } = processImage(img, CANVAS_SIZE, adjustments, crop);
    setPixelData(imageData);
    setPreviewUrl(previewUrl);
  }, [adjustments, crop]);

  // Reprocesar con debounce para no saturar con cada movimiento del slider
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

  // Manejar la selección de una nueva imagen
  const handleImageSelected = async (file: File) => {
    // Advertir si hay una sesión guiada en progreso
    if (session) {
      const confirmed = window.confirm(t('confirmNewImage'));
      if (!confirmed) return;
      clearSession();
    }

    try {
      worker.reset();

      // Liberar URL anterior si existe
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }

      const { img, objectUrl } = await loadImage(file);
      sourceImageRef.current = img;
      setSourceImage(img);
      objectUrlRef.current = objectUrl;

      // Resetear ajustes a valores por defecto
      setAdjustments(DEFAULT_ADJUSTMENTS);
      setCrop(DEFAULT_CROP);

      const result = processImage(img, CANVAS_SIZE);
      setPixelData(result.imageData);
      setPreviewUrl(result.previewUrl);
    } catch (err) {
      console.error("Error al procesar la imagen", err);
    }
  };

  // Iniciar la generación del string art
  const handleGenerate = () => {
    if (pixelData) {
      worker.start(pixelData, params);
    }
  };

  // Resetear todos los ajustes de imagen a valores por defecto
  const handleResetAdjustments = () => {
    setAdjustments(DEFAULT_ADJUSTMENTS);
    setCrop(DEFAULT_CROP);
  };

  // Drag & drop handlers (solo desktop)
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleImageSelected(file);
    }
  };

  // Limpiar el object URL al desmontar el componente
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  return (
    <div
      className={styles.container}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={styles.sidebar}>
        {/* Banner de sesión activa */}
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
                <h4 style={{ margin: 0, color: '#fff', fontSize: '0.95rem' }}>{t('projectInProgress')}</h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#aaa' }}>
                  {t('stepProgress', {
                    current: session.currentStep + 1,
                    total: session.totalSteps + 1,
                    percent: Math.round((session.currentStep / session.totalSteps) * 100)
                  })}
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
                {t('continue')}
              </button>
            </div>
            <button
              onClick={() => {
                const confirmed = window.confirm(t('confirmCancel'));
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
              {t('cancelProject')}
            </button>
          </div>
        )}

        <h2 className={styles.title}>{t('title')}</h2>

        {/* Paso 1: Subir imagen */}
        <div className={styles.stepOne}>
          <ImageUploader
            onImageSelected={handleImageSelected}
            disabled={worker.isRunning}
          />
        </div>

        {/* Panel de ajustes de imagen (solo visible después de subir foto) */}
        {sourceImage && (
          <div className={styles.adjuster}>
            {worker.sequence ? (
              <div 
                style={{ 
                  background: 'rgba(255, 255, 255, 0.03)', 
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <span style={{ fontSize: '0.85rem', color: '#aaa', lineHeight: '1.4' }}>
                  {t('sequenceGeneratedLock')}
                </span>
                <button
                  className={`${styles.button} ${styles.buttonOutline}`}
                  onClick={() => {
                    worker.reset();
                  }}
                  style={{ width: '100%', padding: '8px 12px', fontSize: '0.85rem' }}
                >
                  {t('backToEdit')}
                </button>
              </div>
            ) : (
              <ImageAdjuster
                adjustments={adjustments}
                crop={crop}
                onAdjustmentsChange={setAdjustments}
                onCropChange={setCrop}
                onReset={handleResetAdjustments}
                disabled={worker.isRunning}
              />
            )}
          </div>
        )}

        {/* Paso 2: Configuración del algoritmo */}
        <div className={styles.stepTwo}>
          <ConfigPanel
            params={params}
            onChange={setParams}
            disabled={worker.isRunning}
          />
        </div>

        {/* Paso 3: Generar y resultados */}
        <div className={styles.stepThree}>
          <CollapsiblePanel title={t('generateTitle')} defaultOpen={true}>
            <button
              className={styles.button}
              onClick={handleGenerate}
              disabled={!pixelData || worker.isRunning}
            >
              {worker.isRunning
                ? t('generating', { progress: worker.progress, total: worker.total })
                : t('startGeneration')
              }
            </button>

            {/* Botones post-generación */}
            {worker.sequence && !worker.isRunning && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
                <button
                  className={`${styles.button} ${styles.buttonAccent}`}
                  onClick={() => {
                    startSession(Array.from(worker.sequence!), params.totalPins, params.maxIterations);
                    router.push(`/${locale}/guide`);
                  }}
                >
                  <div className={styles.buttonContent}>
                    <Play size={18} fill="currentColor" />
                    <span>{t('guidedMode')}</span>
                  </div>
                </button>
                <button
                  className={`${styles.button} ${styles.buttonOutline}`}
                  onClick={() => {
                    navigator.clipboard.writeText(worker.sequence!.join(','));
                    alert(t('sequenceCopied'));
                  }}
                >
                  <div className={styles.buttonContent}>
                    <Copy size={18} />
                    <span>{t('copySequence')}</span>
                  </div>
                </button>
                <button
                  className={`${styles.button} ${styles.buttonOutline}`}
                  onClick={() => {
                    exportPDFGuide({
                      sequence: worker.sequence!,
                      totalPins: params.totalPins,
                      maxIterations: params.maxIterations,
                      totalMeters: worker.totalMeters,
                      locale: locale as 'es' | 'en' | 'pt'
                    });
                  }}
                >
                  <div className={styles.buttonContent}>
                    <Download size={18} />
                    <span>{t('exportPDF')}</span>
                  </div>
                </button>
              </div>
            )}

            {worker.error && <p style={{ color: 'red', marginTop: '8px' }}>{worker.error}</p>}
          </CollapsiblePanel>
        </div>
      </div>

      {/* Canvas de visualización */}
      <CanvasRenderer
        sequence={worker.sequence}
        totalPins={params.totalPins}
        canvasSize={CANVAS_SIZE}
        previewUrl={previewUrl}
        sourceImage={sourceImage}
        adjustments={adjustments}
        crop={crop}
        onCropChange={setCrop}
        disabled={worker.isRunning || !!worker.sequence}
      />

      {/* Overlay de drag & drop (solo desktop) */}
      {isDragging && (
        <div className={`${styles.dragOverlay} ${styles.desktopOnly}`}>
          <span>{t('dropImageHere')}</span>
        </div>
      )}
    </div>
  );
}
