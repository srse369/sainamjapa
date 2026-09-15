import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REGISTERED_NAME_KEY = '@sainamjapa_registered_name';

export function useRegisteredName() {
  const [registeredName, setRegisteredName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadName();
  }, []);

  const loadName = useCallback(async () => {
    try {
      const name = await AsyncStorage.getItem(REGISTERED_NAME_KEY);
      setRegisteredName(name);
    } catch (e) {
      console.error('Failed to load registered name:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveName = useCallback(async (name: string) => {
    try {
      await AsyncStorage.setItem(REGISTERED_NAME_KEY, name);
      setRegisteredName(name);
    } catch (e) {
      console.error('Failed to save registered name:', e);
      throw e;
    }
  }, []);

  const clearName = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(REGISTERED_NAME_KEY);
      setRegisteredName(null);
    } catch (e) {
      console.error('Failed to clear registered name:', e);
    }
  }, []);

  return { registeredName, loading, saveName, clearName };
}