import { getAccessToken } from "./authService";

const configuredApiBase = (import.meta.env.VITE_API_URL || "").trim();
const API_BASES = configuredApiBase
  ? [configuredApiBase]
  : ["http://127.0.0.1:8000", "http://localhost:8000"];

function getAuthHeaders(): HeadersInit {
  const token = getAccessToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let networkError: unknown = null;
  let res: Response | null = null;

  for (const apiBase of API_BASES) {
    try {
      res = await fetch(`${apiBase}/api/v1/farms${path}`, {
        method,
        headers: getAuthHeaders(),
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      networkError = null;
      break;
    } catch (error) {
      networkError = error;
    }
  }

  if (!res) {
    const message = networkError instanceof Error ? networkError.message : "Failed to fetch";
    throw new Error(
      message.toLowerCase().includes("failed to fetch")
        ? "Cannot reach backend API. Ensure backend is running on port 8000."
        : message
    );
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? `API error ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

const FARM_NOT_FOUND_MSG = "Farm not found";
const FARM_ALREADY_EXISTS_MSG = "Farm already exists";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message || "";
  return String(error || "");
}

function isFarmMissingError(error: unknown): boolean {
  return getErrorMessage(error).toLowerCase().includes(FARM_NOT_FOUND_MSG.toLowerCase());
}

function isFarmAlreadyExistsError(error: unknown): boolean {
  return getErrorMessage(error).toLowerCase().includes(FARM_ALREADY_EXISTS_MSG.toLowerCase());
}

async function ensureFarmExists(seed?: { farm_name?: string; city?: string; state?: string }): Promise<Farm> {
  try {
    return await request<Farm>("GET", "/me");
  } catch (error) {
    if (!isFarmMissingError(error)) throw error;

    const fallbackName = (seed?.farm_name || "My Farm").trim() || "My Farm";
    const createPayload: Partial<Farm> & { farm_name: string } = {
      farm_name: fallbackName,
      city: seed?.city,
      state: seed?.state,
    };

    try {
      return await request<Farm>("POST", "/me", createPayload);
    } catch (createError) {
      if (isFarmAlreadyExistsError(createError)) {
        return await request<Farm>("GET", "/me");
      }
      throw createError;
    }
  }
}

export interface Farm {
  id: string;
  owner_user_id: string;
  farm_name: string;
  farm_type?: string;
  description?: string;
  farm_size?: number;
  size_unit?: string;
  established_year?: number;
  total_animals?: number;
  primary_products?: string[];
  annual_revenue?: number;
  street_address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
}

export interface Animal {
  id: string;
  farm_id: string;
  tag_number: string;
  animal_name?: string;
  species: string;
  breed?: string;
  age_months?: number;
  age_text?: string;
  health_status: string;
  vaccination_status: string;
  last_checkup_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface FarmTask {
  id: string;
  farm_id: string;
  title: string;
  description?: string;
  assigned_to_name?: string;
  priority: string;
  status: string;
  category?: string;
  due_at?: string;
  completed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Treatment {
  id: string;
  farm_id: string;
  animal_id?: string;
  diagnosis: string;
  medication: string;
  dosage?: string;
  route?: string;
  prescribed_by_name?: string;
  start_date: string;
  end_date?: string;
  status: string;
  withdrawal_days: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface WithdrawalRecord {
  id: string;
  farm_id: string;
  animal_id?: string;
  treatment_id?: string;
  medicine_name: string;
  administered_at: string;
  withdrawal_days: number;
  safe_after_at?: string;
  collection_attempted_at?: string;
  collection_result?: string;
  violation_flag: boolean;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface FarmAlert {
  id: string;
  farm_id: string;
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

export interface DashboardSummary {
  farm: Farm | null;
  total_animals: number;
  healthy_animals: number;
  sick_animals: number;
  pending_tasks: number;
  overdue_tasks: number;
  active_treatments: number;
  pending_withdrawals: number;
  violation_count: number;
  unread_alerts: number;
}

export interface RiskAnswer {
  question_key: string;
  answer_boolean?: boolean;
  answer_text?: string;
}

export interface RiskProfileQnA {
  farm_name: string;
  location_city_village: string;
  location_state: string;
  animal_count: number;
  animal_types: string[];
  water_source: "well" | "river" | "municipal" | "borewell" | "mixed" | "other";
  feeding_system: "manual" | "automated" | "grazing" | "mixed";
  vaccination_status: "regular" | "irregular" | "unknown";
  recent_disease: boolean;
  recent_disease_details?: string;
  waste_management: "scientific" | "basic" | "open_disposal" | "unknown";
  vet_service_usage: "frequent" | "rare" | "none";
}

export interface RiskRecommendation {
  code: string;
  title: string;
  message: string;
  priority: "high" | "medium" | "low";
}

export interface RiskAssessmentStatus {
  exists: boolean;
  is_complete: boolean;
  completion_percent: number;
  risk_score?: number | null;
  risk_level?: string | null;
  updated_at?: string | null;
}

export interface RiskAssessmentProfile extends RiskProfileQnA {
  id: string;
  farm_id: string;
  completion_percent: number;
  risk_score?: number | null;
  risk_level?: string | null;
  top_risk_factors?: string[];
  is_draft: boolean;
  submitted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface RiskAssessmentInsights {
  risk_score: number;
  risk_level: string;
  top_risk_factors: string[];
  recommendations: RiskRecommendation[];
  dashboard_flags: Record<string, boolean>;
}

export interface VetOption {
  vet_user_id: string;
  vet_name: string;
  email?: string;
  phone_number?: string;
}

export interface FarmerAppointmentRequest {
  id: string;
  vet_user_id: string;
  vet_name?: string;
  farm_id: string;
  appointment_type: string;
  scheduled_at: string;
  status: string;
  reason?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const farmOwnerService = {
  async getSummary(): Promise<DashboardSummary> {
    return request("GET", "/me/summary");
  },

  async getFarm(): Promise<Farm> {
    return request("GET", "/me");
  },

  async createFarm(data: Partial<Farm> & { farm_name: string }): Promise<Farm> {
    return request("POST", "/me", data);
  },

  async updateFarm(data: Partial<Farm>): Promise<Farm> {
    return request("PATCH", "/me", data);
  },

  async getRiskAssessment() {
    await ensureFarmExists();
    return request<RiskAnswer[]>("GET", "/me/risk-assessment");
  },

  async submitRiskAssessment(answers: RiskAnswer[], score_snapshot?: number) {
    await ensureFarmExists();
    return request("POST", "/me/risk-assessment", { answers, score_snapshot });
  },

  async getRiskAssessmentStatus(): Promise<RiskAssessmentStatus> {
    try {
      return await request("GET", "/me/risk-assessment/status");
    } catch (error) {
      if (isFarmMissingError(error)) {
        return {
          exists: false,
          is_complete: false,
          completion_percent: 0,
          risk_score: null,
          risk_level: null,
          updated_at: null,
        };
      }
      throw error;
    }
  },

  async getRiskAssessmentProfile(): Promise<RiskAssessmentProfile> {
    await ensureFarmExists();
    return request("GET", "/me/risk-assessment/profile");
  },

  async saveRiskAssessmentDraft(data: RiskProfileQnA): Promise<RiskAssessmentProfile> {
    await ensureFarmExists({
      farm_name: data.farm_name,
      city: data.location_city_village,
      state: data.location_state,
    });
    return request("POST", "/me/risk-assessment/draft", data);
  },

  async submitRiskAssessmentProfile(data: RiskProfileQnA): Promise<RiskAssessmentProfile> {
    await ensureFarmExists({
      farm_name: data.farm_name,
      city: data.location_city_village,
      state: data.location_state,
    });
    return request("POST", "/me/risk-assessment/submit", data);
  },

  async getRiskAssessmentInsights(): Promise<RiskAssessmentInsights> {
    await ensureFarmExists();
    return request("GET", "/me/risk-assessment/insights");
  },

  async getAnimals(filters?: {
    species?: string;
    health_status?: string;
    skip?: number;
    limit?: number;
  }): Promise<Animal[]> {
    const params = new URLSearchParams();
    if (filters?.species) params.set("species", filters.species);
    if (filters?.health_status) params.set("health_status", filters.health_status);
    if (typeof filters?.skip === "number") params.set("skip", String(filters.skip));
    if (typeof filters?.limit === "number") params.set("limit", String(filters.limit));
    const qs = params.toString() ? `?${params}` : "";
    return request("GET", `/me/animals${qs}`);
  },

  async getAnimal(animalId: string): Promise<Animal> {
    return request("GET", `/me/animals/${animalId}`);
  },

  async createAnimal(data: Omit<Animal, "id" | "farm_id" | "created_at" | "updated_at">): Promise<Animal> {
    return request("POST", "/me/animals", data);
  },

  async updateAnimal(animalId: string, data: Partial<Animal>): Promise<Animal> {
    return request("PATCH", `/me/animals/${animalId}`, data);
  },

  async deleteAnimal(animalId: string): Promise<void> {
    return request("DELETE", `/me/animals/${animalId}`);
  },

  async getTasks(filters?: {
    status?: string;
    priority?: string;
    skip?: number;
    limit?: number;
  }): Promise<FarmTask[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.set("status", filters.status);
    if (filters?.priority) params.set("priority", filters.priority);
    if (typeof filters?.skip === "number") params.set("skip", String(filters.skip));
    if (typeof filters?.limit === "number") params.set("limit", String(filters.limit));
    const qs = params.toString() ? `?${params}` : "";
    return request("GET", `/me/tasks${qs}`);
  },

  async createTask(data: Omit<FarmTask, "id" | "farm_id" | "created_at" | "updated_at">): Promise<FarmTask> {
    return request("POST", "/me/tasks", data);
  },

  async updateTask(taskId: string, data: Partial<FarmTask>): Promise<FarmTask> {
    return request("PATCH", `/me/tasks/${taskId}`, data);
  },

  async completeTask(taskId: string): Promise<FarmTask> {
    return request("PATCH", `/me/tasks/${taskId}`, {
      status: "completed",
      completed_at: new Date().toISOString(),
    });
  },

  async deleteTask(taskId: string): Promise<void> {
    return request("DELETE", `/me/tasks/${taskId}`);
  },

  async getTreatments(filters?: {
    animal_id?: string;
    status?: string;
    skip?: number;
    limit?: number;
  }): Promise<Treatment[]> {
    const params = new URLSearchParams();
    if (filters?.animal_id) params.set("animal_id", filters.animal_id);
    if (filters?.status) params.set("status", filters.status);
    if (typeof filters?.skip === "number") params.set("skip", String(filters.skip));
    if (typeof filters?.limit === "number") params.set("limit", String(filters.limit));
    const qs = params.toString() ? `?${params}` : "";
    return request("GET", `/me/treatments${qs}`);
  },

  async createTreatment(data: Omit<Treatment, "id" | "farm_id" | "created_at" | "updated_at">): Promise<Treatment> {
    return request("POST", "/me/treatments", data);
  },

  async updateTreatment(treatmentId: string, data: Partial<Treatment>): Promise<Treatment> {
    return request("PATCH", `/me/treatments/${treatmentId}`, data);
  },

  async getWithdrawals(filters?: {
    animal_id?: string;
    violation_only?: boolean;
    skip?: number;
    limit?: number;
  }): Promise<WithdrawalRecord[]> {
    const params = new URLSearchParams();
    if (filters?.animal_id) params.set("animal_id", filters.animal_id);
    if (filters?.violation_only) params.set("violation_only", "true");
    if (typeof filters?.skip === "number") params.set("skip", String(filters.skip));
    if (typeof filters?.limit === "number") params.set("limit", String(filters.limit));
    const qs = params.toString() ? `?${params}` : "";
    return request("GET", `/me/withdrawals${qs}`);
  },

  async createWithdrawal(data: {
    animal_id?: string;
    treatment_id?: string;
    medicine_name: string;
    administered_at: string;
    withdrawal_days: number;
    notes?: string;
  }): Promise<WithdrawalRecord> {
    return request("POST", "/me/withdrawals", data);
  },

  async logCollectionAttempt(
    withdrawalId: string,
    data: {
      collection_attempted_at: string;
      collection_result: "safe" | "unsafe" | "skipped";
      notes?: string;
    }
  ): Promise<WithdrawalRecord> {
    return request("POST", `/me/withdrawals/${withdrawalId}/collection-attempt`, data);
  },

  async getAlerts(filters?: {
    unread_only?: boolean;
    severity?: string;
    skip?: number;
    limit?: number;
  }): Promise<FarmAlert[]> {
    const params = new URLSearchParams();
    if (filters?.unread_only) params.set("unread_only", "true");
    if (filters?.severity) params.set("severity", filters.severity);
    if (typeof filters?.skip === "number") params.set("skip", String(filters.skip));
    if (typeof filters?.limit === "number") params.set("limit", String(filters.limit));
    const qs = params.toString() ? `?${params}` : "";
    return request("GET", `/me/alerts${qs}`);
  },

  async markAlertsRead(alertIds: string[]): Promise<{ marked_read: number }> {
    return request("POST", "/me/alerts/mark-read", { alert_ids: alertIds });
  },

  async markAllAlertsRead(): Promise<{ marked_read: number }> {
    return request("POST", "/me/alerts/mark-all-read");
  },

  async getMyVets(): Promise<VetOption[]> {
    await ensureFarmExists();
    return request("GET", "/me/vets");
  },

  async getAppointmentRequests(filters?: { status?: string; skip?: number; limit?: number }): Promise<FarmerAppointmentRequest[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.set("status", filters.status);
    if (typeof filters?.skip === "number") params.set("skip", String(filters.skip));
    if (typeof filters?.limit === "number") params.set("limit", String(filters.limit));
    const qs = params.toString() ? `?${params}` : "";
    await ensureFarmExists();
    return request("GET", `/me/appointments/requests${qs}`);
  },

  async createAppointmentRequest(data: {
    vet_user_id: string;
    appointment_type: string;
    preferred_datetime: string;
    reason_notes: string;
    duration_minutes?: number;
  }): Promise<FarmerAppointmentRequest> {
    await ensureFarmExists();
    return request("POST", "/me/appointments/requests", data);
  },
};
