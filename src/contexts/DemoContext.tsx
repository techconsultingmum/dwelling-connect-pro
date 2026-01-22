import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DemoContextType {
  isDemoMode: boolean;
  enterDemoMode: () => void;
  exitDemoMode: () => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('demoMode') === 'true';
    }
    return false;
  });

  const enterDemoMode = () => {
    sessionStorage.setItem('demoMode', 'true');
    setIsDemoMode(true);
  };

  const exitDemoMode = () => {
    sessionStorage.removeItem('demoMode');
    setIsDemoMode(false);
  };

  return (
    <DemoContext.Provider value={{ isDemoMode, enterDemoMode, exitDemoMode }}>
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
}
