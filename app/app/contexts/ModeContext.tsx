'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Mode = 'personal' | 'dev';

interface ModeContextType {
  mode: Mode;
  setMode: (mode: Mode) => void;
  isDevMode: boolean;
  isPersonalMode: boolean;
}

const ModeContext = createContext<ModeContextType | undefined>(undefined);

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<Mode>('personal');

  useEffect(() => {
    // Load mode from localStorage
    const saved = localStorage.getItem('projectme-mode') as Mode | null;
    if (saved === 'dev' || saved === 'personal') {
      setModeState(saved);
    }
  }, []);

  const setMode = (newMode: Mode) => {
    setModeState(newMode);
    localStorage.setItem('projectme-mode', newMode);
  };

  return (
    <ModeContext.Provider
      value={{
        mode,
        setMode,
        isDevMode: mode === 'dev',
        isPersonalMode: mode === 'personal',
      }}
    >
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  const context = useContext(ModeContext);
  if (context === undefined) {
    throw new Error('useMode must be used within a ModeProvider');
  }
  return context;
}

