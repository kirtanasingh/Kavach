const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
const API = `${API_BASE}/api/v1`;

export type UserRole = "farm_owner" | "veterinarian" | "authority";

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone_number: string | null;
  date_of_birth: string | null;
  role: UserRole;
  street_address: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RegisterPayload {
  full_name: string;
  email: string;
  phone_number?: string;
  date_of_birth?: string;
  role: UserRole;
  street_address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  password: string;
  agreed_to_terms: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UpdateProfilePayload {
  full_name?: string;
  phone_number?: string | null;
  street_address?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export interface AuthError {
  field?: string;
  message: string;
}

let _accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  _accessToken = token;
}

export function getAccessToken(): string | null {
  return _accessToken;
}

const REFRESH_KEY = "kavach_refresh_token";

function storeRefresh(token: string) {
  localStorage.setItem(REFRESH_KEY, token);
}

function loadRefresh(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

function clearRefresh() {
  localStorage.removeItem(REFRESH_KEY);
}

async function request<T>(method: string, path: string, body?: unknown, authed = false): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (authed && _accessToken) {
    headers.Authorization = `Bearer ${_accessToken}`;
  }

  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const detail = data?.detail;
    if (Array.isArray(detail)) {
      const errors: AuthError[] = detail.map((e: any) => ({
        field: e.field ?? undefined,
        message: e.message ?? e.msg,
      }));
      throw errors;
    }

    throw [{ message: typeof detail === "string" ? detail : `HTTP ${res.status}` }] as AuthError[];
  }

  return data as T;
}

export async function register(payload: RegisterPayload): Promise<UserProfile> {
  return request<UserProfile>("POST", "/auth/register", payload);
}

export async function login(payload: LoginPayload): Promise<UserProfile> {
  const tokens = await request<TokenPair>("POST", "/auth/login", payload);
  setAccessToken(tokens.access_token);
  storeRefresh(tokens.refresh_token);
  scheduleRefresh(tokens.expires_in);
  return request<UserProfile>("GET", "/auth/me", undefined, true);
}

export async function logout(): Promise<void> {
  const refresh = loadRefresh();
  if (refresh) {
    try {
      await request("POST", "/auth/logout", { refresh_token: refresh }, true);
    } catch {
      // Best effort revoke.
    }
  }
  setAccessToken(null);
  clearRefresh();
  clearRefreshTimer();
}

export async function restoreSession(): Promise<UserProfile | null> {
  const refresh = loadRefresh();
  if (!refresh) return null;

  try {
    const tokens = await request<TokenPair>("POST", "/auth/refresh", { refresh_token: refresh });
    setAccessToken(tokens.access_token);
    storeRefresh(tokens.refresh_token);
    scheduleRefresh(tokens.expires_in);
    return request<UserProfile>("GET", "/auth/me", undefined, true);
  } catch {
    clearRefresh();
    return null;
  }
}

export async function getMe(): Promise<UserProfile> {
  return request<UserProfile>("GET", "/auth/me", undefined, true);
}

export async function updateMe(payload: UpdateProfilePayload): Promise<UserProfile> {
  return request<UserProfile>("PATCH", "/auth/me", payload, true);
}

export async function forgotPassword(email: string): Promise<void> {
  await request("POST", "/auth/forgot-password", { email });
}

export async function resetPassword(token: string, new_password: string): Promise<void> {
  await request("POST", "/auth/reset-password", { token, new_password });
}

let _refreshTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleRefresh(expiresIn: number) {
  clearRefreshTimer();
  const refreshIn = Math.max((expiresIn - 60) * 1000, 5000);
  _refreshTimer = setTimeout(async () => {
    const refresh = loadRefresh();
    if (!refresh) return;
    try {
      const tokens = await request<TokenPair>("POST", "/auth/refresh", { refresh_token: refresh });
      setAccessToken(tokens.access_token);
      storeRefresh(tokens.refresh_token);
      scheduleRefresh(tokens.expires_in);
    } catch {
      setAccessToken(null);
      clearRefresh();
    }
  }, refreshIn);
}

function clearRefreshTimer() {
  if (_refreshTimer) {
    clearTimeout(_refreshTimer);
    _refreshTimer = null;
  }
}
