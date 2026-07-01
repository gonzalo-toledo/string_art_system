/**
 * Hook para mantener la pantalla activa (Wake Lock API).
 *
 * Evita que el celular se apague mientras el usuario está armando
 * el cuadro siguiendo las instrucciones del modo guiado.
 * Si el usuario cambia de pestaña y vuelve, el wake lock se re-adquiere.
 */
import { useEffect, useRef, useState, useCallback } from 'react';

export function useWakeLock() {
  const [isActive, setIsActive] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  // Track whether we SHOULD have the lock (to re-acquire after tab switch)
  const shouldHaveLockRef = useRef(false);

  // Solicitar wake lock al sistema operativo
  const request = useCallback(async () => {
    if (typeof window === 'undefined' || !('wakeLock' in navigator)) {
      return;
    }
    try {
      if (wakeLockRef.current) return;
      const sentinel = await navigator.wakeLock.request('screen');
      sentinel.addEventListener('release', () => {
        setIsActive(false);
        wakeLockRef.current = null;
        // Re-acquire if we still should have it (e.g. browser released it on tab switch)
        if (shouldHaveLockRef.current && document.visibilityState === 'visible') {
          request();
        }
      });
      wakeLockRef.current = sentinel;
      setIsActive(true);
    } catch (err) {
      console.warn('Wake Lock not available:', err);
    }
  }, []);

  // Liberar el wake lock
  const release = useCallback(async () => {
    shouldHaveLockRef.current = false;
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
      } catch (err) {
        // Silently ignore — sentinel may already be released
      }
      wakeLockRef.current = null;
      setIsActive(false);
    }
  }, []);

  // Re-adquirir wake lock cuando el usuario vuelve a la pestaña
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && shouldHaveLockRef.current) {
        await request();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      shouldHaveLockRef.current = false;
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
      }
    };
  }, [request]);

  // Wrap request to set shouldHaveLock flag
  const requestWithFlag = useCallback(async () => {
    shouldHaveLockRef.current = true;
    await request();
  }, [request]);

  return { isActive, request: requestWithFlag, release };
}
