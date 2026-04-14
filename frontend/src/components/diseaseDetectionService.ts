/**
 * diseaseDetectionService.ts
 *
 * Synchronous mode: POST /api/v1/scan/{animal_type} runs the full VLM
 * pipeline and returns the complete result in one response (10–30 s).
 * No polling required.
 */

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export interface ScanResultJson {
  disease_name: string;
  confidence: number;
  findings: string[];
}

export interface FinalScanOutput {
  case_id: string;
  status: "completed" | "flagged" | "manual_review";
  triage_score: "HIGH" | "MEDIUM" | "LOW";
  result_json: ScanResultJson;
}

/**
 * Upload an animal image and wait for the full diagnosis.
 * Resolves with the complete FinalScanOutput from the backend.
 * Throws on HTTP errors or network failures.
 */
export async function runScan(
  file: File,
  animalType: string,
  token: string
): Promise<FinalScanOutput> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(
    `${API_BASE}/api/v1/scan/${encodeURIComponent(animalType)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        // Do NOT set Content-Type — browser sets it with the correct boundary
      },
      body: formData,
    }
  );

  if (!response.ok) {
    let detail = `HTTP ${response.status}`;
    try {
      const err = await response.json();
      detail = err.detail ?? detail;
    } catch {
      /* ignore parse errors */
    }
    throw new Error(detail);
  }

  return response.json() as Promise<FinalScanOutput>;
}