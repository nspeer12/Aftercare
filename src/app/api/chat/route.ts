import { streamText, type ModelMessage } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import type { CarePlan } from "@/lib/types";
import { FREQUENCY_LABEL } from "@/lib/schedule";

export const runtime = "nodejs";
export const maxDuration = 60;

interface ChatBody {
  carePlan: CarePlan | null;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
}

function planToContext(plan: CarePlan | null): string {
  if (!plan) return "The patient has not yet uploaded a care plan.";
  const meds = plan.medications
    .map(
      (m, i) =>
        `${i + 1}. ${m.name} ${m.dose}${m.route ? ` (${m.route})` : ""} — ${
          FREQUENCY_LABEL[m.frequency]
        }${m.prn ? " PRN" : ""}${m.indication ? ` for ${m.indication}` : ""}${
          m.instructions ? `. Notes: ${m.instructions}` : ""
        }`,
    )
    .join("\n");
  const inst = plan.instructions
    .map((i, idx) => `${idx + 1}. ${i.text}${i.category ? ` [${i.category}]` : ""}`)
    .join("\n");
  return [
    plan.diagnosis ? `Diagnosis: ${plan.diagnosis}` : "",
    plan.provider?.facility ? `Visit: ${plan.provider.facility}` : "",
    plan.provider?.visitDate ? `Visit date: ${plan.provider.visitDate}` : "",
    "",
    "MEDICATIONS:",
    meds || "(none)",
    "",
    "DISCHARGE INSTRUCTIONS:",
    inst || "(none)",
  ]
    .filter(Boolean)
    .join("\n");
}

const SYSTEM_TEMPLATE = (planContext: string) => `You are Aftercare, an AI assistant that helps patients follow their post-visit care plan.

Your job is to:
- Reinforce what the clinician already prescribed (timing, dose, technique, lifestyle).
- Explain things in simple, friendly language at a 6th-grade reading level.
- Use behavioral nudges: tie-in to small wins, streaks, and concrete next actions.
- Cite the patient's own care plan whenever possible.

Hard rules:
- NEVER prescribe new medications, change doses, or contradict the care plan.
- For symptoms that sound urgent (chest pain, shortness of breath, severe bleeding, suicidal thoughts, signs of stroke, anaphylaxis) ALWAYS tell the user to call 911 or their provider immediately.
- If the question is outside what you can answer from the care plan, say so and recommend contacting the prescribing provider.
- Keep responses short — 2 to 4 short paragraphs max, with bullets when listing.

PATIENT CARE PLAN:
${planContext}`;

export async function POST(req: Request) {
  try {
    const { carePlan, messages }: ChatBody = await req.json();
    const system = SYSTEM_TEMPLATE(planToContext(carePlan));

    const result = streamText({
      model: anthropic("claude-sonnet-4-6"),
      system,
      messages: messages.map<ModelMessage>((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    return result.toTextStreamResponse();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(message, { status: 500 });
  }
}
