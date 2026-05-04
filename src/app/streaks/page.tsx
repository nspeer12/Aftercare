"use client";

import { useStore, useStreak } from "@/lib/store";
import { Header } from "@/components/header";

interface DayCell {
  date: Date;
  ymd: string;
  taken: number;
  total: number;
}

function lastNDays(n: number): Date[] {
  const out: Date[] = [];
  const d = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const c = new Date(d);
    c.setDate(d.getDate() - i);
    out.push(c);
  }
  return out;
}

export default function StreaksPage() {
  const { state, hydrated } = useStore();
  const { current, bestStreak } = useStreak();

  if (!hydrated) return null;

  const days: DayCell[] = lastNDays(28).map((date) => {
    const ymd = date.toISOString().slice(0, 10);
    const logs = state.doseLogs.filter((l) => l.scheduledFor.split("|")[1] === ymd);
    return {
      date,
      ymd,
      taken: logs.filter((l) => l.takenAt).length,
      total: logs.length,
    };
  });

  const badges = [
    { id: "first", label: "First dose", earned: state.doseLogs.some((l) => l.takenAt) },
    { id: "perfect-day", label: "Perfect day", earned: days.some((d) => d.total > 0 && d.taken === d.total) },
    { id: "streak-3", label: "3-day streak", earned: current >= 3 || bestStreak >= 3 },
    { id: "streak-7", label: "7-day streak", earned: current >= 7 || bestStreak >= 7 },
    { id: "100-points", label: "100 points", earned: state.pointsTotal >= 100 },
    { id: "consistent", label: "Consistent", earned: days.filter((d) => d.taken > 0).length >= 14 },
  ];

  return (
    <main className="flex-1 flex flex-col">
      <Header title="Streaks & rewards" subtitle="Small wins, every day" />

      <div className="px-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-gradient-to-br from-accent to-[#0e8a6c] text-white p-4">
          <div className="text-xs opacity-80 uppercase tracking-wider">Current</div>
          <div className="text-3xl font-bold mt-1">{current}</div>
          <div className="text-xs opacity-80">day{current === 1 ? "" : "s"}</div>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-primary to-[#6438d9] text-white p-4">
          <div className="text-xs opacity-80 uppercase tracking-wider">Points</div>
          <div className="text-3xl font-bold mt-1">{state.pointsTotal}</div>
          <div className="text-xs opacity-80">total</div>
        </div>
      </div>

      <section className="px-5 pt-5">
        <h3 className="text-sm font-semibold mb-2">Last 4 weeks</h3>
        <div className="rounded-2xl border border-card-border bg-card p-4">
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((d) => {
              const ratio = d.total === 0 ? 0 : d.taken / d.total;
              const bg =
                d.total === 0
                  ? "bg-card-border/40"
                  : ratio === 1
                  ? "bg-accent"
                  : ratio >= 0.5
                  ? "bg-accent/60"
                  : ratio > 0
                  ? "bg-warn/60"
                  : "bg-danger/40";
              return (
                <div
                  key={d.ymd}
                  title={`${d.ymd}: ${d.taken}/${d.total}`}
                  className={`aspect-square rounded-md ${bg}`}
                />
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px] text-muted">
            <span>4 weeks ago</span>
            <span>Today</span>
          </div>
        </div>
      </section>

      <section className="px-5 pt-5">
        <h3 className="text-sm font-semibold mb-2">Badges</h3>
        <div className="grid grid-cols-3 gap-2">
          {badges.map((b) => (
            <div
              key={b.id}
              className={`rounded-2xl border p-3 text-center ${
                b.earned
                  ? "border-accent/30 bg-accent/5"
                  : "border-card-border bg-card opacity-50"
              }`}
            >
              <div
                className={`mx-auto size-10 rounded-full flex items-center justify-center text-lg ${
                  b.earned ? "bg-accent/15 text-accent" : "bg-card-border/40 text-muted"
                }`}
              >
                {b.earned ? "★" : "☆"}
              </div>
              <div className="text-[10px] font-medium mt-1.5 leading-tight">{b.label}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
