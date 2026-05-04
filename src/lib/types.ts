export type Frequency =
  | "once_daily"
  | "twice_daily"
  | "three_times_daily"
  | "four_times_daily"
  | "every_4_hours"
  | "every_6_hours"
  | "every_8_hours"
  | "every_12_hours"
  | "as_needed"
  | "weekly"
  | "custom";

export interface Medication {
  id: string;
  name: string;
  dose: string;
  route?: string;
  frequency: Frequency;
  prn?: boolean;
  instructions?: string;
  indication?: string;
  startDate: string;
  endDate?: string;
  times: string[];
}

export interface Instruction {
  id: string;
  text: string;
  category?: "diet" | "activity" | "followup" | "warning" | "other";
  done?: boolean;
}

export interface DoseLog {
  id: string;
  medicationId: string;
  scheduledFor: string;
  takenAt?: string;
  skipped?: boolean;
  note?: string;
}

export interface Provider {
  name?: string;
  facility?: string;
  phone?: string;
  visitDate?: string;
}

export interface CarePlan {
  id: string;
  createdAt: string;
  provider?: Provider;
  diagnosis?: string;
  medications: Medication[];
  instructions: Instruction[];
  rawNotes?: string;
}

export interface AftercareState {
  patientName?: string;
  carePlans: CarePlan[];
  doseLogs: DoseLog[];
  streakStartedAt?: string;
  lastDayCompleted?: string;
  pointsTotal: number;
  badges: string[];
}

export type ExtractedMedication = Omit<Medication, "id" | "startDate"> & {
  id?: string;
  startDate?: string;
};

export type ExtractedInstruction = Omit<Instruction, "id" | "done"> & {
  id?: string;
};

export interface ExtractionResult {
  provider?: Provider;
  diagnosis?: string;
  medications: ExtractedMedication[];
  instructions: ExtractedInstruction[];
  rawNotes?: string;
}
