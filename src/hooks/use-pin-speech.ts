import { useState, useEffect, useCallback, useRef } from 'react';

export function usePinSpeech(initialLocale: 'es' | 'en' | 'pt') {
  const [isEnabled, setEnabledState] = useState(true);
  const [locale, setLocale] = useState<'es' | 'en' | 'pt'>(initialLocale);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Sync locale state with initialLocale parameter
  useEffect(() => {
    setLocale(initialLocale);
  }, [initialLocale]);

  // Load persistence state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('hacelo-art-speech-enabled');
      if (stored !== null) {
        setEnabledState(stored === 'true');
      }
    }
  }, []);

  const setEnabled = useCallback((val: boolean) => {
    setEnabledState(val);
    if (typeof window !== 'undefined') {
      localStorage.setItem('hacelo-art-speech-enabled', String(val));
    }
  }, []);

  const toggleEnabled = useCallback(() => {
    setEnabled(!isEnabled);
  }, [isEnabled, setEnabled]);

  const cancel = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const speak = useCallback((pinNumber: number) => {
    if (!isEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    cancel();

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

    // Apply voice if speech synthesis has loaded voices
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.startsWith(lang.substring(0, 2)));
    if (voice) {
      utterance.voice = voice;
    }

    speechUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isEnabled, locale, cancel]);

  // Clean up speech on unmount
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
