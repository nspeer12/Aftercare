"use client";

import Link from "next/link";
import { useStore, useDueDosesForToday, useStreak } from "@/lib/store";
import { Header } from "@/components/header";

function StreakRing({ value }: { value: number }) {
  const ratio = Math.min(value / 7, 1);
  const circumference = 2 * Math.PI * 22;
  const dash = circumference * ratio;
  return (
    <svg viewBox="0 0 50 50" className="w-12 h-12 -rotate-90">
      <circle cx="25" cy="25" r="22" fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth="4" />
      <circle
        cx="25"
        cy="25"
        r="22"
        fill="none"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circumference}`}
        className="text-accent"
      />
    </svg>
  );
}

export default function HomePage() {
  const { state, hydrated, logDose } = useStore();
  const due = useDueDosesForToday();
  const { current } = useStreak();

  const taken = due.filter((d) => d.status === "taken").length;
  const total = due.length;
  const compliance = total === 0 ? 0 : Math.round((taken / total) * 100);

  if (!hydrated) {
    return (
      <main className="flex-1 flex items-center justify-center text-muted">Loading…</main>
    );
  }

  if (state.carePlans.length === 0) {
    return (
      <main className="flex-1 flex flex-col">
        <Header title="Welcome to Aftercare" subtitle="AI-powered medication compliance" />
        <div className="px-5 pt-2 pb-6 flex-1 flex flex-col gap-6">
          <div className="rounded-3xl border border-card-border bg-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
                  <path d="M4 7a3 3 0 0 1 3-3h7l6 6v11a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7Z" stroke="currentColor" strokeWidth="1.6" />
                  <path d="M14 4v6h6" stroke="currentColor" strokeWidth="1.6" />
                </svg>
              </div>
              <div>
                <h2 className="font-semibold">Scan your after-visit summary</h2>
                <p className="text-xs text-muted">We extract meds & instructions automatically.</p>
              </div>
            </div>
            <Link
              href="/scan"
              className="block w-full text-center rounded-xl bg-primary text-primary-foreground font-semibold py-3 active:scale-[0.99] transition"
            >
              Scan paperwork
            </Link>
            <Link
              href="/demo"
              className="block w-full text-center rounded-xl border border-card-border font-semibold py-3 mt-2 text-sm"
            >
              Try with sample data
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { t: "Reminders", d: "Right when you need to take it" },
              { t: "Streaks", d: "Build the habit, day after day" },
              { t: "Nudges", d: "Behavioral science prompts" },
            ].map((f) => (
              <div key={f.t} className="rounded-2xl border border-card-border bg-card p-3">
                <div className="text-xs font-semibold">{f.t}</div>
                <div className="text-[10px] text-muted mt-1 leading-tight">{f.d}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col">
      <Header
        title={`Hi${state.patientName ? `, ${state.patientName.split(" ")[0]}` : ""}`}
        subtitle={new Date().toLocaleDateString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
        })}
        action={
          <div className="relative flex items-center gap-2">
            <StreakRing value={current} />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-sm font-semibold leading-none">{current}</div>
              <div className="text-[9px] text-muted">day{current === 1 ? "" : "s"}</div>
            </div>
          </div>
        }
      />

      <div className="px-5">
        <div className="rounded-3xl bg-gradient-to-br from-primary to-[#6438d9] text-white p-5 shadow-lg shadow-primary/20">
          <div className="text-xs uppercase tracking-wider opacity-80">Today&apos;s compliance</div>
          <div className="flex items-end justify-between mt-1">
            <div className="text-4xl font-bold">{compliance}%</div>
            <div className="text-xs opacity-90">
              {taken} of {total} doses
            </div>
          </div>
          <div className="mt-3 h-2 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all"
              style={{ width: `${compliance}%` }}
            />
          </div>
        </div>
      </div>

      <section className="px-5 pt-5 pb-2 flex items-center justify-between">
        <h2 className="font-semibold">Today&apos;s schedule</h2>
        <Link href="/meds" className="text-xs text-primary font-medium">
          All meds →
        </Link>
      </section>

      <div className="px-5 flex flex-col gap-2.5">
        {due.length === 0 && (
          <div className="rounded-2xl border border-card-border bg-card p-5 text-center text-sm text-muted">
            No scheduled doses today. PRN meds available in your med list.
          </div>
        )}
        {due.map((d) => (
          <div
            key={d.scheduledFor}
            className={`rounded-2xl border bg-card p-4 flex items-center gap-3 transition ${
              d.status === "taken"
                ? "border-accent/30 bg-accent/5"
                : d.status === "skipped"
                ? "border-card-border opacity-60"
                : "border-card-border"
            }`}
          >
            <div
              className={`size-12 rounded-xl flex flex-col items-center justify-center font-mono ${
                d.status === "taken" ? "bg-accent/15 text-accent" : "bg-primary/10 text-primary"
              }`}
            >
              <div className="text-sm font-semibold leading-none">{d.scheduledTime.split(":")[0]}</div>
              <div className="text-[10px] opacity-70">:{d.scheduledTime.split(":")[1]}</div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{d.medicationName}</div>
              <div className="text-xs text-muted truncate">
                {d.dose}
                {d.instructions ? ` · ${d.instructions}` : ""}
              </div>
            </div>
            {d.status === "pending" ? (
              <div className="flex gap-1.5">
                <button
                  onClick={() => logDose(d.medicationId, d.scheduledFor, "skipped")}
                  className="size-9 rounded-full border border-card-border text-muted hover:text-foreground"
                  aria-label="Skip"
                >
                  ✕
                </button>
                <button
                  onClick={() => logDose(d.medicationId, d.scheduledFor, "taken")}
                  className="size-9 rounded-full bg-accent text-white shadow-md shadow-accent/30"
                  aria-label="Take"
                >
                  ✓
                </button>
              </div>
            ) : d.status === "taken" ? (
              <div className="text-xs font-semibold text-accent">Taken</div>
            ) : (
              <button
                onClick={() => logDose(d.medicationId, d.scheduledFor, "taken")}
                className="text-xs font-semibold text-muted underline"
              >
                Undo
              </button>
            )}
          </div>
        ))}
      </div>

      {state.carePlans[0]?.instructions?.length ? (
        <section className="px-5 pt-6 pb-2">
          <h2 className="font-semibold mb-2">Care plan reminders</h2>
          <div className="rounded-2xl border border-card-border bg-card divide-y divide-card-border">
            {state.carePlans[0].instructions.slice(0, 4).map((i) => (
              <div key={i.id} className="p-3 text-sm flex items-start gap-2">
                <span className="mt-1 size-1.5 rounded-full bg-primary shrink-0" />
                <span>{i.text}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="px-5 pt-6">
        <Link
          href="/chat"
          className="block rounded-2xl border border-card-border bg-card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                <path d="M4 6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H9l-4 4v-15Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-semibold text-sm">Ask Aftercare</div>
              <div className="text-xs text-muted">Questions about your meds or care plan</div>
            </div>
            <span className="text-muted">›</span>
          </div>
        </Link>
      </section>
    </main>
  );
}
