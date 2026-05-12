"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { ImageUploader } from './ImageUploader';
import { ConfigPanel } from './ConfigPanel';
import { ImageAdjuster } from './ImageAdjuster';
import { CanvasRenderer } from './CanvasRenderer';
import { useStringArtWorker } from '../../hooks/useStringArtWorker';
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
    try {
      worker.reset();
      
      // Clean up previous object URL
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }

      const { img, objectUrl } = await loadImage(file);
      sourceImageRef.current = img;
      objectUrlRef.current = objectUrl;

      // Reset adjustments on new image
      setAdjustments(DEFAULT_ADJUSTMENTS);
      setCrop(DEFAULT_CROP);

      // Initial processing
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
        <h2>{t('title')} Editor</h2>
        
        <ImageUploader 
          onImageSelected={handleImageSelected} 
          disabled={worker.isRunning} 
        />

        {sourceImageRef.current && (
          <ImageAdjuster
            adjustments={adjustments}
            crop={crop}
            onAdjustmentsChange={setAdjustments}
            onCropChange={setCrop}
            onReset={handleResetAdjustments}
            disabled={worker.isRunning}
          />
        )}
        
        <ConfigPanel 
          params={params} 
          onChange={setParams} 
          disabled={worker.isRunning} 
        />

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
            <button 
              className={styles.button}
              style={{ marginTop: '10px', backgroundColor: '#4CAF50' }}
              onClick={() => {
                navigator.clipboard.writeText(worker.sequence!.join(','));
                alert('Secuencia copiada al portapapeles!');
              }}
            >
              Copiar Secuencia
            </button>
          )}

          {worker.error && <p style={{ color: 'red', marginTop: '8px' }}>{worker.error}</p>}
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
