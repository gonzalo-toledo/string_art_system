"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useGuidedSession } from '../../hooks/use-guided-session';
import { useWakeLock } from '../../hooks/use-wake-lock';
import { usePinSpeech } from '../../hooks/use-pin-speech';
import styles from './guide.module.css';

// Importación de iconos compartidos
import { Trophy } from '../shared/icons';

// Importación de los subcomponentes atomizados
import { GuideHeader } from './guide-header';
import { ProgressBar } from './progress-bar';
import { PinDisplay } from './pin-display';
import { GuideControls } from './guide-controls';
import { VisualizerModal } from './visualizer-modal';
import { SequenceListModal } from './sequence-list-modal';

/**
 * Pantalla principal del modo guiado (mobile-first).
 * Orquesta el estado del tejido, la síntesis de voz, wake lock y gestos,
 * delegando la interfaz en subcomponentes modulares.
 */
export function GuidePage() {
  // Hooks de traducción, navegación e i18n
  const t = useTranslations('Guide');
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as 'es' | 'en' | 'pt') || 'es';

  // Hooks personalizados de negocio
  const { session, isLoaded, updateStep, clearSession } = useGuidedSession();
  const { request: requestWakeLock, release: releaseWakeLock, isActive: isWakeLockActive } = useWakeLock();
  const { speak, isEnabled: isSpeechEnabled, toggleEnabled: toggleSpeech } = usePinSpeech(locale);

  // Estados locales para la reproducción automática y modales
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(2000); // ms por paso
  const [isVisualizerOpen, setIsVisualizerOpen] = useState(false);
  const [isSequenceListOpen, setIsSequenceListOpen] = useState(false);

  // Referencia para detectar el inicio de gestos táctiles (swipe)
  const touchStartX = useRef<number | null>(null);

  // Activar wake lock para prevenir suspensión de pantalla durante el tejido
  useEffect(() => {
    if (isLoaded && session) {
      requestWakeLock();
    }
    return () => {
      releaseWakeLock();
    };
  }, [isLoaded, session, requestWakeLock, releaseWakeLock]);

  // Reproducir por voz automáticamente cuando el paso actual cambia
  useEffect(() => {
    if (session && session.currentStep < session.totalSteps) {
      const targetPin = session.sequence[session.currentStep + 1];
      speak(targetPin);
    }
  }, [session?.currentStep, speak, session?.sequence, session?.totalSteps]);

  // Manejo del intervalo para la reproducción automática (autoplay)
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

  // Avanzar al siguiente paso del tejido
  const handleNext = useCallback(() => {
    if (!session) return;
    if (session.currentStep < session.totalSteps) {
      updateStep(session.currentStep + 1);
    }
  }, [session, updateStep]);

  // Retroceder al paso anterior del tejido
  const handlePrev = useCallback(() => {
    if (!session) return;
    if (session.currentStep > 0) {
      updateStep(session.currentStep - 1);
    }
  }, [session, updateStep]);

  // Repetir la locución por voz del pin de destino
  const handleRepeatSpeech = () => {
    if (!session) return;
    const targetPin = session.sequence[session.currentStep + 1];
    if (targetPin !== undefined) {
      speak(targetPin);
    }
  };

  // Manejadores de gestos táctiles para dispositivos móviles (swipe izquierdo/derecho)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchStartX.current - touchEndX;

    // Umbral de 60px para el gesto
    // Swipe izquierda = siguiente paso, swipe derecha = paso anterior
    if (diffX > 60) {
      handleNext();
    } else if (diffX < -60) {
      handlePrev();
    }
    touchStartX.current = null;
  };

  // --- Renderizado de estados especiales ---

  // Estado de carga inicial
  if (!isLoaded) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <div className={styles.loader}></div>
        </div>
      </div>
    );
  }

  // Estado sin sesión activa cargada
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

  // Variables calculadas a partir de la sesión actual
  const isCompleted = session.currentStep >= session.totalSteps;
  const currentPin = session.sequence[session.currentStep];
  const targetPin = isCompleted ? null : session.sequence[session.currentStep + 1];
  const progressPercent = Math.round((session.currentStep / session.totalSteps) * 100);

  // Pantalla de celebración / cuadro finalizado
  if (isCompleted) {
    return (
      <div className={styles.container}>
        <div className={styles.completedOverlay}>
          <div className={styles.celebrationIcon}>
            <Trophy size={48} strokeWidth={1.5} style={{ color: 'var(--color-accent)' }} />
          </div>
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

  // --- Renderizado de la pantalla de guiado estándar ---
  return (
    <div className={styles.container}>
      {/* 1. Encabezado de la página */}
      <GuideHeader
        onBack={() => router.push(`/${locale}/editor`)}
        isSpeechEnabled={isSpeechEnabled}
        onToggleSpeech={toggleSpeech}
        onOpenVisualizer={() => setIsVisualizerOpen(true)}
        onOpenSequenceList={() => setIsSequenceListOpen(true)}
      />

      {/* 2. Barra de progreso */}
      <ProgressBar
        currentStep={session.currentStep}
        totalSteps={session.totalSteps}
        progressPercent={progressPercent}
      />

      {/* 3. Zona táctil con pines origen/destino */}
      <PinDisplay
        currentPin={currentPin}
        targetPin={targetPin}
        onRepeatSpeech={handleRepeatSpeech}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      />

      {/* 4. Controles de navegación y autoplay */}
      <GuideControls
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        playSpeed={playSpeed}
        onChangePlaySpeed={setPlaySpeed}
        isWakeLockActive={isWakeLockActive}
        onPrev={handlePrev}
        onNext={handleNext}
      />

      {/* 5. Modal del visualizador de progreso (Mini-canvas) */}
      {isVisualizerOpen && (
        <VisualizerModal
          onClose={() => setIsVisualizerOpen(false)}
          session={session}
        />
      )}

      {/* 6. Modal de listado completo de secuencias */}
      {isSequenceListOpen && (
        <SequenceListModal
          onClose={() => setIsSequenceListOpen(false)}
          session={session}
        />
      )}
    </div>
  );
}
