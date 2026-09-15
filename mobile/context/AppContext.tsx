import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AggregateData, DailyCount, LocationData, User } from '@/types';
import { api } from '@/services/api';

interface AppContextType {
  aggregateData: AggregateData | null;
  loading: boolean;
  error: string | null;
  user: User | null;
  setUser: (user: User | null) => void;
  refreshData: () => Promise<void>;
  submitJapam: (name: string | null, date: string, count: number, userId?: string) => Promise<{ success: boolean; error?: string }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [aggregateData, setAggregateData] = useState<AggregateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      const aggRes = await api.fetchAggregates();

      if (aggRes.ok && aggRes.data) {
        setAggregateData(aggRes.data);
      } else {
        setError(aggRes.error || 'Failed to load aggregates');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const submitJapam = async (name: string | null, date: string, count: number, userId?: string) => {
    const res = await api.submitJapam({ name, date, count, user_id: userId });
    if (res.ok) {
      await fetchAllData();
      return { success: true };
    }
    return { success: false, error: res.error };
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  return (
    <AppContext.Provider value={{
      aggregateData,
      loading,
      error,
      user,
      setUser,
      refreshData: fetchAllData,
      submitJapam,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}