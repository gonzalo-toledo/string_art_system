/**
 * Hook para la síntesis de voz de pines.
 *
 * Usa la Web Speech API nativa del browser para decir en voz alta
 * el número del pin al que el usuario debe ir. Soporta español,
 * inglés y portugués. La preferencia on/off se persiste en localStorage.
 */
import { useState, useEffect, useCallback, useRef } from 'react';

export function usePinSpeech(initialLocale: 'es' | 'en' | 'pt') {
  const [isEnabled, setEnabledState] = useState(true);
  const [locale, setLocale] = useState<'es' | 'en' | 'pt'>(initialLocale);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Sincronizar locale cuando cambia el parámetro
  useEffect(() => {
    setLocale(initialLocale);
  }, [initialLocale]);

  // Cargar preferencia de audio del localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('hacelo-art-speech-enabled');
      if (stored !== null) {
        setEnabledState(stored === 'true');
      }
    }
  }, []);

  // Guardar preferencia y actualizar estado
  const setEnabled = useCallback((val: boolean) => {
    setEnabledState(val);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('hacelo-art-speech-enabled', String(val));
      } catch {
        // Silently ignore — non-critical preference
      }
    }
  }, []);

  const toggleEnabled = useCallback(() => {
    setEnabled(!isEnabled);
  }, [isEnabled, setEnabled]);

  // Cancelar cualquier audio en curso
  const cancel = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // Decir el número de pin en voz alta
  const speak = useCallback((pinNumber: number) => {
    if (!isEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    cancel();

    // Construir texto localizado
    let text = '';
    let lang = 'es-ES';

    if (locale === 'es') {
      text = `Pin ${pinNumber}`;
      lang = 'es-ES';
    } else if (locale === 'en') {
      text = `Pin ${pinNumber}`;
      lang = 'en-US';
    } else if (locale === 'pt') {
      text = `Pino ${pinNumber}`;
      lang = 'pt-BR';
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;

    // Intentar seleccionar una voz del idioma correspondiente
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.startsWith(lang.substring(0, 2)));
    if (voice) {
      utterance.voice = voice;
    }

    speechUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isEnabled, locale, cancel]);

  // Limpiar audio pendiente al desmontar
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    speak,
    cancel,
    isEnabled,
    setEnabled,
    toggleEnabled,
    locale,
    setLocale
  };
}
