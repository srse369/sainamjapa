export interface DailyCount {
  date: string;
  count: number;
}

export interface LocationData {
  city?: string;
  country?: string;
  latitude: number;
  longitude: number;
  count: number;
}

export interface AggregateData {
  total: number;
  daily: DailyCount[];
  locations: LocationData[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  device_id?: string;
  verified: boolean;
}

export interface OTPResponse {
  message: string;
}

export interface NameRegistration {
  name: string;
}

export interface SubmitPayload {
  name: string | null;
  date: string;
  count: number;
  user_id?: string;
  device_id?: string;
}

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
  names?: string[];
}