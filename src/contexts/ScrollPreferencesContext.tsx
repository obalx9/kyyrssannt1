import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface ScrollPreferences {
  snapEnabled: boolean;
  toggleSnap: () => void;
}

const ScrollPreferencesContext = createContext<ScrollPreferences | undefined>(undefined);

export function ScrollPreferencesProvider({ children }: { children: ReactNode }) {
  const [snapEnabled, setSnapEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('scrollSnapEnabled');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    localStorage.setItem('scrollSnapEnabled', JSON.stringify(snapEnabled));
  }, [snapEnabled]);

  const toggleSnap = () => {
    setSnapEnabled(prev => !prev);
  };

  return (
    <ScrollPreferencesContext.Provider value={{ snapEnabled, toggleSnap }}>
      {children}
    </ScrollPreferencesContext.Provider>
  );
}

export function useScrollPreferences() {
  const context = useContext(ScrollPreferencesContext);
  if (context === undefined) {
    throw new Error('useScrollPreferences must be used within a ScrollPreferencesProvider');
  }
  return context;
}
