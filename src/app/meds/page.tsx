"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { Header } from "@/components/header";
import { FREQUENCY_LABEL, defaultTimesFor } from "@/lib/schedule";

export default function MedsPage() {
  const { state, hydrated, removeCarePlan } = useStore();

  if (!hydrated) return null;

  const allMeds = state.carePlans.flatMap((p) =>
    p.medications.map((m) => ({ ...m, planId: p.id, diagnosis: p.diagnosis })),
  );

  return (
    <main className="flex-1 flex flex-col">
      <Header
        title="My medications"
        subtitle={`${allMeds.length} active`}
        action={
          <Link
            href="/scan"
            className="rounded-xl bg-primary text-primary-foreground text-sm font-semibold px-3 py-2"
          >
            + Add
          </Link>
        }
      />

      {allMeds.length === 0 && (
        <div className="px-5">
          <div className="rounded-2xl border border-card-border bg-card p-6 text-center">
            <div className="text-sm text-muted">No medications yet.</div>
            <Link
              href="/scan"
              className="mt-3 inline-block rounded-xl bg-primary text-primary-foreground font-semibold px-4 py-2 text-sm"
            >
              Scan paperwork
            </Link>
          </div>
        </div>
      )}

      <div className="px-5 flex flex-col gap-2.5">
        {allMeds.map((m) => {
          const times = m.times.length > 0 ? m.times : defaultTimesFor(m.frequency);
          return (
            <div
              key={m.id}
              className="rounded-2xl border border-card-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{m.name}</div>
                  <div className="text-xs text-muted mt-0.5">
                    {m.dose}
                    {m.route ? ` · ${m.route}` : ""} · {FREQUENCY_LABEL[m.frequency]}
                    {m.prn ? " (PRN)" : ""}
                  </div>
                  {m.indication && (
                    <div className="text-xs mt-1.5 text-foreground/70">
                      For {m.indication}
                    </div>
                  )}
                  {m.instructions && (
                    <div className="text-xs mt-1.5 leading-relaxed text-foreground/80">
                      {m.instructions}
                    </div>
                  )}
                  {times.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap mt-2.5">
                      {times.map((t) => (
                        <span
                          key={t}
                          className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-primary/10 text-primary"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {state.carePlans.length > 0 && (
        <section className="px-5 pt-6">
          <h3 className="text-xs uppercase tracking-wider text-muted mb-2">Care plans</h3>
          <div className="flex flex-col gap-2">
            {state.carePlans.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border border-card-border bg-card p-3 flex items-center justify-between"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">
                    {p.diagnosis ?? p.provider?.facility ?? "Care plan"}
                  </div>
                  <div className="text-[11px] text-muted">
                    {new Date(p.createdAt).toLocaleDateString()} · {p.medications.length} meds
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (confirm("Remove this care plan and its medications?")) {
                      removeCarePlan(p.id);
                    }
                  }}
                  className="text-xs text-danger"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
