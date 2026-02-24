// scout/analyze.ts — two focused AI calls, both using Haiku (fast, cheap).
//
// analyzeProject — reads the project and returns a plain english summary.
//   Called once, before the menu. No options, no steps — just: what is this?
//
// generateSteps — called after the user picks a mode.
//   Returns 2-5 high level steps specific to this project and chosen mode.
//   This is the GPS route for the chosen path.

import type Anthropic from '@anthropic-ai/sdk';
import { type Analysis, AnalysisSchema, StepsSchema } from '../types.js';

const MODEL = 'claude-haiku-4-5-20251001';

const MODE_INTENT: Record<string, string> = {
  run: 'run this project locally — the cheapest, fastest path to seeing it alive again. No production concerns, no polish. Just: what does it take to get this running on their machine?',
  browse:
    'understand this codebase — find the single conceptual path from A to Z that gives the clearest picture of how it works.',
  mvp: 'get this in front of real users — the fastest, cheapest path from local to something others can actually use.',
  ship: 'modernize, fix issues, and deploy this properly — clean it up and take it all the way.',
};

// ─── Summary ─────────────────────────────────────────────────────────────────

export async function analyzeProject(
  client: Anthropic,
  structure: string,
  keyFiles: string
): Promise<Analysis> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 256,
    system:
      'You are a JSON API. You only respond with raw JSON. No markdown, no explanation, no prose. Just JSON.',
    messages: [
      {
        role: 'user',
        content: `What is this project? Describe it in 1-2 plain english sentences. No jargon. What does it do, not how it's built.

FILE STRUCTURE:
${structure}

KEY FILE CONTENTS:
${keyFiles || 'No key files found.'}

Return raw JSON only:
{ "summary": "This looks like ..." }`,
      },
      {
        role: 'assistant',
        content: '{"summary": "This looks like',
      },
    ],
  });

  const block = response.content[0];
  if (!block || block.type !== 'text') throw new Error('Expected text response from AI');

  return AnalysisSchema.parse(JSON.parse(`{"summary": "This looks like${block.text}`));
}

// ─── Steps ────────────────────────────────────────────────────────────────────

export async function generateSteps(
  client: Anthropic,
  modeValue: string,
  structure: string,
  keyFiles: string
): Promise<string[]> {
  const intent = MODE_INTENT[modeValue];
  if (!intent) throw new Error(`Unknown mode: ${modeValue}`);

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    system:
      'You are a JSON API. You only respond with raw JSON. No markdown, no explanation, no prose. Just JSON.',
    messages: [
      {
        role: 'user',
        content: `A self-taught developer wants to ${intent}

FILE STRUCTURE:
${structure}

KEY FILE CONTENTS:
${keyFiles || 'No key files found.'}

What are the 2-5 high level steps to do this for this specific project?

Rules:
- Steps are high level only — no commands, no file names yet
- Plain english, no jargon
- Specific to this actual project — never generic
- 2 to 5 steps, never pad

Return raw JSON only:
{ "steps": ["Step one", "Step two", "..."] }`,
      },
      {
        role: 'assistant',
        content: '{',
      },
    ],
  });

  const block = response.content[0];
  if (!block || block.type !== 'text') throw new Error('Expected text response from AI');

  return StepsSchema.parse(JSON.parse(`{${block.text}`)).steps;
}
