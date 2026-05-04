import { generateText, type UserModelMessage } from "ai";
import { z } from "zod";
import { anthropicProvider, EXTRACTION_MODEL } from "@/lib/ai";

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

const SYSTEM = `You are a careful clinical document extractor. You convert after-visit summaries (AVS), discharge instructions, or medication lists into a strict JSON object.

Return ONLY a JSON object inside a single \`\`\`json fenced code block. No prose before or after.

Schema:
{
  "provider": { "name"?: string, "facility"?: string, "phone"?: string, "visitDate"?: string (ISO YYYY-MM-DD if possible) },
  "diagnosis"?: string,
  "medications": [{
    "name": string,
    "dose": string,
    "route"?: string,
    "frequency": one of [once_daily, twice_daily, three_times_daily, four_times_daily, every_4_hours, every_6_hours, every_8_hours, every_12_hours, as_needed, weekly, custom],
    "prn"?: boolean,
    "indication"?: string,
    "instructions"?: string,
    "times": string[] (HH:MM, 24h)
  }],
  "instructions": [{ "text": string, "category"?: one of [diet, activity, followup, warning, other] }],
  "rawNotes"?: string
}

Rules:
- Only include medications EXPLICITLY listed. Do not invent drugs.
- "Every 8 hours as needed for nausea" => frequency: "every_8_hours", prn: true, indication: "nausea".
- For times, leave [] if unclear.
- Parse non-medication discharge guidance (diet, activity, follow-up, warnings) as instruction items, one per logical line.
- Omit any field that is not present.`;

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

function extractJsonBlock(text: string): unknown {
  const fence = /```(?:json)?\s*([\s\S]*?)\s*```/i.exec(text);
  const candidate = fence ? fence[1] : text;
  return JSON.parse(candidate);
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

    const userParts: Exclude<UserModelMessage["content"], string> = [
      {
        type: "text",
        text:
          "Extract the medication regimen and discharge instructions from this after-visit summary. Return ONLY the JSON object as instructed.",
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
      userParts.push({ type: "text", text: `\nDocument text:\n${body.text}` });
    }

    const { text } = await generateText({
      model: anthropicProvider(EXTRACTION_MODEL),
      system: SYSTEM,
      messages: [{ role: "user", content: userParts }],
    });

    let parsed: unknown;
    try {
      parsed = extractJsonBlock(text);
    } catch (e) {
      console.error("Failed to parse extraction", e, text);
      return Response.json(
        { error: "Model returned non-JSON output", raw: text },
        { status: 502 },
      );
    }

    const validation = ExtractionSchema.safeParse(parsed);
    if (!validation.success) {
      return Response.json(
        {
          error: "Extraction failed schema validation",
          issues: validation.error.issues,
          raw: parsed,
        },
        { status: 502 },
      );
    }

    return Response.json(validation.data);
  } catch (err) {
    console.error("/api/extract failed", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}
