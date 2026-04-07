// services/alertService.ts

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface Alert {
  id: string;
  type: 'compliance' | 'withdrawal' | 'medicine' | 'task' | 'approval' | 'system';
  severity: 'urgent' | 'warning' | 'info';
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  metadata?: {
    animalId?: string;
    medicineId?: string;
    farmId?: string;
    taskId?: string;
    region?: string;
    daysRemaining?: number;
  };
}

export async function fetchAlerts(token: string): Promise<Alert[]> {
  const res = await fetch(`${API_BASE}/alerts`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch alerts');
  return res.json();
}

export function normalizeAlert(raw: any): Alert {
  return {
    id: raw.id,
    type: raw.type,
    severity: raw.severity,
    title: raw.title,
    message: raw.message,
    created_at: raw.created_at,
    is_read: raw.is_read ?? false,
    metadata: raw.metadata ?? {}
  };
}
