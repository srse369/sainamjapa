import { AggregateData, DailyCount, LocationData, User, OTPResponse } from '@/types';

const API_BASE_URL = 'https://saimantrajapam.netlify.app/.netlify/functions';

const endpoints = {
  submit: `${API_BASE_URL}/submit`,
  aggregate: `${API_BASE_URL}/aggregate`,
  registerName: `${API_BASE_URL}/register_name`,
  fetchNames: `${API_BASE_URL}/fetch_names`,
  sendOTP: `${API_BASE_URL}/send_otp`,
  verifyOTP: `${API_BASE_URL}/verify_otp`,
};

async function fetchJson<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });
    const data = await response.json();
    if (!response.ok) {
      return { ok: false, error: data.error || `HTTP ${response.status}` };
    }
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export const api = {
  async fetchAggregates(): Promise<ApiResponse<AggregateData>> {
    return fetchJson<AggregateData>(endpoints.aggregate);
  },

  async fetchNames(): Promise<ApiResponse<{ names: string[] }>> {
    return fetchJson<{ names: string[] }>(endpoints.fetchNames);
  },

  async registerName(name: string, deviceId: string): Promise<ApiResponse<{ name: string }>> {
    return fetchJson<{ name: string }>(endpoints.registerName, {
      method: 'POST',
      body: JSON.stringify({ name, device_id: deviceId }),
    });
  },

  async submitJapam(payload: { name: string | null; date: string; count: number; user_id?: string; device_id?: string }): Promise<ApiResponse<void>> {
    return fetchJson<void>(endpoints.submit, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async sendOTP(contact: string, type: 'signup' | 'signin', name?: string): Promise<ApiResponse<OTPResponse>> {
    return fetchJson<OTPResponse>(endpoints.sendOTP, {
      method: 'POST',
      body: JSON.stringify({ contact, type, name }),
    });
  },

  async verifyOTP(contact: string, code: string, type: 'signup' | 'signin', name?: string, deviceId?: string): Promise<ApiResponse<{ user: User }>> {
    return fetchJson<{ user: User }>(endpoints.verifyOTP, {
      method: 'POST',
      body: JSON.stringify({ contact, code, type, name, device_id: deviceId }),
    });
  },
};

interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
}