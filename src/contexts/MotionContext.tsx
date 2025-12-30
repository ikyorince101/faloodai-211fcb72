import React, { createContext, useContext, useState, useEffect } from 'react';

export type MotionIntensity = 'off' | 'subtle' | 'magical';

interface MotionContextType {
  intensity: MotionIntensity;
  setIntensity: (intensity: MotionIntensity) => void;
  prefersReducedMotion: boolean;
}

const MotionContext = createContext<MotionContextType | undefined>(undefined);

export const MotionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [intensity, setIntensity] = useState<MotionIntensity>('off');

  useEffect(() => {
    // Check system preference for reduced motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    if (mediaQuery.matches) {
      setIntensity('off');
    }

    // Load saved preference
    const saved = localStorage.getItem('falood-motion-intensity') as MotionIntensity;
    if (saved && ['off', 'subtle', 'magical'].includes(saved)) {
      setIntensity(saved);
    }

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
      if (e.matches) {
        setIntensity('off');
      }
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  /* Apply global motion classes */
  useEffect(() => {
    const effective = prefersReducedMotion ? 'off' : intensity;
    const root = document.documentElement;
    root.classList.remove('motion-off', 'motion-subtle', 'motion-magical');
    root.classList.add(`motion-${effective}`);
  }, [intensity, prefersReducedMotion]);

  const handleSetIntensity = (newIntensity: MotionIntensity) => {
    setIntensity(newIntensity);
    localStorage.setItem('falood-motion-intensity', newIntensity);
  };

  const effectiveIntensity = prefersReducedMotion ? 'off' : intensity;

  return (
    <MotionContext.Provider
      value={{
        intensity: effectiveIntensity,
        setIntensity: handleSetIntensity,
        prefersReducedMotion
      }}
    >
      {children}
    </MotionContext.Provider>
  );
};

export const useMotion = () => {
  const context = useContext(MotionContext);
  if (!context) {
    throw new Error('useMotion must be used within a MotionProvider');
  }
  return context;
};

// Utility hook for getting animation classes based on motion preference
export const useAnimationClass = (baseClass: string) => {
  const { intensity } = useMotion();

  if (intensity === 'off') return '';
  if (intensity === 'subtle') return baseClass.replace('0.4s', '0.2s').replace('0.3s', '0.15s');
  return baseClass;
};
