"use client";

import { useEffect, useRef, useState } from "react";

const DIMS = [
  { key: "subjects",    label: "Subjects & Objects" },
  { key: "colors",      label: "Colors & Palette" },
  { key: "composition", label: "Composition & Layout" },
  { key: "style",       label: "Style & Texture" },
  { key: "mood",        label: "Mood & Atmosphere" },
];

const TARGET_BANK = [
  { src: "/targets/target.jpg",  label: "Target 1" },
  { src: "/targets/target2.jpg", label: "Target 2" },
  { src: "/targets/target3.jpg", label: "Target 3" },
  { src: "/targets/taeget4.jpg", label: "Target 4" },
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

function ImageUpload({ label, id, file, onChange }: {
  label: string; id: string; file: File | null; onChange: (f: File) => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setPreview(URL.createObjectURL(f));
    onChange(f);
  };

  useEffect(() => {
    if (!file) {
      setPreview(null);
    } else {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  return (
    <div>
      <p style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a", marginBottom: 8 }}>{label}</p>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        style={{
          border: preview ? "1.5px solid #ddd" : "1.5px dashed #ccc",
          borderRadius: 10, cursor: "pointer", overflow: "hidden",
          height: 200, display: "flex", alignItems: "center", justifyContent: "center",
          background: "#fafaf8", position: "relative",
        }}
      >
        {preview
          ? <img src={preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span style={{ color: "#999", fontSize: 12 }}>Click or drop image</span>
            </div>
          )
        }
      </div>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
    </div>
  );
}

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start: number | null = null;
    const step = (ts: number) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setValue(target * ease);
      if (progress < 1) requestAnimationFrame(step);
    };
    const id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [target, duration]);
  return value;
}

function BarFill({ color, score }: { color: string; score: number }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setWidth(score * 10), 50);
    return () => clearTimeout(id);
  }, [score]);
  return <div className="bar-fill" style={{ background: color, width: `${width}%` }} />;
}

function ScoreCount({ value, color }: { value: number; color: string }) {
  const display = useCountUp(value);
  return (
    <div style={{ fontSize: 64, fontWeight: 700, letterSpacing: "-0.04em", color, lineHeight: 1 }}>
      {display.toFixed(1)}
    </div>
  );
}

export default function Home() {
  const [targetFile, setTargetFile] = useState<File | null>(null);
  const [userFile, setUserFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [showAbout, setShowAbout] = useState(false);

  const selectFromBank = async (src: string) => {
    const res = await fetch(src);
    const blob = await res.blob();
    const file = new File([blob], src.split("/").pop() || "target.jpg", { type: blob.type || "image/jpeg" });
    setTargetFile(file);
  };

  const reset = () => {
    setTargetFile(null);
    setUserFile(null);
    setPrompt("");
    setResult(null);
    setError("");
  };

  const evaluate = async () => {
    if (!targetFile || !userFile) return;
    setLoading(true);
    setError("");
    setResult(null);

    const form = new FormData();
    form.append("target", targetFile);
    form.append("student", userFile);
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

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        paddingBottom: 24, marginBottom: 32, borderBottom: "1px solid #e0e0e0",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <img src="/logo.png" alt="Castro Lab" width={52} height={52} className="header-logo" style={{ objectFit: "contain" }} />
          <h1 className="header-title" style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.03em" }}>Learn to See Again</h1>
        </div>
        <div className="header-buttons" style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowAbout(!showAbout)} style={{
            background: "none", border: "1.5px solid #e0e0e0", borderRadius: 8,
            padding: "6px 14px", fontSize: 12, color: "#1a1a1a", cursor: "pointer",
          }}>
            {showAbout ? "Close" : "How to"}
          </button>
          <button onClick={reset} style={{
            background: "none", border: "1.5px solid #e0e0e0", borderRadius: 8,
            padding: "6px 14px", fontSize: 12, color: "#1a1a1a", cursor: "pointer",
          }}>
            Start Over
          </button>
        </div>
      </div>

      {/* Philosophy — always visible */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 14, color: "#1a1a1a", lineHeight: 1.8 }}>
          Most people don't describe what they see — they describe what they think is there. This exercise makes that gap visible. When you have to put reality into words precisely enough for a machine to reconstruct it, every assumption, every skipped detail, every vague gesture becomes evidence. The goal isn't to get better at prompting. It's to get better at looking.
        </p>
      </div>

      {/* How to panel */}
      {showAbout && (
        <div style={{ background: "#fff", border: "1.5px solid #ebebeb", borderRadius: 12, padding: 24, marginBottom: 32 }}>
          <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "#1a1a1a", marginBottom: 14 }}>How to use</p>
          <ol style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              "Choose a target image from the bank below, or upload your own.",
              "Write a prompt describing what you see — as precisely as you can.",
              "Use your prompt in an image generation tool (Midjourney, DALL·E, etc.) and save the result.",
              "Upload your result here alongside the target.",
              "Read the feedback — not to score better next time, but to notice what you missed.",
            ].map((step, i) => (
              <li key={i} style={{ display: "flex", gap: 12, fontSize: 13, color: "#1a1a1a", lineHeight: 1.6 }}>
                <span style={{ color: "#999", minWidth: 18, fontVariantNumeric: "tabular-nums" }}>{i + 1}.</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Target bank */}
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "#1a1a1a", marginBottom: 10 }}>Target Bank</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {TARGET_BANK.map((t) => (
            <div
              key={t.src}
              onClick={() => selectFromBank(t.src)}
              style={{
                width: 80, height: 60, borderRadius: 8, overflow: "hidden", cursor: "pointer",
                border: targetFile?.name === t.src.split("/").pop() ? "2px solid #1a1a1a" : "2px solid transparent",
                outline: "1.5px solid #e0e0e0", transition: "border 0.15s",
              }}
            >
              <img src={t.src} alt={t.label} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          ))}
          <div style={{ fontSize: 12, color: "#999", display: "flex", alignItems: "center", paddingLeft: 4 }}>
            or upload below
          </div>
        </div>
      </div>

      {/* Upload row */}
      <div className="upload-grid">
        <ImageUpload label="Target Image" id="target" file={targetFile} onChange={setTargetFile} />
        <ImageUpload label="Your Result" id="user" file={userFile} onChange={setUserFile} />
      </div>

      {/* Prompt */}
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a", marginBottom: 8 }}>Add your prompt here</p>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          dir="auto"
          placeholder="Paste the prompt you used to generate your image…"
          style={{
            width: "100%", background: "#fafaf8", border: "1.5px solid #e0e0e0",
            borderRadius: 10, color: "#1a1a1a", fontSize: 14, padding: "12px 14px",
            resize: "vertical", minHeight: 80, fontFamily: "inherit", lineHeight: 1.5,
          }}
        />
      </div>

      <button
        onClick={evaluate}
        disabled={!targetFile || !userFile || loading}
        style={{
          width: "100%",
          background: loading || !targetFile || !userFile ? "#e8e8e8" : "#1a1a1a",
          color: loading || !targetFile || !userFile ? "#aaa" : "#fff",
          border: "none", borderRadius: 10, padding: "13px", fontSize: 14,
          fontWeight: 600, cursor: "pointer", transition: "background 0.2s",
        }}
      >
        {loading ? "Evaluating…" : "Evaluate"}
      </button>

      {error && <p style={{ marginTop: 16, color: "#b83030", fontSize: 13 }}>{error}</p>}

      {/* Results */}
      {result && (
        <div className="results-enter" style={{ marginTop: 48 }}>

          {/* Score count-up */}
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <ScoreCount value={result.overall_score} color={scoreColor(result.overall_score)} />
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "#1a1a1a", marginTop: 6 }}>
              Overall / 10
            </div>
          </div>

          {/* Dimension cards — staggered via CSS */}
          <div className="dims-grid">
            {DIMS.map(({ key, label }) => {
              const d = result.dimensions[key];
              const c = scoreColor(d.score);
              return (
                <div key={key} className="dim-card" style={{ background: "#fff", border: "1.5px solid #ebebeb", borderRadius: 10, padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.07em", color: "#1a1a1a" }}>{label}</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: c }}>{d.score}/10</span>
                  </div>
                  <div style={{ height: 3, background: "#f0f0f0", borderRadius: 2, marginBottom: 10 }}>
                    <BarFill color={c} score={d.score} />
                  </div>
                  <p style={{ fontSize: 12, color: "#1a1a1a", lineHeight: 1.5 }}>{d.feedback}</p>
                </div>
              );
            })}
          </div>

          {/* What worked / What to fix */}
          {[
            { title: "What worked", items: result.got_right, cls: "section-enter-1" },
            { title: "What to fix", items: result.to_fix,   cls: "section-enter-2" },
          ].map(({ title, items, cls }) => (
            <div key={title} className={cls} style={{ background: "#fff", border: "1.5px solid #ebebeb", borderRadius: 10, padding: 18, marginBottom: 10 }}>
              <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "#1a1a1a", marginBottom: 12 }}>{title}</p>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
                {items.map((t, i) => (
                  <li key={i} style={{ fontSize: 13, color: "#1a1a1a", lineHeight: 1.5, paddingLeft: 14, position: "relative" }}>
                    <span style={{ position: "absolute", left: 0, color: "#aaa" }}>–</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* How you see */}
          <div className="section-enter-3" style={{ background: "#fff", border: "1.5px solid #ebebeb", borderRadius: 10, padding: 18, marginBottom: 24 }}>
            <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "#1a1a1a", marginBottom: 12 }}>How you see</p>
            <p style={{ fontSize: 14, color: "#1a1a1a", lineHeight: 1.8 }}>{result.style_feedback}</p>
          </div>

          <button
            onClick={reset}
            style={{
              width: "100%", background: "none", border: "1.5px solid #e0e0e0",
              borderRadius: 10, padding: "13px", fontSize: 14, color: "#888",
              cursor: "pointer", transition: "border-color 0.2s",
            }}
          >
            Start Again
          </button>
        </div>
      )}
    </main>
  );
}
