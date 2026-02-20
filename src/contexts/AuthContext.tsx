import { createContext, useContext, useEffect, useState, useRef, useCallback, ReactNode } from 'react';
import { apiClient } from '../lib/api';

interface User {
  id: string;
  telegram_id: number;
  telegram_username?: string;
  first_name?: string;
  last_name?: string;
  photo_url?: string;
  roles: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const loadIdRef = useRef(0);

  const loadUser = useCallback(async () => {
    const currentLoadId = ++loadIdRef.current;
    try {
      const token = localStorage.getItem('token');

      if (currentLoadId !== loadIdRef.current) return;

      if (token) {
        try {
          const userData = await apiClient.getUser();

          if (currentLoadId !== loadIdRef.current) return;

          setUser(userData);
        } catch (error) {
          console.error('Invalid token, clearing:', error);
          apiClient.clearToken();
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      if (currentLoadId !== loadIdRef.current) return;
      console.error('Error loading user:', error);
      setUser(null);
    } finally {
      if (currentLoadId === loadIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadUser();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        loadUser();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadUser]);

  const signOut = async () => {
    try {
      apiClient.clearToken();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setUser(null);
    }
  };

  const refreshUser = useCallback(async () => {
    await loadUser();
  }, [loadUser]);

  return (
    <AuthContext.Provider value={{ user, loading, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
