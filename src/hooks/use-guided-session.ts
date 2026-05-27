import { useState, useEffect, useCallback } from 'react';
import { GuidedSession } from '../core/algorithm/types';

const STORAGE_KEY = 'hacelo-art-session';

export function useGuidedSession() {
  const [session, setSession] = useState<GuidedSession | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load session from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as GuidedSession;
          setSession(parsed);
        } catch (e) {
          console.error('Failed to parse guided session', e);
        }
      }
      setIsLoaded(true);
    }
  }, []);

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

  const updateStep = useCallback((step: number) => {
    setSession((prev) => {
      if (!prev) return null;
      
      // Clamp step to valid range
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
