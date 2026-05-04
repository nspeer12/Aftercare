import type { ExtractionResult } from "./types";

export const SAMPLE_EXTRACTION: ExtractionResult = {
  provider: {
    name: "Jennifer Gilmer, ARNP",
    facility: "MultiCare Indigo Urgent Care",
    phone: "253-403-2130",
    visitDate: "2026-05-01",
  },
  diagnosis: "Viral illness with nausea, vomiting, and dehydration",
  medications: [
    {
      name: "Ondansetron (Zofran)",
      dose: "4 mg",
      route: "PO",
      frequency: "every_8_hours",
      prn: true,
      indication: "nausea and vomiting",
      instructions: "Use as prescribed every 8 hours as needed for nausea/vomiting.",
      times: [],
    },
  ],
  instructions: [
    {
      text: "Increase your fluid intake — Pedialyte, Gatorade, or liquid IV for electrolyte support.",
      category: "diet",
    },
    {
      text: "Start with a bland diet (BRAT: bananas, rice, applesauce, toast) and increase as tolerated.",
      category: "diet",
    },
    {
      text: "Return to the clinic or call 253-403-2130 if symptoms worsen or persist past 72 hours.",
      category: "warning",
    },
    {
      text: "Watch for signs of dehydration — dark urine, dizziness, decreased urination.",
      category: "warning",
    },
  ],
  rawNotes: "Sample care plan based on Indigo Urgent Care after-visit summary.",
};

export interface ExtractionLike {
  provider?: ExtractionResult["provider"];
  diagnosis?: ExtractionResult["diagnosis"];
  medications: ExtractionResult["medications"];
  instructions: ExtractionResult["instructions"];
}
