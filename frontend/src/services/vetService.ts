import { getAccessToken } from "./authService";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
const BASE = `${API_BASE}/api/v1/vet`;

function authHeaders(): HeadersInit {
  const token = getAccessToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: authHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? `API ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

function qs(params: Record<string, string | number | boolean | undefined | null>): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) sp.set(key, String(value));
  }
  const q = sp.toString();
  return q ? `?${q}` : "";
}

export interface VetDashboardSummary {
  assigned_farms: number;
  todays_appointments: number;
  upcoming_appointments: number;
  pending_reviews: number;
  active_prescriptions: number;
  amu_entries_this_month: number;
  unread_messages: number;
  unread_alerts: number;
  amr_risk_farms: number;
}

export interface FarmSummaryForVet {
  farm_id: string;
  farm_name: string;
  owner_name: string;
  owner_user_id: string;
  city?: string;
  state?: string;
  active: boolean;
  assigned_at: string;
}

export interface VetAppointment {
  id: string;
  vet_user_id: string;
  farm_id: string;
  farmer_user_id?: string;
  appointment_type: string;
  scheduled_at: string;
  duration_minutes: number;
  location_text?: string;
  status: string;
  reason?: string;
  notes?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface Prescription {
  id: string;
  vet_user_id: string;
  farm_id: string;
  animal_id?: string;
  appointment_id?: string;
  diagnosis: string;
  medicine_name: string;
  dose: string;
  frequency?: string;
  duration_days?: number;
  route?: string;
  withdrawal_days: number;
  prescribed_on: string;
  valid_until?: string;
  status: string;
  refills_allowed: number;
  refills_used: number;
  special_instructions?: string;
  comments?: string;
  created_at: string;
  updated_at: string;
}

export interface AMULog {
  id: string;
  farm_id: string;
  animal_id?: string;
  prescription_id?: string;
  entered_by_user_id: string;
  species: string;
  drug_name: string;
  drug_class?: string;
  route: string;
  dosage: number;
  dosage_unit: string;
  dosage_per_kg?: number;
  purpose: string;
  administration_date: string;
  duration_days?: number;
  withdrawal_period_days: number;
  safe_after_date?: string;
  batch_size?: number;
  reminder_enabled: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AMUSummaryByDrug {
  drug_name: string;
  drug_class?: string;
  total_entries: number;
  total_dosage: number;
  farms_affected: number;
}

export interface AMUSummaryBySpecies {
  species: string;
  total_entries: number;
  drug_count: number;
}

export interface VetMessage {
  id: string;
  farm_id: string;
  vet_user_id: string;
  farmer_user_id: string;
  sender_user_id: string;
  sender_role: string;
  message_text: string;
  attachment_url?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface VetAlert {
  id: string;
  vet_user_id: string;
  farm_id?: string;
  type: string;
  severity: string;
  title: string;
  message?: string;
  metadata?: Record<string, unknown>;
  is_read: boolean;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface FarmerDirectoryItem {
  farmer_user_id: string;
  farmer_name: string;
  farm_id?: string;
  farm_name?: string;
  email?: string;
  phone_number?: string;
  risk_score?: number;
  risk_level?: string;
  key_flags: string[];
}

export interface AppointmentUpdatePayload {
  appointment_type?: string;
  scheduled_at?: string;
  duration_minutes?: number;
  location_text?: string;
  status?: string;
  reason?: string;
  notes?: string;
  cancellation_reason?: string;
}

export interface PrescriptionCreatePayload {
  farm_id: string;
  animal_id?: string;
  appointment_id?: string;
  diagnosis: string;
  medicine_name: string;
  dose: string;
  frequency?: string;
  duration_days?: number;
  route?: string;
  withdrawal_days?: number;
  valid_until?: string;
  refills_allowed?: number;
  special_instructions?: string;
  comments?: string;
}

export const vetService = {
  async getSummary(): Promise<VetDashboardSummary> {
    return req("GET", "/summary");
  },

  async getMyFarms(): Promise<FarmSummaryForVet[]> {
    return req("GET", "/farms");
  },

  async getFarmersDirectory(): Promise<FarmerDirectoryItem[]> {
    return req("GET", "/farmers/directory");
  },

  async assignFarm(farmId: string, notes?: string): Promise<void> {
    return req("POST", "/farms/assign", { farm_id: farmId, notes });
  },

  async unassignFarm(farmId: string): Promise<void> {
    return req("DELETE", `/farms/${farmId}/unassign`);
  },

  async getAppointments(filters?: {
    status?: string;
    farm_id?: string;
    from_date?: string;
    to_date?: string;
    skip?: number;
    limit?: number;
  }): Promise<VetAppointment[]> {
    return req("GET", `/appointments${qs(filters ?? {})}`);
  },

  async getTodaysAppointments(): Promise<VetAppointment[]> {
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString();
    const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();
    return req("GET", `/appointments${qs({ from_date: from, to_date: to })}`);
  },

  async updateAppointment(appointmentId: string, payload: AppointmentUpdatePayload): Promise<VetAppointment> {
    return req("PATCH", `/appointments/${appointmentId}`, payload);
  },

  async getPrescriptions(filters?: {
    farm_id?: string;
    animal_id?: string;
    status?: string;
    skip?: number;
    limit?: number;
  }): Promise<Prescription[]> {
    return req("GET", `/prescriptions${qs(filters ?? {})}`);
  },

  async createPrescription(payload: PrescriptionCreatePayload): Promise<Prescription> {
    return req("POST", "/prescriptions", payload);
  },

  async createAMULog(data: {
    farm_id: string;
    animal_id?: string;
    prescription_id?: string;
    species: string;
    drug_name: string;
    drug_class?: string;
    route: string;
    dosage: number;
    dosage_unit?: string;
    dosage_per_kg?: number;
    purpose?: string;
    administration_date: string;
    duration_days?: number;
    withdrawal_period_days?: number;
    batch_size?: number;
    reminder_enabled?: boolean;
    notes?: string;
  }): Promise<AMULog> {
    return req("POST", "/amu-logs", data);
  },

  async getAMULogs(filters?: {
    farm_id?: string;
    species?: string;
    drug_class?: string;
    from_date?: string;
    to_date?: string;
    skip?: number;
    limit?: number;
  }): Promise<AMULog[]> {
    return req("GET", `/amu-logs${qs(filters ?? {})}`);
  },

  async getAMUSummaryByDrug(farmId?: string, days = 30): Promise<AMUSummaryByDrug[]> {
    return req("GET", `/amu-logs/summary/by-drug${qs({ farm_id: farmId, days })}`);
  },

  async getMessages(farmId?: string, limit = 100): Promise<VetMessage[]> {
    return req("GET", `/messages${qs({ farm_id: farmId, limit })}`);
  },

  async sendMessage(data: {
    farm_id: string;
    farmer_user_id: string;
    message_text: string;
    attachment_url?: string;
  }): Promise<VetMessage> {
    return req("POST", "/messages", data);
  },

  async markMessagesRead(farmId: string): Promise<{ marked_read: number }> {
    return req("POST", `/messages/mark-read/${farmId}`);
  },

  async getAlerts(filters?: {
    unread_only?: boolean;
    severity?: string;
    skip?: number;
    limit?: number;
  }): Promise<VetAlert[]> {
    return req("GET", `/alerts${qs(filters ?? {})}`);
  },

  async markAlertsRead(alertIds: string[]): Promise<{ marked_read: number }> {
    return req("POST", "/alerts/mark-read", { alert_ids: alertIds });
  },

  async markAllAlertsRead(): Promise<{ marked_read: number }> {
    return req("POST", "/alerts/mark-all-read");
  },
};
