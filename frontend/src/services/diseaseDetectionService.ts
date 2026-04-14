const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_URL = `${API_BASE}/api/v1`;

export interface VLMAnalysisResult {
  disease: string;
  confidence: number;
  severity: 'mild' | 'moderate' | 'severe' | 'none' | 'unknown';
  visual_indicators: string[];
  recommendation: string;
  requires_vet: boolean;
  source: 'groq_vlm' | 'fallback';
  fallback_reason?: string;
}

/**
 * Upload image for VLM analysis.
 */
export async function analyzeImage(
  file: File,
  animalType: string
): Promise<VLMAnalysisResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('animal_type', animalType.toLowerCase());

  try {
    const res = await fetch(`${API_URL}/detect`, {
      method: 'POST',
      body: formData,
    });
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const errorMsg = errorData.detail || `API error: ${res.status} ${res.statusText}`;
      throw new Error(errorMsg);
    }
    
    return res.json();
  } catch (error: any) {
    if (error.message === 'Failed to fetch') {
      throw new Error('Cannot connect to backend. Make sure http://localhost:8000 is running.');
    }
    throw error;
  }
}
