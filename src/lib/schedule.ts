import type { Frequency, Medication } from "./types";

export const FREQUENCY_LABEL: Record<Frequency, string> = {
  once_daily: "Once daily",
  twice_daily: "Twice daily",
  three_times_daily: "3× daily",
  four_times_daily: "4× daily",
  every_4_hours: "Every 4 hours",
  every_6_hours: "Every 6 hours",
  every_8_hours: "Every 8 hours",
  every_12_hours: "Every 12 hours",
  as_needed: "As needed",
  weekly: "Weekly",
  custom: "Custom",
};

const DEFAULT_TIMES: Record<Frequency, string[]> = {
  once_daily: ["09:00"],
  twice_daily: ["09:00", "21:00"],
  three_times_daily: ["08:00", "14:00", "20:00"],
  four_times_daily: ["08:00", "12:00", "16:00", "20:00"],
  every_4_hours: ["08:00", "12:00", "16:00", "20:00", "00:00", "04:00"],
  every_6_hours: ["06:00", "12:00", "18:00", "00:00"],
  every_8_hours: ["08:00", "16:00", "00:00"],
  every_12_hours: ["08:00", "20:00"],
  as_needed: [],
  weekly: ["09:00"],
  custom: [],
};

export function defaultTimesFor(freq: Frequency): string[] {
  return DEFAULT_TIMES[freq] ?? [];
}

export function todaysDoses(med: Medication, day: Date): string[] {
  if (med.prn || med.frequency === "as_needed") return [];
  const times = med.times.length > 0 ? med.times : defaultTimesFor(med.frequency);
  if (med.frequency === "weekly") {
    const start = new Date(med.startDate);
    const diffDays = Math.floor(
      (day.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
    );
    return diffDays % 7 === 0 ? times : [];
  }
  return times;
}

export function doseKey(medId: string, day: Date, time: string): string {
  const ymd = day.toISOString().slice(0, 10);
  return `${medId}|${ymd}|${time}`;
}

export function parseTimeToToday(time: string): Date {
  const [h, m] = time.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}
