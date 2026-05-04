"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { useStore } from "@/lib/store";
import type { ExtractionResult } from "@/lib/types";
import { FREQUENCY_LABEL, defaultTimesFor } from "@/lib/schedule";

type Status = "idle" | "reading" | "extracting" | "review" | "error";

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export default function ScanPage() {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null);
  const [pastedText, setPastedText] = useState("");

  const { addCarePlanFromExtraction } = useStore();

  async function handleFile(file: File) {
    setError(null);
    setExtraction(null);
    setStatus("reading");

    try {
      const dataUrl = await fileToDataUrl(file);
      const isPdf = file.type === "application/pdf";
      setPreview(isPdf ? null : dataUrl);
      setStatus("extracting");

      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          isPdf ? { pdfDataUrl: dataUrl } : { imageDataUrl: dataUrl },
        ),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Server returned ${res.status}`);
      }

      const data = (await res.json()) as ExtractionResult;
      setExtraction(data);
      setStatus("review");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to extract");
      setStatus("error");
    }
  }

  async function extractFromText() {
    if (!pastedText.trim()) return;
    setError(null);
    setExtraction(null);
    setPreview(null);
    setStatus("extracting");

    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: pastedText }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Server returned ${res.status}`);
      }
      const data = (await res.json()) as ExtractionResult;
      setExtraction(data);
      setStatus("review");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to extract");
      setStatus("error");
    }
  }

  function confirmAndSave() {
    if (!extraction) return;
    addCarePlanFromExtraction(extraction);
    router.push("/");
  }

  return (
    <main className="flex-1 flex flex-col">
      <Header
        title="Scan paperwork"
        subtitle="After-visit summary, discharge sheet, or med list"
      />

      {status === "idle" && (
        <div className="px-5 flex-1 flex flex-col gap-4">
          <button
            onClick={() => cameraInput.current?.click()}
            className="rounded-3xl border-2 border-dashed border-card-border bg-card p-8 flex flex-col items-center gap-3 active:scale-[0.99] transition"
          >
            <div className="size-14 rounded-2xl bg-primary/15 text-primary flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7">
                <path d="M4 8a2 2 0 0 1 2-2h2l2-2h4l2 2h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="12" cy="12.5" r="3.5" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </div>
            <div className="text-center">
              <div className="font-semibold">Take a photo</div>
              <div className="text-xs text-muted mt-0.5">Use your camera to capture the page</div>
            </div>
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => fileInput.current?.click()}
              className="rounded-2xl border border-card-border bg-card p-4 flex flex-col items-center gap-2 text-sm font-medium"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-primary">
                <path d="M4 16l4-4 4 4 8-8M4 20h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Upload image
            </button>
            <button
              onClick={() => fileInput.current?.click()}
              className="rounded-2xl border border-card-border bg-card p-4 flex flex-col items-center gap-2 text-sm font-medium"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-primary">
                <path d="M7 3h7l5 5v11a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3Z" stroke="currentColor" strokeWidth="1.6" />
                <path d="M14 3v5h5" stroke="currentColor" strokeWidth="1.6" />
              </svg>
              Upload PDF
            </button>
          </div>

          <div className="mt-4">
            <div className="text-xs uppercase tracking-wider text-muted mb-2">Or paste text</div>
            <textarea
              className="w-full rounded-2xl border border-card-border bg-card p-3 text-sm resize-y min-h-32"
              placeholder="Paste your discharge instructions or medication list…"
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
            />
            <button
              onClick={extractFromText}
              disabled={!pastedText.trim()}
              className="mt-2 w-full rounded-xl bg-primary text-primary-foreground font-semibold py-3 disabled:opacity-40"
            >
              Extract from text
            </button>
          </div>

          <input
            ref={fileInput}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <input
            ref={cameraInput}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </div>
      )}

      {(status === "reading" || status === "extracting") && (
        <div className="px-5 flex-1 flex flex-col items-center justify-center gap-4">
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Preview"
              className="rounded-2xl max-h-72 border border-card-border"
            />
          )}
          <div className="flex items-center gap-3 text-sm text-muted">
            <span className="size-3 rounded-full bg-primary animate-pulse" />
            {status === "reading" ? "Reading file…" : "Extracting with AI…"}
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="px-5 pt-4">
          <div className="rounded-2xl border border-danger/40 bg-danger/5 text-danger p-4 text-sm">
            <div className="font-semibold mb-1">Extraction failed</div>
            <div className="opacity-90">{error}</div>
          </div>
          <button
            onClick={() => setStatus("idle")}
            className="mt-4 w-full rounded-xl border border-card-border font-semibold py-3"
          >
            Try again
          </button>
        </div>
      )}

      {status === "review" && extraction && (
        <ReviewExtraction
          preview={preview}
          extraction={extraction}
          onChange={setExtraction}
          onCancel={() => setStatus("idle")}
          onConfirm={confirmAndSave}
        />
      )}
    </main>
  );
}

function ReviewExtraction({
  preview,
  extraction,
  onChange,
  onCancel,
  onConfirm,
}: {
  preview: string | null;
  extraction: ExtractionResult;
  onChange: (e: ExtractionResult) => void;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="px-5 flex flex-col gap-4">
      {preview && (
        <div className="flex gap-3 items-start">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Source"
            className="rounded-xl size-20 object-cover border border-card-border"
          />
          <div>
            <div className="text-xs uppercase tracking-wider text-muted">Source</div>
            <div className="font-semibold text-sm">
              {extraction.provider?.facility ?? "Visit"}
            </div>
            <div className="text-xs text-muted">
              {extraction.provider?.visitDate ?? ""}
              {extraction.provider?.name ? ` · ${extraction.provider.name}` : ""}
            </div>
          </div>
        </div>
      )}

      {extraction.diagnosis && (
        <div className="rounded-2xl border border-card-border bg-card p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted">Diagnosis</div>
          <div className="font-medium text-sm mt-0.5">{extraction.diagnosis}</div>
        </div>
      )}

      <section>
        <h3 className="text-sm font-semibold mb-2 px-1">
          Medications ({extraction.medications.length})
        </h3>
        <div className="flex flex-col gap-2">
          {extraction.medications.map((m, idx) => (
            <div key={idx} className="rounded-2xl border border-card-border bg-card p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="font-semibold text-sm">{m.name}</div>
                <button
                  onClick={() =>
                    onChange({
                      ...extraction,
                      medications: extraction.medications.filter((_, i) => i !== idx),
                    })
                  }
                  className="text-xs text-muted"
                >
                  Remove
                </button>
              </div>
              <div className="text-xs text-muted mt-0.5">
                {m.dose}
                {m.route ? ` · ${m.route}` : ""} · {FREQUENCY_LABEL[m.frequency]}
                {m.prn ? " (PRN)" : ""}
              </div>
              {m.instructions && (
                <div className="text-xs mt-1.5 text-foreground/80 leading-relaxed">
                  {m.instructions}
                </div>
              )}
              {m.times.length === 0 && !m.prn && m.frequency !== "as_needed" && (
                <div className="text-[10px] text-muted mt-1">
                  Default times: {defaultTimesFor(m.frequency).join(", ")}
                </div>
              )}
            </div>
          ))}
          {extraction.medications.length === 0 && (
            <div className="text-xs text-muted text-center py-3">
              No medications detected.
            </div>
          )}
        </div>
      </section>

      {extraction.instructions.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold mb-2 px-1">
            Instructions ({extraction.instructions.length})
          </h3>
          <div className="rounded-2xl border border-card-border bg-card divide-y divide-card-border">
            {extraction.instructions.map((i, idx) => (
              <div key={idx} className="p-3 text-sm flex gap-2 items-start">
                {i.category && (
                  <span className="mt-0.5 text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary shrink-0">
                    {i.category}
                  </span>
                )}
                <span>{i.text}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="flex gap-2 pt-2">
        <button
          onClick={onCancel}
          className="flex-1 rounded-xl border border-card-border font-semibold py-3"
        >
          Discard
        </button>
        <button
          onClick={onConfirm}
          className="flex-[2] rounded-xl bg-primary text-primary-foreground font-semibold py-3"
        >
          Add to my plan
        </button>
      </div>
    </div>
  );
}
