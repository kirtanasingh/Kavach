import { useCallback, useRef, useState } from "react";

interface Pred {
  label: string;
  confidence: number;
}

interface Result {
  ml: {
    top_prediction: Pred;
    top_3: Pred[];
    is_confident: boolean;
    inference_ms: number;
  };
  explanation: string;
}

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export default function ImageAnalyzer() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) {
      return;
    }

    setPreview((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return URL.createObjectURL(f);
    });

    setFile(f);
    setResult(null);
    setError(null);
  }, []);

  const analyze = useCallback(async () => {
    if (!file) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append("file", file);

      const res = await fetch(`${API_BASE}/api/scan`, {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const e = await res.json().catch(() => ({}));
        throw new Error(e.detail ?? `HTTP ${res.status}`);
      }

      setResult((await res.json()) as Result);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [file]);

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: "none" }}
        onChange={onFileChange}
      />

      <div className="flex gap-3">
        <button className="px-4 py-2 rounded bg-green-700 text-white" onClick={() => inputRef.current?.click()} disabled={loading}>
          {file ? "Change Image" : "Upload Image"}
        </button>
        {file && !loading && (
          <button className="px-4 py-2 rounded bg-blue-700 text-white" onClick={analyze}>
            Analyze
          </button>
        )}
      </div>

      {preview && (
        <div className="rounded border p-3">
          <img src={preview} alt="preview" style={{ maxWidth: "100%", maxHeight: 300, borderRadius: 8 }} />
          <p className="text-sm text-gray-600 mt-2">
            {file?.name} - {((file?.size ?? 0) / 1024).toFixed(1)} KB
          </p>
        </div>
      )}

      {loading && <p>Analyzing... (ML + Groq explanation)</p>}
      {error && <p className="text-red-700">Error: {error}</p>}

      {result && (
        <div className="rounded border p-4 space-y-3 bg-white">
          <h2 className="text-xl font-semibold">
            {result.ml.top_prediction.label} - {(result.ml.top_prediction.confidence * 100).toFixed(1)}%
          </h2>
          {!result.ml.is_confident && <p className="text-amber-700">Low confidence prediction.</p>}
          <p className="text-xs text-gray-500">Inference: {result.ml.inference_ms}ms</p>

          <h3 className="font-medium">Top 3 Predictions</h3>
          <ul className="list-disc pl-6">
            {result.ml.top_3.map((p, i) => (
              <li key={i}>
                {p.label} - {(p.confidence * 100).toFixed(1)}%
              </li>
            ))}
          </ul>

          <h3 className="font-medium">Groq Clinical Analysis</h3>
          <p className="leading-7 whitespace-pre-wrap">{result.explanation}</p>
        </div>
      )}
    </div>
  );
}
