import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api } from '@/services/api';
import { useDeviceId } from '@/hooks/useDeviceId';

interface User {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  device_id?: string;
  verified: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  sendOTP: (contact: string, type: 'signup' | 'signin', name?: string) => Promise<{ success: boolean; error?: string }>;
  verifyOTP: (contact: string, code: string, type: 'signup' | 'signin', name?: string) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { deviceId } = useDeviceId();

  // Load user from device storage on startup
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      // Check if user is stored locally (from previous session)
      // This would typically be done with secure storage or token
      // For now, we'll just set loading to false
      setLoading(false);
    } catch (e) {
      setLoading(false);
    }
  };

  const sendOTP = async (contact: string, type: 'signup' | 'signin', name?: string) => {
    setError(null);
    try {
      const res = await api.sendOTP(contact, type, name);
      if (!res.ok) {
        setError(res.error || 'Failed to send OTP');
        return { success: false, error: res.error };
      }
      return { success: true };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
      return { success: false, error: err instanceof Error ? err.message : 'Failed to send OTP' };
    }
  };

  const verifyOTP = async (contact: string, code: string, type: 'signup' | 'signin', name?: string) => {
    setError(null);
    try {
      const res = await api.verifyOTP(contact, code, type, name, deviceId || undefined);
      if (!res.ok) {
        setError(res.error || 'Invalid OTP');
        return { success: false, error: res.error };
      }
      if (res.data?.user) {
        setUser(res.data.user);
      }
      return { success: true, user: res.data?.user };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
      return { success: false, error: err instanceof Error ? err.message : 'Verification failed' };
    }
  };

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      sendOTP,
      verifyOTP,
      logout,
      clearError,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}