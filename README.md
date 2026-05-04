# Aftercare

AI Medication Compliance — mobile web app prototype.

**Mission:** Improve patient health outcomes by reinforcing medication compliance using AI-driven, behavioral-science-based interventions.

Patients scan their after-visit summary; AI extracts the medication regimen and discharge instructions; the app then drives adherence with reminders, streaks, and gamified nudges.

## Stack

- Next.js 16 (App Router) + Turbopack
- React 19
- Tailwind CSS v4
- AI SDK v6 via Vercel AI Gateway (vision OCR for paperwork)
- Deployed on Vercel

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

For AI extraction of after-visit summaries, set:

```
AI_GATEWAY_API_KEY=...
```

Configure in `vercel env` or a local `.env.local`.

## Deploy

This repo is deployable on Vercel out of the box — no `vercel.json` needed. Connect the repo at [vercel.com/new](https://vercel.com/new).
