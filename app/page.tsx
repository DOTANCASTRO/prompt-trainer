"use client";

import { useRef, useState } from "react";

const DIMS = [
  { key: "subjects",    label: "Subjects & Objects" },
  { key: "colors",      label: "Colors & Palette" },
  { key: "composition", label: "Composition & Layout" },
  { key: "style",       label: "Style & Texture" },
  { key: "mood",        label: "Mood & Atmosphere" },
];

type DimResult = { score: number; feedback: string };
type Result = {
  dimensions: Record<string, DimResult>;
  overall_score: number;
  got_right: string[];
  to_fix: string[];
  style_feedback: string;
};

function scoreColor(s: number) {
  if (s >= 7) return "#2d7a2d";
  if (s >= 4) return "#a06000";
  return "#b83030";
}

function ImageUpload({
  label, id, onChange,
}: { label: string; id: string; onChange: (f: File) => void }) {
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setPreview(URL.createObjectURL(file));
    onChange(file);
  };

  return (
    <div>
      <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "#888", marginBottom: 8 }}>{label}</p>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        style={{
          border: preview ? "1.5px solid #ddd" : "1.5px dashed #ccc",
          borderRadius: 10,
          cursor: "pointer",
          overflow: "hidden",
          height: 200,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fafaf8",
          position: "relative",
        }}
      >
        {preview ? (
          <img src={preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span style={{ color: "#bbb", fontSize: 13 }}>Click or drop image</span>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
    </div>
  );
}

export default function Home() {
  const [targetFile, setTargetFile] = useState<File | null>(null);
  const [studentFile, setStudentFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");

  const evaluate = async () => {
    if (!targetFile || !studentFile) return;
    setLoading(true);
    setError("");
    setResult(null);

    const form = new FormData();
    form.append("target", targetFile);
    form.append("student", studentFile);
    form.append("prompt", prompt);

    try {
      const res = await fetch("/api/compare", { method: "POST", body: form });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px" }}>

      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em", marginBottom: 4 }}>
          Learn to see again
        </h1>
        <p style={{ fontSize: 13, color: "#888" }}>
          Upload the target image and the student's result to get a detailed comparison.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <ImageUpload label="Target Image" id="target" onChange={setTargetFile} />
        <ImageUpload label="Student's Result" id="student" onChange={setStudentFile} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "#888", marginBottom: 8 }}>
          Student's Prompt
        </p>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Paste the prompt the student used…"
          style={{
            width: "100%", background: "#fafaf8", border: "1.5px solid #e0e0e0",
            borderRadius: 10, color: "#1a1a1a", fontSize: 14, padding: "12px 14px",
            resize: "vertical", minHeight: 80, fontFamily: "inherit", lineHeight: 1.5,
          }}
        />
      </div>

      <button
        onClick={evaluate}
        disabled={!targetFile || !studentFile || loading}
        style={{
          width: "100%", background: loading || !targetFile || !studentFile ? "#e8e8e8" : "#1a1a1a",
          color: loading || !targetFile || !studentFile ? "#aaa" : "#fff",
          border: "none", borderRadius: 10, padding: "13px", fontSize: 14,
          fontWeight: 600, cursor: "pointer", transition: "background 0.2s",
        }}
      >
        {loading ? "Evaluating…" : "Evaluate"}
      </button>

      {error && (
        <p style={{ marginTop: 16, color: "#b83030", fontSize: 13 }}>{error}</p>
      )}

      {result && (
        <div style={{ marginTop: 48 }}>

          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={{ fontSize: 64, fontWeight: 700, letterSpacing: "-0.04em", color: scoreColor(result.overall_score), lineHeight: 1 }}>
              {result.overall_score.toFixed(1)}
            </div>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "#aaa", marginTop: 6 }}>
              Overall / 10
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
            {DIMS.map(({ key, label }) => {
              const d = result.dimensions[key];
              const c = scoreColor(d.score);
              return (
                <div key={key} style={{ background: "#fff", border: "1.5px solid #ebebeb", borderRadius: 10, padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", color: "#aaa" }}>{label}</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: c }}>{d.score}/10</span>
                  </div>
                  <div style={{ height: 3, background: "#f0f0f0", borderRadius: 2, marginBottom: 10 }}>
                    <div style={{ height: 3, borderRadius: 2, background: c, width: `${d.score * 10}%`, transition: "width 0.5s ease" }} />
                  </div>
                  <p style={{ fontSize: 12, color: "#666", lineHeight: 1.5 }}>{d.feedback}</p>
                </div>
              );
            })}
          </div>

          {[
            { title: "What worked", items: result.got_right },
            { title: "What to fix", items: result.to_fix },
          ].map(({ title, items }) => (
            <div key={title} style={{ background: "#fff", border: "1.5px solid #ebebeb", borderRadius: 10, padding: 18, marginBottom: 10 }}>
              <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "#aaa", marginBottom: 12 }}>{title}</p>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                {items.map((t, i) => (
                  <li key={i} style={{ fontSize: 13, color: "#444", lineHeight: 1.5, paddingLeft: 14, position: "relative" }}>
                    <span style={{ position: "absolute", left: 0, color: "#ccc" }}>–</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div style={{ background: "#fff", border: "1.5px solid #ebebeb", borderRadius: 10, padding: 18 }}>
            <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "#aaa", marginBottom: 12 }}>How you see</p>
            <p style={{ fontSize: 14, color: "#444", lineHeight: 1.8 }}>
              {result.style_feedback}
            </p>
          </div>

        </div>
      )}
    </main>
  );
}
