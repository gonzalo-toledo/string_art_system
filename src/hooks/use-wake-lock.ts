import { useEffect, useRef, useState, useCallback } from 'react';

export function useWakeLock() {
  const [isActive, setIsActive] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const wakeLockRef = useRef<any>(null);

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
      console.warn('Wake Lock request failed:', err);
    }
  }, []);

  const release = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
      } catch (err) {
        console.error('Wake Lock release failed:', err);
      }
      wakeLockRef.current = null;
      setIsActive(false);
    }
  }, []);

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
