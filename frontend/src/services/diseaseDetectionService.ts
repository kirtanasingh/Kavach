// services/diseaseDetectionService.ts

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function uploadForDetection(
  file: File,
  animalType: string,
  token: string
): Promise<{ job_id: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('animal_type', animalType);

  const res = await fetch(`${API_BASE}/detections/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  if (!res.ok) throw new Error('Upload failed');
  return res.json();
}

export async function pollDetectionStatus(
  jobId: string,
  token: string
): Promise<{ status: 'processing' | 'done' | 'failed'; result: any }> {
  const res = await fetch(`${API_BASE}/detections/${jobId}/status`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Poll failed');
  return res.json();
}
