import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, setToken, clearToken, getToken } from '../services/api';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  avatarUrl?: string | null;
  customerProfile?: any;
  workerProfile?: any;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAvailable: boolean;
  toggleAvailability: () => Promise<void>;
  login: (credentials: { email: string; password: string }) => Promise<any>;
  register: (payload: any) => Promise<any>;
  demoLogin: (identifier?: string) => Promise<any>;
  logout: () => void;
  switchDemoUser: (identifier: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(getToken());
  const [isLoading, setIsLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);

  const fetchCurrentUser = async () => {
    const existingToken = getToken();
    if (!existingToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      setUser(res.user);
      setIsAvailable(res.user?.workerProfile?.isAvailable ?? true);
    } catch (err) {
      clearToken();
      setTokenState(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      const res = await api.login(credentials);
      setToken(res.token);
      setTokenState(res.token);
      setUser(res.user);
      setIsAvailable(res.user?.workerProfile?.isAvailable ?? true);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: any) => {
    setIsLoading(true);
    try {
      const res = await api.register(payload);
      setToken(res.token);
      setTokenState(res.token);
      setUser(res.user);
      setIsAvailable(res.user?.workerProfile?.isAvailable ?? true);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const demoLogin = async (identifier: string = 'aarav.customer@kaamsetu.demo') => {
    setIsLoading(true);
    try {
      const res = await api.demoLogin(identifier);
      setToken(res.token);
      setTokenState(res.token);
      setUser(res.user);
      setIsAvailable(res.user?.workerProfile?.isAvailable ?? true);
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearToken();
    setTokenState(null);
    setUser(null);
  };

  const switchDemoUser = async (identifier: string) => {
    await demoLogin(identifier);
  };

  const toggleAvailability = async () => {
    if (!user || user.role !== 'WORKER') return;
    const nextState = !isAvailable;
    setIsAvailable(nextState);
    try {
      await api.updateAvailability(nextState);
    } catch (err) {
      setIsAvailable(!nextState);
    }
  };

  const refreshProfile = async () => {
    try {
      const res = await api.getMe();
      setUser(res.user);
      setIsAvailable(res.user?.workerProfile?.isAvailable ?? true);
    } catch (err) {
      // ignore
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
        demoLogin,
        logout,
        switchDemoUser,
        refreshProfile,
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
