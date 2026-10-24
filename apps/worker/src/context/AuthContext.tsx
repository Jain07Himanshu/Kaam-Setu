import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, setToken, clearToken, getToken } from '../services/api';

interface WorkerUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  avatarUrl?: string | null;
  workerProfile?: any;
}

interface AuthContextType {
  user: WorkerUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAvailable: boolean;
  toggleAvailability: () => Promise<void>;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => void;
  switchDemoWorker: (identifier: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<WorkerUser | null>(null);
  const [token, setTokenState] = useState<string | null>(getToken());
  const [isLoading, setIsLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const res = await api.getMe();
      setUser(res.user);
      setIsAvailable(res.user?.workerProfile?.isAvailable ?? true);
    } catch (err) {
      console.warn('Failed to fetch worker, logging in as demo worker Suresh Kumar...');
      try {
        const demoRes = await api.demoLogin('suresh.plumber@kaamsetu.demo');
        setToken(demoRes.token);
        setTokenState(demoRes.token);
        setUser(demoRes.user);
        setIsAvailable(demoRes.user?.workerProfile?.isAvailable ?? true);
      } catch (demoErr) {
        clearToken();
        setTokenState(null);
        setUser(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const toggleAvailability = async () => {
    const nextState = !isAvailable;
    setIsAvailable(nextState);
    try {
      await api.updateAvailability(nextState);
      if (user && user.workerProfile) {
        user.workerProfile.isAvailable = nextState;
      }
    } catch (err) {
      // Revert if error
      setIsAvailable(!nextState);
      console.error('Failed to toggle availability:', err);
    }
  };

  const login = async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      const res = await api.login(credentials);
      setToken(res.token);
      setTokenState(res.token);
      setUser(res.user);
      setIsAvailable(res.user?.workerProfile?.isAvailable ?? true);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: any) => {
    setIsLoading(true);
    try {
      const res = await api.register({ ...payload, role: 'WORKER' });
      setToken(res.token);
      setTokenState(res.token);
      setUser(res.user);
      setIsAvailable(true);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearToken();
    setTokenState(null);
    setUser(null);
  };

  const switchDemoWorker = async (identifier: string) => {
    setIsLoading(true);
    try {
      const res = await api.demoLogin(identifier);
      setToken(res.token);
      setTokenState(res.token);
      setUser(res.user);
      setIsAvailable(res.user?.workerProfile?.isAvailable ?? true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        isAvailable,
        toggleAvailability,
        login,
        register,
        logout,
        switchDemoWorker,
        refreshProfile: fetchCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
