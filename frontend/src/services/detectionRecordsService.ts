import { getAccessToken } from './authService';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_URL = `${API_BASE}/api/v1`;

export interface DetectionRecord {
  id: number;
  species: 'pig' | 'cattle' | 'poultry' | string;
  predicted_label: string;
  confidence: number;
  severity: string;
  status: string;
  recommendation: string;
  created_at: string;
  updated_at?: string;
  review_status?: 'pending' | 'pending_review' | 'safe' | 'not_safe' | 'unsafe' | 'other' | 'needs_followup' | string;
  vet_note?: string | null;
}

export interface VetDetectionItem {
  detection_id: number;
  case_id?: number | null;
  species: string;
  predicted_label: string;
  confidence: number;
  severity: string;
  status: string;
  recommendation: string;
  created_at: string;
  case_status?: string | null;
  farmer_name?: string | null;
  animal_name?: string | null;
  review_status?: string;
  vet_note?: string | null;
}

export interface VetCaseItem {
  id: number;
  status: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  detection_id: number;
  species: string;
  predicted_label: string;
  confidence: number;
  severity: string;
  detection_status: string;
  farmer_name?: string | null;
  animal_name?: string | null;
  vet_name?: string | null;
  review_status?: string;
  vet_note?: string | null;
}

export interface AnalyticsPayload {
  overall_reviews: Array<{ review_status: string; total: number }>;
  by_species: Array<{ species: string; total: number; avg_confidence: number }>;
  trend: Array<{ day: string; overall: number; pig: number; cattle: number; poultry: number }>;
}

const authHeaders = (): HeadersInit => {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function fetchFarmerDetectionHistory(limit = 200): Promise<DetectionRecord[]> {
  const res = await fetch(`${API_URL}/detections/history?limit=${limit}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to load detection history');
  return res.json();
}

export async function deleteFarmerDetection(detectionId: string | number): Promise<void> {
  const res = await fetch(`${API_URL}/detections/${detectionId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete detection');
}

export async function clearFarmerDetectionHistory(): Promise<void> {
  const res = await fetch(`${API_URL}/detections/history`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to clear detection history');
}

export async function fetchVetDetectionQueue(status = 'pending_review'): Promise<VetDetectionItem[]> {
  const res = await fetch(`${API_URL}/detections?status=${encodeURIComponent(status)}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to load vet review queue');
  return res.json();
}

export async function submitVetDetectionReview(
  detectionId: string | number,
  reviewStatus: 'safe' | 'not_safe' | 'other',
  vetNote?: string,
): Promise<void> {
  const payload = {
    review_status: reviewStatus,
    notes: vetNote || null,
    accepted: reviewStatus === 'safe',
  };

  const res = await fetch(`${API_URL}/annotations/${detectionId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to submit vet review');
}

export async function fetchVetCases(status?: string): Promise<VetCaseItem[]> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  const res = await fetch(`${API_URL}/cases${qs}`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to load cases');
  return res.json();
}

export async function fetchVetAnalytics(): Promise<AnalyticsPayload> {
  const res = await fetch(`${API_URL}/analytics`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to load analytics');
  return res.json();
}
