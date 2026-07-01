/**
 * Hook para manejar la sesión del modo guiado.
 *
 * Persiste el progreso del usuario en localStorage para que pueda
 * cerrar el browser y retomar el armado del cuadro días después.
 * Cada avance de paso se guarda automáticamente.
 */
import { useState, useEffect, useCallback } from 'react';
import { GuidedSession } from '../core/algorithm/types';

const STORAGE_KEY = 'hacelo-art-session';

/**
 * Valida que un objeto parseado tenga la estructura de GuidedSession.
 * Previene prototype pollution y datos corruptos.
 */
function isValidGuidedSession(data: unknown): data is GuidedSession {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return (
    Array.isArray(obj.sequence) &&
    obj.sequence.length > 0 &&
    typeof obj.currentStep === 'number' &&
    typeof obj.totalSteps === 'number' &&
    obj.config !== null &&
    typeof obj.config === 'object' &&
    typeof (obj.config as Record<string, unknown>).totalPins === 'number' &&
    typeof (obj.config as Record<string, unknown>).maxIterations === 'number'
  );
}

/**
 * Safe localStorage write con manejo de QuotaExceededError.
 * Muestra warning al usuario si no hay espacio.
 */
function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      console.error('localStorage quota exceeded — session not saved');
      // Nota: no podemos usar toast aquí porque este hook no tiene UI propia,
      // pero el console.error permite debugging en producción
    }
    return false;
  }
}

export function useGuidedSession() {
  const [session, setSession] = useState<GuidedSession | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Cargar sesión guardada de localStorage al montar el componente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (isValidGuidedSession(parsed)) {
            setSession(parsed);
          } else {
            // Datos corruptos o formato incompatible — limpiar
            console.warn('Invalid session data in localStorage, clearing');
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch (e) {
        // JSON parse failed — datos corruptos
        console.error('Error parsing session from localStorage', e);
        localStorage.removeItem(STORAGE_KEY);
      }
      setIsLoaded(true);
    }
  }, []);

  // Crear una nueva sesión a partir de la secuencia generada
  const startSession = useCallback((sequence: number[], totalPins: number, maxIterations: number) => {
    const newSession: GuidedSession = {
      sequence,
      currentStep: 0,
      totalSteps: sequence.length - 1,
      config: {
        totalPins,
        maxIterations
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (typeof window !== 'undefined') {
      safeSetItem(STORAGE_KEY, JSON.stringify(newSession));
    }
    setSession(newSession);
    return newSession;
  }, []);

  // Actualizar el paso actual (se llama cada vez que el usuario avanza/retrocede)
  const updateStep = useCallback((step: number) => {
    setSession((prev) => {
      if (!prev) return null;

      // Clampear el paso al rango válido
      const clampedStep = Math.max(0, Math.min(step, prev.totalSteps));
      const updatedSession: GuidedSession = {
        ...prev,
        currentStep: clampedStep,
        updatedAt: new Date().toISOString()
      };

      if (typeof window !== 'undefined') {
        safeSetItem(STORAGE_KEY, JSON.stringify(updatedSession));
      }
      return updatedSession;
    });
  }, []);

  // Borrar la sesión (el usuario quiere empezar un cuadro nuevo)
  const clearSession = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Silently ignore removeItem errors
      }
    }
    setSession(null);
  }, []);

  return {
    session,
    isLoaded,
    startSession,
    updateStep,
    clearSession
  };
}
