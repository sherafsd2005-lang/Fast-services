import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, WorkerProfile } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  workerProfile: WorkerProfile | null;
  loading: boolean;
  login: (identifier: string, pass: string) => Promise<void>;
  adminLogin: (identifier: string, pass: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAdmin: boolean;
  isWorker: boolean;
  isCustomer: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  workerProfile: null,
  loading: true,
  login: async () => {},
  adminLogin: async () => {},
  register: async () => {},
  logout: () => {},
  refreshUser: async () => {},
  isAdmin: false,
  isWorker: false,
  isCustomer: false
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [workerProfile, setWorkerProfile] = useState<WorkerProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const token = localStorage.getItem('firststep_token');
    if (!token) {
      setUser(null);
      setWorkerProfile(null);
      setLoading(false);
      return;
    }
    try {
      const data = await api.getMe();
      setUser(data.user);
      setWorkerProfile(data.workerProfile || null);
    } catch (e) {
      console.error('Session expired or invalid token:', e);
      localStorage.removeItem('firststep_token');
      setUser(null);
      setWorkerProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (identifier: string, pass: string) => {
    const res = await api.login({ identifier, password: pass });
    localStorage.setItem('firststep_token', res.token);
    setUser(res.user);
    await refreshUser();
  };

  const adminLogin = async (identifier: string, pass: string) => {
    const res = await api.adminLogin({ identifier, password: pass });
    localStorage.setItem('firststep_token', res.token);
    setUser(res.user);
    await refreshUser();
  };

  const register = async (data: any) => {
    const res = await api.register(data);
    localStorage.setItem('firststep_token', res.token);
    setUser(res.user);
    await refreshUser();
  };

  const logout = () => {
    localStorage.removeItem('firststep_token');
    setUser(null);
    setWorkerProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        workerProfile,
        loading,
        login,
        adminLogin,
        register,
        logout,
        refreshUser,
        isAdmin: user?.role === 'admin',
        isWorker: user?.role === 'worker',
        isCustomer: user?.role === 'customer'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
