import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 60;

const FrequencyEnum = z.enum([
  "once_daily",
  "twice_daily",
  "three_times_daily",
  "four_times_daily",
  "every_4_hours",
  "every_6_hours",
  "every_8_hours",
  "every_12_hours",
  "as_needed",
  "weekly",
  "custom",
]);

const ExtractionSchema = z.object({
  provider: z
    .object({
      name: z.string().optional(),
      facility: z.string().optional(),
      phone: z.string().optional(),
      visitDate: z.string().optional(),
    })
    .optional(),
  diagnosis: z.string().optional(),
  medications: z.array(
    z.object({
      name: z.string(),
      dose: z.string(),
      route: z.string().optional(),
      frequency: FrequencyEnum,
      prn: z.boolean().optional(),
      indication: z.string().optional(),
      instructions: z.string().optional(),
      times: z.array(z.string()).default([]),
    }),
  ),
  instructions: z.array(
    z.object({
      text: z.string(),
      category: z
        .enum(["diet", "activity", "followup", "warning", "other"])
        .optional(),
    }),
  ),
  rawNotes: z.string().optional(),
});

const SYSTEM = `You are a careful clinical document extractor. You convert after-visit summaries (AVS), discharge instructions, or medication lists into a strict JSON schema.

Rules:
- Only include medications explicitly listed in the document. Do not invent or infer drugs.
- Normalize frequencies into the enum. "Every 8 hours as needed" => frequency: "every_8_hours", prn: true.
- "times" should be 24h "HH:MM" strings reflecting recommended schedule. If unclear, leave it [] and trust the app to default it from frequency.
- Parse non-medication discharge guidance (diet, activity, follow-up, warning signs) as instruction items, one per logical line.
- Be conservative — if a field is not present, omit it.`;

interface Body {
  imageDataUrl?: string;
  pdfDataUrl?: string;
  text?: string;
}

function dataUrlToBuffer(dataUrl: string): { buffer: Buffer; mediaType: string } {
  const match = /^data:([^;]+);base64,(.*)$/.exec(dataUrl);
  if (!match) throw new Error("Invalid data URL");
  return { mediaType: match[1], buffer: Buffer.from(match[2], "base64") };
}

export async function POST(req: Request) {
  try {
    const body: Body = await req.json();

    if (!body.imageDataUrl && !body.pdfDataUrl && !body.text) {
      return Response.json(
        { error: "Provide imageDataUrl, pdfDataUrl, or text." },
        { status: 400 },
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json(
        {
          error:
            "Server is missing ANTHROPIC_API_KEY. Add it in Vercel project settings or .env.local.",
        },
        { status: 500 },
      );
    }

    const userParts: Array<
      | { type: "text"; text: string }
      | { type: "image"; image: string | Buffer }
      | { type: "file"; data: Buffer; mediaType: string }
    > = [
      {
        type: "text",
        text: "Extract the medication regimen and discharge instructions from this after-visit summary. Return only what is present in the document.",
      },
    ];

    if (body.imageDataUrl) {
      userParts.push({ type: "image", image: body.imageDataUrl });
    }
    if (body.pdfDataUrl) {
      const { buffer, mediaType } = dataUrlToBuffer(body.pdfDataUrl);
      userParts.push({ type: "file", data: buffer, mediaType });
    }
    if (body.text) {
      userParts.push({ type: "text", text: `\nAdditional text:\n${body.text}` });
    }

    const { object } = await generateObject({
      model: anthropic("claude-sonnet-4-6"),
      schema: ExtractionSchema,
      system: SYSTEM,
      messages: [{ role: "user", content: userParts }],
    });

    return Response.json(object);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
