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
      });
      wakeLockRef.current = sentinel;
      setIsActive(true);
    } catch (err) {
      console.warn('No se pudo activar el Wake Lock:', err);
    }
  }, []);

  // Liberar el wake lock
  const release = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
      } catch (err) {
        console.error('Error al liberar el Wake Lock:', err);
      }
      wakeLockRef.current = null;
      setIsActive(false);
    }
  }, []);

  // Re-adquirir wake lock cuando el usuario vuelve a la pestaña
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isActive) {
        await request();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch((e: unknown) => console.error(e));
      }
    };
  }, [isActive, request]);

  return { isActive, request, release };
}
