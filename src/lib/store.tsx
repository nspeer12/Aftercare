"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AftercareState, CarePlan, DoseLog, ExtractionResult } from "./types";
import { doseKey, todaysDoses } from "./schedule";

const STORAGE_KEY = "aftercare:state:v1";

const EMPTY_STATE: AftercareState = {
  carePlans: [],
  doseLogs: [],
  pointsTotal: 0,
  badges: [],
};

interface StoreContextValue {
  state: AftercareState;
  hydrated: boolean;
  addCarePlanFromExtraction: (extraction: ExtractionResult) => CarePlan;
  removeCarePlan: (planId: string) => void;
  setPatientName: (name: string) => void;
  logDose: (
    medicationId: string,
    scheduledFor: string,
    action: "taken" | "skipped",
  ) => void;
  reset: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AftercareState>(EMPTY_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setState({ ...EMPTY_STATE, ...JSON.parse(raw) });
      }
    } catch {
      /* noop */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* noop */
    }
  }, [state, hydrated]);

  const addCarePlanFromExtraction = useCallback(
    (extraction: ExtractionResult): CarePlan => {
      const now = new Date().toISOString();
      const plan: CarePlan = {
        id: uid(),
        createdAt: now,
        provider: extraction.provider,
        diagnosis: extraction.diagnosis,
        medications: (extraction.medications ?? []).map((m) => ({
          ...m,
          id: m.id ?? uid(),
          startDate: m.startDate ?? now,
          times: m.times ?? [],
        })),
        instructions: (extraction.instructions ?? []).map((i) => ({
          ...i,
          id: i.id ?? uid(),
          done: false,
        })),
        rawNotes: extraction.rawNotes,
      };
      setState((s) => ({ ...s, carePlans: [plan, ...s.carePlans] }));
      return plan;
    },
    [],
  );

  const removeCarePlan = useCallback((planId: string) => {
    setState((s) => ({
      ...s,
      carePlans: s.carePlans.filter((p) => p.id !== planId),
    }));
  }, []);

  const setPatientName = useCallback((name: string) => {
    setState((s) => ({ ...s, patientName: name }));
  }, []);

  const logDose = useCallback(
    (medicationId: string, scheduledFor: string, action: "taken" | "skipped") => {
      setState((s) => {
        const filtered = s.doseLogs.filter(
          (l) => !(l.medicationId === medicationId && l.scheduledFor === scheduledFor),
        );
        const log: DoseLog = {
          id: uid(),
          medicationId,
          scheduledFor,
          takenAt: action === "taken" ? new Date().toISOString() : undefined,
          skipped: action === "skipped",
        };
        const pointsDelta = action === "taken" ? 10 : 0;
        return {
          ...s,
          doseLogs: [...filtered, log],
          pointsTotal: s.pointsTotal + pointsDelta,
        };
      });
    },
    [],
  );

  const reset = useCallback(() => {
    setState(EMPTY_STATE);
  }, []);

  const value = useMemo<StoreContextValue>(
    () => ({
      state,
      hydrated,
      addCarePlanFromExtraction,
      removeCarePlan,
      setPatientName,
      logDose,
      reset,
    }),
    [
      state,
      hydrated,
      addCarePlanFromExtraction,
      removeCarePlan,
      setPatientName,
      logDose,
      reset,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

export interface DueDose {
  medicationId: string;
  medicationName: string;
  dose: string;
  scheduledFor: string;
  scheduledTime: string;
  status: "taken" | "skipped" | "pending";
  instructions?: string;
}

export function useDueDosesForToday(): DueDose[] {
  const { state } = useStore();
  return useMemo(() => {
    const today = new Date();
    const meds = state.carePlans.flatMap((p) => p.medications);
    const out: DueDose[] = [];
    for (const med of meds) {
      const times = todaysDoses(med, today);
      for (const t of times) {
        const key = doseKey(med.id, today, t);
        const log = state.doseLogs.find(
          (l) => l.medicationId === med.id && l.scheduledFor === key,
        );
        out.push({
          medicationId: med.id,
          medicationName: med.name,
          dose: med.dose,
          scheduledFor: key,
          scheduledTime: t,
          instructions: med.instructions,
          status: log?.takenAt ? "taken" : log?.skipped ? "skipped" : "pending",
        });
      }
    }
    return out.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
  }, [state]);
}

export function useStreak(): { current: number; bestStreak: number } {
  const { state } = useStore();
  return useMemo(() => {
    const days = new Set(
      state.doseLogs.filter((l) => l.takenAt).map((l) => l.scheduledFor.split("|")[1]),
    );
    let current = 0;
    const cursor = new Date();
    while (true) {
      const ymd = cursor.toISOString().slice(0, 10);
      if (days.has(ymd)) {
        current += 1;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }
    return { current, bestStreak: Math.max(current, days.size) };
  }, [state]);
}
