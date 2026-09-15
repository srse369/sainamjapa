import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';

const DEVICE_ID_KEY = '@sainamjapa_device_id';

export function useDeviceId() {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeviceId();
  }, []);

  const loadDeviceId = useCallback(async () => {
    try {
      let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
      if (!id) {
        // Try to get from expo-application (persists across reinstalls on iOS)
        id = Application.getIosIdForVendorAsync ? await Application.getIosIdForVendorAsync() : null;
        if (!id && Application.getAndroidId) {
          id = await Application.getAndroidId();
        }
        // Fallback to random UUID
        if (!id) {
          id = 'dev_' + Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
        }
        await AsyncStorage.setItem(DEVICE_ID_KEY, id);
      }
      setDeviceId(id);
    } catch (e) {
      console.error('Failed to load device ID:', e);
      // Fallback
      const fallbackId = 'dev_' + Math.random().toString(36).substring(2, 15);
      setDeviceId(fallbackId);
    } finally {
      setLoading(false);
    }
  }, []);

  return { deviceId, loading };
}