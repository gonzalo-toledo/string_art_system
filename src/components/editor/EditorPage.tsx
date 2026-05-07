"use client";
import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ImageUploader } from './ImageUploader';
import { ConfigPanel } from './ConfigPanel';
import { CanvasRenderer } from './CanvasRenderer';
import { useStringArtWorker } from '../../hooks/useStringArtWorker';
import { processImageToGrayscale } from '../../utils/imageProcessor';
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
  
  const worker = useStringArtWorker();

  const handleImageSelected = async (file: File) => {
    try {
      worker.reset();
      const { imageData, previewUrl } = await processImageToGrayscale(file, CANVAS_SIZE);
      setPixelData(imageData);
      setPreviewUrl(previewUrl);
    } catch (err) {
      console.error("Failed to process image", err);
    }
  };

  const handleGenerate = () => {
    if (pixelData) {
      worker.start(pixelData, params);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <h2>{t('title')} Editor</h2>
        
        <ImageUploader 
          onImageSelected={handleImageSelected} 
          disabled={worker.isRunning} 
        />
        
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
