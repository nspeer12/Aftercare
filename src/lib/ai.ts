import { createAnthropic } from "@ai-sdk/anthropic";

export const anthropicProvider = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? "",
  baseURL: "https://api.anthropic.com/v1",
});

export const EXTRACTION_MODEL = "claude-sonnet-4-6";
export const CHAT_MODEL = "claude-sonnet-4-6";
