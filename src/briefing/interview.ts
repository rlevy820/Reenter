// briefing/interview.ts — the moment before step 1.
//
// The AI has already read the project and generated the steps.
// This is where the user finds out what they're actually consenting to —
// in plain english, specific to their project, before anything runs.
//
// Flow:
//   1. Orientation — plain english: here's what step 1 means on your machine
//   2. Confirm — ready to start?

import type Anthropic from '@anthropic-ai/sdk';
import type { z } from 'zod';
import reenterSelect, { formatTextBlock, think } from '../prompt.js';
import { logHistory } from '../session.js';
import type { Session } from '../types.js';
import { OrientationSchema } from '../types.js';

const MODEL = 'claude-sonnet-4-6';

function parseJSON<T>(schema: z.ZodSchema<T>, text: string): T {
  const cleaned = text
    .replace(/^```(?:json)?\n?/, '')
    .replace(/\n?```$/, '')
    .trim();
  return schema.parse(JSON.parse(cleaned));
}

// ─── Generate orientation ─────────────────────────────────────────────────────

async function generateOrientation(client: Anthropic, session: Session): Promise<string> {
  const { summary, structure, keyFiles } = session.project;
  const { chosenMode, steps } = session.plan;

  if (!chosenMode) throw new Error('No mode chosen before briefing');

  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 128,
    system:
      'You are a JSON API. You only respond with raw JSON. No markdown, no explanation, no prose. Just JSON.',
    messages: [
      {
        role: 'user',
        content: `You are helping a self-taught developer re-engage with an old project. They just chose "${chosenMode.title}" and are about to start.

PROJECT SUMMARY: "${summary}"

FIRST STEP: "${steps[0]}"

FILE STRUCTURE:
${structure}

KEY FILES:
${keyFiles || 'None found.'}

Write one sentence that explains what the first step actually means — not the technical name for it, but what's about to happen on their machine and why. The user is consenting to this, so make sure they know what they're agreeing to without needing a CS degree.

Rules:
- Plain english only. No technical terms (no "dependencies", "npm", "environment", "install packages").
- Instead of technical terms, say what it does: "the pieces your app needs to run", "fire it up", "get it talking to your computer"
- Specific to this project — mention what kind of thing this is if it helps
- Warm and direct — like a senior dev explaining it to a friend
- One sentence

Return raw JSON only:
{ "orientation": "..." }`,
      },
    ],
  });

  return think(
    'figuring out where to start',
    stream,
    (text) => parseJSON(OrientationSchema, text).orientation
  );
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

export async function runInterview(client: Anthropic, session: Session): Promise<boolean> {
  const orientation = await generateOrientation(client, session);

  session.briefing.synthesis = orientation;
  logHistory(session, 'ai', orientation);

  process.stdout.write(formatTextBlock(orientation));

  const ready = await reenterSelect({
    message: 'Ready to start?',
    choices: [
      { title: "Yes, let's go", value: 'yes' },
      { title: 'Not right now', value: 'no' },
    ],
  });

  return ready === 'yes';
}
