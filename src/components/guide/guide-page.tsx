"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useGuidedSession } from '../../hooks/useGuidedSession';
import { useWakeLock } from '../../hooks/useWakeLock';
import { usePinSpeech } from '../../hooks/usePinSpeech';
import { generatePinCoordinates } from '../../core/algorithm/bresenham';
import styles from './guide.module.css';

export function GuidePage() {
  const t = useTranslations('Guide');
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as 'es' | 'en' | 'pt') || 'es';

  const { session, isLoaded, updateStep, clearSession } = useGuidedSession();
  const { request: requestWakeLock, release: releaseWakeLock, isActive: isWakeLockActive } = useWakeLock();

  // Initialize Speech hook
  const { speak, isEnabled: isSpeechEnabled, toggleEnabled: toggleSpeech } = usePinSpeech(locale);

  // Guided navigation state
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(2000); // ms per step
  const [isVisualizerOpen, setIsVisualizerOpen] = useState(false);
  const [isSequenceListOpen, setIsSequenceListOpen] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const touchStartX = useRef<number | null>(null);

  // Request wake lock when session is loaded and active
  useEffect(() => {
    if (isLoaded && session) {
      requestWakeLock();
    }
    return () => {
      releaseWakeLock();
    };
  }, [isLoaded, session, requestWakeLock, releaseWakeLock]);

  // Handle auto speech when step changes
  useEffect(() => {
    if (session && session.currentStep < session.totalSteps) {
      const targetPin = session.sequence[session.currentStep + 1];
      speak(targetPin);
    }
  }, [session?.currentStep, speak, session?.sequence, session?.totalSteps]);

  // Autoplay functionality
  useEffect(() => {
    if (!isPlaying || !session) return;

    const interval = setInterval(() => {
      if (session.currentStep < session.totalSteps) {
        updateStep(session.currentStep + 1);
      } else {
        setIsPlaying(false);
      }
    }, playSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, session, playSpeed, updateStep]);

  // Handle locale change route redirect
  const handleLocaleChange = (newLocale: string) => {
    // If route contains locale, replace it
    const currentPath = window.location.pathname;
    const newPath = currentPath.replace(/^\/[a-z]{2}/, `/${newLocale}`);
    router.push(newPath);
  };

  const handleNext = useCallback(() => {
    if (!session) return;
    if (session.currentStep < session.totalSteps) {
      updateStep(session.currentStep + 1);
    }
  }, [session, updateStep]);

  const handlePrev = useCallback(() => {
    if (!session) return;
    if (session.currentStep > 0) {
      updateStep(session.currentStep - 1);
    }
  }, [session, updateStep]);

  const handleRepeatSpeech = () => {
    if (!session) return;
    const targetPin = session.sequence[session.currentStep + 1];
    if (targetPin !== undefined) {
      speak(targetPin);
    }
  };

  // Draw current preview onto canvas inside modal
  useEffect(() => {
    if (!isVisualizerOpen || !session || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    ctx.clearRect(0, 0, size, size);

    // Draw white board background (matches real product)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    const boardRadius = size / 2 - 10;
    const centerX = size / 2;
    const centerY = size / 2;

    ctx.beginPath();
    ctx.arc(centerX, centerY, boardRadius, 0, Math.PI * 2);
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 2;
    ctx.stroke();

    const pins = generatePinCoordinates(session.config.totalPins, size, size);

    // Draw completed lines — realistic sewing thread rendering:
    // Ultra-thin lines with low opacity, image builds by ACCUMULATION
    ctx.lineWidth = 0.3;
    ctx.strokeStyle = 'rgba(10, 10, 10, 0.09)';
    for (let i = 0; i <= session.currentStep; i++) {
      if (i + 1 < session.sequence.length) {
        const pA = pins[session.sequence[i]];
        const pB = pins[session.sequence[i + 1]];
        ctx.beginPath();
        ctx.moveTo(pA.x, pA.y);
        ctx.lineTo(pB.x, pB.y);
        ctx.stroke();
      }
    }

    // Draw active line highlighted
    if (session.currentStep < session.totalSteps) {
      const pStart = pins[session.sequence[session.currentStep]];
      const pEnd = pins[session.sequence[session.currentStep + 1]];
      ctx.beginPath();
      ctx.strokeStyle = '#d4af37';
      ctx.lineWidth = 1.5;
      ctx.moveTo(pStart.x, pStart.y);
      ctx.lineTo(pEnd.x, pEnd.y);
      ctx.stroke();
    }

    // Draw pins
    pins.forEach((p, idx) => {
      const isCurrentOrigin = idx === session.sequence[session.currentStep];
      const isCurrentTarget = idx === session.sequence[session.currentStep + 1];

      if (isCurrentTarget) {
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (isCurrentOrigin) {
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#999';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }, [isVisualizerOpen, session]);

  // Touch Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchStartX.current - touchEndX;

    // swipe left (next), swipe right (prev)
    if (diffX > 60) {
      handleNext();
    } else if (diffX < -60) {
      handlePrev();
    }
    touchStartX.current = null;
  };

  if (!isLoaded) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <div className={styles.loader}></div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <p>{t('noSession')}</p>
          <button 
            className={styles.modalCloseBtn} 
            onClick={() => router.push(`/${locale}/editor`)}
            style={{ maxWidth: '200px' }}
          >
            {t('backToEditor')}
          </button>
        </div>
      </div>
    );
  }

  const isCompleted = session.currentStep >= session.totalSteps;
  const currentPin = session.sequence[session.currentStep];
  const targetPin = isCompleted ? null : session.sequence[session.currentStep + 1];
  const progressPercent = Math.round((session.currentStep / session.totalSteps) * 100);

  if (isCompleted) {
    return (
      <div className={styles.container}>
        <div className={styles.completedOverlay}>
          <div className={styles.celebrationIcon}>🎉</div>
          <h1 className={styles.completedTitle}>{t('completed')}</h1>
          <p className={styles.completedDesc}>{t('celebration')}</p>
          
          <button 
            className={styles.btn} 
            style={{ backgroundColor: 'var(--color-accent)', color: '#111', padding: '16px 32px', borderRadius: '12px', fontSize: '1.1rem', width: '100%', maxWidth: '300px' }}
            onClick={() => {
              updateStep(0);
            }}
          >
            {t('startOver')}
          </button>

          <button 
            className={styles.btn} 
            style={{ backgroundColor: '#333', color: '#fff', padding: '16px 32px', borderRadius: '12px', fontSize: '1.1rem', width: '100%', maxWidth: '300px', marginTop: '12px' }}
            onClick={() => {
              clearSession();
              router.push(`/${locale}/editor`);
            }}
          >
            {t('backToEditor')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header section */}
      <div className={styles.header}>
        <button 
          className={styles.iconButton} 
          onClick={() => router.push(`/${locale}/editor`)}
          aria-label="Back to Editor"
        >
          ⬅️
        </button>
        <h1 className={styles.headerTitle}>{t('title')}</h1>
        
        <div className={styles.headerActions}>
          <select 
            value={locale} 
            onChange={(e) => handleLocaleChange(e.target.value)}
            className={styles.languageSelect}
          >
            <option value="es">ES</option>
            <option value="en">EN</option>
            <option value="pt">PT</option>
          </select>

          <button 
            className={`${styles.iconButton} ${isSpeechEnabled ? styles.iconButtonActive : ''}`} 
            onClick={toggleSpeech}
            title={t('audio')}
          >
            {isSpeechEnabled ? '🔊' : '🔇'}
          </button>

          <button 
            className={styles.iconButton} 
            onClick={() => setIsVisualizerOpen(true)}
            title={t('visualize')}
          >
            👁️
          </button>

          <button 
            className={styles.iconButton} 
            onClick={() => setIsSequenceListOpen(true)}
            title={t('sequenceList')}
          >
            📋
          </button>
        </div>
      </div>

      {/* Progress display */}
      <div className={styles.progressSection}>
        <div className={styles.progressText}>
          <span>{t('step', { current: session.currentStep + 1, total: session.totalSteps + 1 })}</span>
          <span>{progressPercent}%</span>
        </div>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>

      {/* Main Touch area */}
      <div 
        className={styles.centerSection}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <span className={styles.label}>{t('toPin')}</span>
        <div className={styles.targetPinContainer} onClick={handleRepeatSpeech}>
          <span className={styles.targetPinNumber}>{targetPin}</span>
        </div>
        <div className={styles.originPin}>
          {t('fromPin')}: <span className={styles.originPinHighlight}>{currentPin}</span>
        </div>
      </div>

      {/* Footer controls */}
      <div className={styles.controlsSection}>
        <div className={styles.navButtons}>
          <button className={`${styles.btn} ${styles.btnPrev}`} onClick={handlePrev}>
            ◀️ {t('prev')}
          </button>
          <button className={`${styles.btn} ${styles.btnNext}`} onClick={handleNext}>
            {t('next')} ▶️
          </button>
        </div>

        <div className={styles.subControls}>
          <div className={styles.autoplayGroup}>
            <button 
              className={`${styles.btnPlayPause} ${isPlaying ? styles.btnPlayPauseActive : ''}`}
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? '⏸️' : '▶️'} {t('play')}
            </button>

            {isPlaying && (
              <select 
                value={playSpeed} 
                onChange={(e) => setPlaySpeed(Number(e.target.value))}
                className={styles.speedSelector}
              >
                <option value={1000}>1.0s</option>
                <option value={1500}>1.5s</option>
                <option value={2000}>2.0s</option>
                <option value={3000}>3.0s</option>
                <option value={4000}>4.0s</option>
                <option value={5000}>5.0s</option>
              </select>
            )}
          </div>

          <div className={`${styles.wakeLockIndicator} ${isWakeLockActive ? styles.wakeLockIndicatorActive : ''}`}>
            {isWakeLockActive ? '🟢 WakeLock' : '🔴 WakeLock'}
          </div>
        </div>
      </div>

      {/* Visualizer Modal */}
      {isVisualizerOpen && (
        <div className={styles.overlay} onClick={() => setIsVisualizerOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>{t('visualize')}</h2>
            <div className={styles.modalCanvasContainer}>
              <canvas 
                ref={canvasRef} 
                width={350} 
                height={350} 
                className={styles.modalCanvas}
              />
            </div>
            <button 
              className={styles.modalCloseBtn} 
              onClick={() => setIsVisualizerOpen(false)}
            >
              {t('close')}
            </button>
          </div>
        </div>
      )}

      {/* Sequence List Modal */}
      {isSequenceListOpen && (
        <div className={styles.overlay} onClick={() => setIsSequenceListOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxHeight: '85vh' }}>
            <h2 className={styles.modalTitle}>{t('sequenceList')}</h2>
            <div className={styles.sequenceListContainer}>
              {session.sequence.map((pin, idx) => {
                if (idx === session.sequence.length - 1) return null;
                const nextPin = session.sequence[idx + 1];
                const isDone = idx < session.currentStep;
                const isCurrent = idx === session.currentStep;
                let rowClass = styles.seqRow;
                if (isDone) rowClass += ' ' + styles.seqRowDone;
                if (isCurrent) rowClass += ' ' + styles.seqRowCurrent;
                return (
                  <div key={idx} className={rowClass}>
                    <span className={styles.seqStep}>{idx + 1}</span>
                    <span className={styles.seqPins}>{pin} → {nextPin}</span>
                    {isDone && <span className={styles.seqCheck}>✓</span>}
                  </div>
                );
              })}
            </div>
            <button 
              className={styles.modalCloseBtn} 
              onClick={() => setIsSequenceListOpen(false)}
            >
              {t('close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
