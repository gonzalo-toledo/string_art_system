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
import { AlgorithmParams, GuidedSession } from '../../core/algorithm/types';
import { CANVAS_SIZE, DEFAULT_PARAMS } from '../../core/kit-spec';
import { exportPDFGuide } from '../../utils/pdf-generator';
import { Play, Copy, Download } from '../shared/icons';
import { RestoreButton } from '../backup/restore-button';
import styles from './editor.module.css';

const EDITOR_STATE_KEY = 'stringo-editor-state';
const GUIDED_SESSION_KEY = 'hacelo-art-session';

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
  const { session, clearSession } = useGuidedSession();

  const [params, setParams] = useState<AlgorithmParams>(DEFAULT_PARAMS);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [pixelData, setPixelData] = useState<Float32Array | null>(null);
  const [adjustments, setAdjustments] = useState<ImageAdjustments>(DEFAULT_ADJUSTMENTS);
  const [crop, setCrop] = useState<CropTransform>(DEFAULT_CROP);
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // Referencia a la imagen original cargada (para reprocesar al cambiar ajustes)
  const sourceImageRef = useRef<HTMLImageElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const worker = useStringArtWorker();

  // Restaurar el estado generado al montar (si existe en localStorage)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(EDITOR_STATE_KEY);
      if (raw) {
        const state = JSON.parse(raw);
        if (state.sequence && state.sequence.length > 1) {
          worker.restore(
            new Uint16Array(state.sequence),
            state.totalMeters || 0
          );
          if (state.params) {
            setParams(state.params);
          }
        }
      }
    } catch {
      localStorage.removeItem(EDITOR_STATE_KEY);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo al montar

  // Guardar automáticamente cuando se genera una secuencia
  useEffect(() => {
    if (worker.sequence && worker.sequence.length > 1) {
      const state = {
        sequence: Array.from(worker.sequence),
        totalMeters: worker.totalMeters,
        params
      };
      try {
        localStorage.setItem(EDITOR_STATE_KEY, JSON.stringify(state));
      } catch (e) {
        if (e instanceof DOMException && e.name === 'QuotaExceededError') {
          console.error('localStorage quota exceeded — editor state not saved');
        }
      }
    }
  }, [worker.sequence, worker.totalMeters, params]);

  // Controlar cambios de crop limitando el offset según el espacio disponible (evita drag si no hay zoom)
  const handleCropChange = useCallback((newCrop: CropTransform) => {
    const img = sourceImageRef.current;
    if (!img) {
      setCrop(newCrop);
      return;
    }

    const baseScale = Math.max(CANVAS_SIZE / img.width, CANVAS_SIZE / img.height);
    const scale = baseScale * newCrop.zoom;
    const scaledW = img.width * scale;
    const scaledH = img.height * scale;

    const maxOffsetX = (scaledW - CANVAS_SIZE) / 2;
    const maxOffsetY = (scaledH - CANVAS_SIZE) / 2;

    const adjustedCrop = {
      zoom: newCrop.zoom,
      offsetX: maxOffsetX > 0.01 ? Math.max(-1, Math.min(1, newCrop.offsetX)) : 0,
      offsetY: maxOffsetY > 0.01 ? Math.max(-1, Math.min(1, newCrop.offsetY)) : 0,
    };

    setCrop(adjustedCrop);
  }, []);

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
    setImageError(null);

    // Validar tipo de archivo — solo imágenes rasterizadas
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setImageError(t('imageErrorInvalidType'));
      return;
    }

    // Validar tamaño — máximo 20MB
    const MAX_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setImageError(t('imageErrorTooLarge'));
      return;
    }

    try {
      worker.reset();
      localStorage.removeItem(EDITOR_STATE_KEY);

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
      console.error("Error processing image", err);
      setImageError(t('imageErrorGeneric'));
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

  // Cancelar/resetear el proyecto activo
  const handleCancelProject = () => {
    const confirmed = window.confirm(t('confirmCancel'));
    if (confirmed) {
      worker.reset();
      localStorage.removeItem(EDITOR_STATE_KEY);
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      sourceImageRef.current = null;
      setSourceImage(null);
      setPreviewUrl(null);
      setPixelData(null);
      setAdjustments(DEFAULT_ADJUSTMENTS);
      setCrop(DEFAULT_CROP);
      clearSession();
    }
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

  // Variable calculada: ¿estamos en vista simplificada (proyecto en progreso)?
  const isInProgress = !!session && !!worker.sequence;

  return (
    <div
      className={styles.container}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* <h2 className={styles.pageTitle}>{t('title')}</h2> */}

      <div className={styles.editorContent}>
        <div className={styles.sidebar}>
          {/* Paso 1: Subir imagen */}
          <div className={`${styles.stepOne} ${isInProgress ? styles.hideOnMobileInProgress : ''}`}>
            <ImageUploader
              onImageSelected={handleImageSelected}
              disabled={worker.isRunning || isInProgress}
              hasImage={!!sourceImage}
              previewUrl={objectUrlRef.current}
            />
            {imageError && (
              <div style={{
                marginTop: '8px',
                padding: '10px 12px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                borderRadius: '8px',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                {imageError}
              </div>
            )}
          </div>

          {/* Paso 2: Configuración del algoritmo */}
          <div className={`${styles.stepTwo} ${isInProgress ? styles.hideOnMobileInProgress : ''}`}>
            <ConfigPanel
              params={params}
              onChange={setParams}
              disabled={worker.isRunning || isInProgress}
            />
          </div>

          {/* Paso 3: Generar y resultados / Panel de control del proyecto activo */}
          <div className={styles.stepThree}>
            {isInProgress ? (
              <div className={styles.panel}>
                <h3 className={styles.panelHeaderTitle} style={{ marginBottom: '12px' }}>
                  {t('projectInProgress')}
                </h3>
                <div className={styles.panelContent}>
                  <p className={styles.panelDescription} style={{ color: '#aaa', marginBottom: '16px' }}>
                    {t('stepProgress', {
                      current: session.currentStep + 1,
                      total: session.totalSteps + 1,
                      percent: Math.round((session.currentStep / session.totalSteps) * 100)
                    })}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button
                      className={`${styles.button} ${styles.buttonAccent}`}
                      onClick={() => router.push(`/${locale}/guide`)}
                    >
                      <div className={styles.buttonContent}>
                        <Play size={18} fill="currentColor" />
                        <span>{t('continue')}</span>
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
                    <button
                      onClick={handleCancelProject}
                      className={styles.cancelLink}
                    >
                      {t('cancelProject')}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.panel}>
                <h3 className={styles.panelHeaderTitle} style={{ marginBottom: '12px' }}>
                  {t('generateTitle')}
                </h3>
                <div className={styles.panelContent}>
                  <button
                    className={styles.button}
                    onClick={handleGenerate}
                    disabled={!pixelData || worker.isRunning}
                  >
                    {worker.isRunning
                      ? t('generating', { progress: worker.progress, total: worker.total })
                      : worker.sequence
                        ? t('regenerate')
                        : t('startGeneration')
                    }
                  </button>

                  {/* Botones post-generación siempre visibles en desktop pero ocultos en mobile si no se generó aún */}
                  <div className={`${styles.actionButtonsContainer} ${!worker.sequence ? styles.actionButtonsContainerHiddenMobile : ''}`}>
                    <button
                      className={`${styles.button} ${styles.buttonAccent}`}
                      disabled={!worker.sequence || worker.isRunning}
                      onClick={() => {
                        if (worker.sequence) {
                          // Write session directly to localStorage without triggering
                          // a React state update (which would re-render the editor
                          // and cause a visual flash before navigation completes).
                          const newSession: GuidedSession = {
                            sequence: Array.from(worker.sequence),
                            currentStep: 0,
                            totalSteps: worker.sequence.length - 1,
                            config: { totalPins: params.totalPins, maxIterations: params.maxIterations },
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                          };
                          try {
                            localStorage.setItem(GUIDED_SESSION_KEY, JSON.stringify(newSession));
                            router.push(`/${locale}/guide`);
                          } catch (e) {
                            if (e instanceof DOMException && e.name === 'QuotaExceededError') {
                              console.error('localStorage quota exceeded — cannot start guided mode');
                            }
                          }
                        }
                      }}
                    >
                      <div className={styles.buttonContent}>
                        <Play size={18} fill="currentColor" />
                        <span>{t('guidedMode')}</span>
                      </div>
                    </button>
                    <button
                      className={`${styles.button} ${styles.buttonOutline}`}
                      disabled={!worker.sequence || worker.isRunning}
                      onClick={() => {
                        if (worker.sequence) {
                          exportPDFGuide({
                            sequence: worker.sequence,
                            totalPins: params.totalPins,
                            maxIterations: params.maxIterations,
                            totalMeters: worker.totalMeters,
                            locale: locale as 'es' | 'en' | 'pt'
                          });
                        }
                      }}
                    >
                      <div className={styles.buttonContent}>
                        <Download size={18} />
                        <span>{t('exportPDF')}</span>
                      </div>
                    </button>
                  </div>

                  {worker.error && <p style={{ color: 'red', marginTop: '8px' }}>{worker.error}</p>}
                </div>
              </div>
            )}
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
          onCropChange={handleCropChange}
          disabled={worker.isRunning || !!worker.sequence}
        />

        {/* Columna Derecha: Ajustes de imagen */}
        <div className={`${styles.adjuster} ${!sourceImage ? styles.hideOnMobileWithoutImage : ''} ${isInProgress ? styles.hideOnMobileInProgress : ''}`}>
          <ImageAdjuster
            adjustments={adjustments}
            crop={crop}
            onAdjustmentsChange={setAdjustments}
            onCropChange={handleCropChange}
            onReset={handleResetAdjustments}
            disabled={worker.isRunning || isInProgress || !sourceImage || !!worker.sequence}
          />

          {worker.sequence && !isInProgress && (
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '16px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginTop: '16px'
              }}
            >
              <span className={styles.panelDescription} style={{ color: '#ccc' }}>
                {t('sequenceGeneratedLock')}
              </span>
              <button
                className={`${styles.button} ${styles.buttonOutline}`}
                onClick={() => {
                  worker.reset();
                  localStorage.removeItem(EDITOR_STATE_KEY);
                }}
                style={{ width: '100%', padding: '8px 12px', marginTop: 0 }}
              >
                {t('backToEdit')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Restore button - debajo del canvas en desktop, solo cuando no hay sesión activa */}
      {!isInProgress && !worker.sequence && (
        <div className={styles.restoreContainer}>
          <p className={styles.restoreLabel}>
            {t('restoreBackup')}
          </p>
          <RestoreButton 
            onRestoreComplete={() => window.location.reload()}
          />
        </div>
      )}

      {/* Overlay de drag & drop (solo desktop) */}
      {isDragging && (
        <div className={`${styles.dragOverlay} ${styles.desktopOnly}`}>
          <span>{t('dropImageHere')}</span>
        </div>
      )}
    </div>
  );
}
