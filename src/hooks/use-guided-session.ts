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

export function useGuidedSession() {
  const [session, setSession] = useState<GuidedSession | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Cargar sesión guardada de localStorage al montar el componente
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as GuidedSession;
          setSession(parsed);
        } catch (e) {
          console.error('Error al parsear la sesión guardada', e);
        }
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
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
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
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSession));
      }
      return updatedSession;
    });
  }, []);

  // Borrar la sesión (el usuario quiere empezar un cuadro nuevo)
  const clearSession = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
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
