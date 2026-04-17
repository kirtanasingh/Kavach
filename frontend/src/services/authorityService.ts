import { getAccessToken } from './authService';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';
const API_URL = `${API_BASE}/api/v1`;

export interface AuthoritySummary {
  total_farms: number;
  active_alerts: number;
  compliance_rate: number;
  critical_outbreaks: number;
  last_updated: string;
}

export async function fetchAuthoritySummary(token?: string): Promise<AuthoritySummary> {
  const resolvedToken = token || getAccessToken() || '';
  const res = await fetch(`${API_URL}/authority/summary`, {
    headers: resolvedToken ? { Authorization: `Bearer ${resolvedToken}` } : {},
  });

  if (!res.ok) {
    throw new Error(`Failed to load authority summary (${res.status})`);
  }

  return res.json();
}
