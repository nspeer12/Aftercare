"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Header } from "@/components/header";
import { SAMPLE_EXTRACTION } from "@/lib/sample-data";

export default function ProfilePage() {
  const { state, hydrated, setPatientName, reset, addCarePlanFromExtraction } =
    useStore();
  const [name, setName] = useState(state.patientName ?? "");

  if (!hydrated) return null;

  return (
    <main className="flex-1 flex flex-col">
      <Header title="Profile" subtitle="Manage your account" />

      <section className="px-5">
        <div className="rounded-2xl border border-card-border bg-card p-4">
          <label className="text-xs uppercase tracking-wider text-muted">Your name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setPatientName(name)}
            placeholder="e.g. Jeffrey Schaefer"
            className="w-full bg-transparent border-b border-card-border py-2 mt-1 outline-none focus:border-primary"
          />
        </div>
      </section>

      <section className="px-5 pt-5 grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-card-border bg-card p-3 text-center">
          <div className="text-xl font-bold">{state.carePlans.length}</div>
          <div className="text-[10px] text-muted uppercase tracking-wider">Plans</div>
        </div>
        <div className="rounded-2xl border border-card-border bg-card p-3 text-center">
          <div className="text-xl font-bold">
            {state.carePlans.flatMap((p) => p.medications).length}
          </div>
          <div className="text-[10px] text-muted uppercase tracking-wider">Meds</div>
        </div>
        <div className="rounded-2xl border border-card-border bg-card p-3 text-center">
          <div className="text-xl font-bold">{state.doseLogs.filter((l) => l.takenAt).length}</div>
          <div className="text-[10px] text-muted uppercase tracking-wider">Doses</div>
        </div>
      </section>

      <section className="px-5 pt-5 flex flex-col gap-2">
        <button
          onClick={() => {
            addCarePlanFromExtraction(SAMPLE_EXTRACTION);
          }}
          className="rounded-xl border border-card-border bg-card font-semibold py-3 text-sm"
        >
          Load sample care plan
        </button>
        <button
          onClick={() => {
            if (
              confirm(
                "Reset everything? This deletes your care plans, dose logs, and points.",
              )
            ) {
              reset();
              setName("");
            }
          }}
          className="rounded-xl border border-danger/40 text-danger font-semibold py-3 text-sm"
        >
          Reset all data
        </button>
      </section>

      <p className="px-5 pt-6 text-[11px] text-muted text-center">
        Aftercare is a prototype — not medical advice. Always follow your provider.
      </p>
    </main>
  );
}
