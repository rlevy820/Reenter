// briefing/interview.ts — builds the shared picture before step 1.
//
// One question. That's all we need.
// The files tell us what it is. The user tells us where it was.
// The walkthrough handles everything else.
//
// Flow:
//   1. Presentation — what the files reveal that the summary didn't cover
//   2. Q1 — where did this get before you stopped?
//   3. Synthesis — one sentence: what they said + what step 1 is
//   4. Confirm

import type Anthropic from '@anthropic-ai/sdk';
import type { z } from 'zod';
import reenterSelect, { reenterInput, think } from '../prompt.js';
import { logHistory } from '../session.js';
import type { Question, Session } from '../types.js';
import { BriefingResponseSchema, SynthesisResponseSchema } from '../types.js';

const MODEL = 'claude-sonnet-4-6';

function parseJSON<T>(schema: z.ZodSchema<T>, text: string): T {
  const cleaned = text
    .replace(/^```(?:json)?\n?/, '')
    .replace(/\n?```$/, '')
    .trim();
  return schema.parse(JSON.parse(cleaned));
}

// Voice framing — a standard the model holds itself to, not a rules list.
const VOICE = `You are talking to a self-taught developer who builds things to learn. They understand what their project does but may not know every technical term for how it works. Before finalizing any sentence, ask yourself: would this person have written these words themselves? If there's a technical term they wouldn't use naturally, find the plain english version. Speak like a senior dev who teaches well — warm, direct, specific.`;

// ─── Generate presentation + Q1 ──────────────────────────────────────────────

async function generateBriefing(client: Anthropic, session: Session) {
  const { summary, structure, keyFiles } = session.project;
  const { chosenOption } = session.plan;

  if (!chosenOption) throw new Error('No option chosen before briefing');

  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 512,
    system:
      'You are a JSON API. You only respond with raw JSON. No markdown, no explanation, no prose. Just JSON.',
    messages: [
      {
        role: 'user',
        content: `${VOICE}

You are helping a self-taught developer re-engage with an old project.

They already saw this summary — do not repeat it:
"${summary}"

Their chosen path: "${chosenOption.title}" — ${chosenOption.description}

FILE STRUCTURE:
${structure}

KEY FILES:
${keyFiles || 'None found.'}

Write a short presentation that adds to what they already know — what the files reveal about the project's state and structure that the summary didn't cover. Start with "Looks like" or "It seems like" — warm, not clinical. 1-2 sentences max.

Then write one question: where did this project get before they stopped? Was it working? Partially done? Early stage? Write options that are specific to this actual project.

Return raw JSON only:
{
  "presentation": "Looks like / It seems like ... (1-2 sentences, adds new info, warm)",
  "question": {
    "id": "state",
    "text": "Short question, max 8 words",
    "type": "select",
    "options": ["Specific option A", "Specific option B", "Specific option C"]
  }
}

Rules:
- presentation: starts with "Looks like" or "It seems like", 1-2 sentences, no jargon, adds something new
- question text: max 8 words, direct
- options: specific to this project, concrete
- Do NOT include "Other" in options — it is added automatically`,
      },
    ],
  });

  return think('reading between the lines', stream, (text) =>
    parseJSON(BriefingResponseSchema, text)
  );
}

// ─── Generate synthesis ───────────────────────────────────────────────────────

async function generateSynthesis(client: Anthropic, session: Session): Promise<string> {
  const { chosenOption } = session.plan;
  const { questions, answers } = session.briefing;
  const q1 = questions[0];

  if (!chosenOption || !q1) throw new Error('Missing plan or question for synthesis');

  const stream = client.messages.stream({
    model: MODEL,
    max_tokens: 128,
    system:
      'You are a JSON API. You only respond with raw JSON. No markdown, no explanation, no prose. Just JSON.',
    messages: [
      {
        role: 'user',
        content: `${VOICE}

One sentence. Acknowledge what they told you, then frame what step 1 is about. Don't re-summarize the project — they know what it is. Forward-facing, specific, warm.

WHAT THEY SAID: "${answers[q1.id]}"
STEP 1: "${chosenOption.steps[0]}"

Return raw JSON only:
{ "synthesis": "..." }`,
      },
    ],
  });

  return think(
    'putting it together',
    stream,
    (text) => parseJSON(SynthesisResponseSchema, text).synthesis
  );
}

// ─── Ask a question ───────────────────────────────────────────────────────────

async function askQuestion(question: Question): Promise<string> {
  console.log();
  const choices = [
    ...question.options.map((opt) => ({ title: opt, value: opt })),
    { title: 'Other', value: '__other__' },
  ];

  const selected = await reenterSelect({ message: question.text, choices });

  if (selected === '__other__') {
    return reenterInput({ message: 'Describe it:' });
  }

  return selected;
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

export async function runInterview(client: Anthropic, session: Session): Promise<boolean> {
  // Presentation + Q1
  const briefing = await generateBriefing(client, session);

  session.briefing.presentation = briefing.presentation;
  session.briefing.questions.push(briefing.question);

  process.stdout.write(`\n${briefing.presentation}\n`);

  const answer = await askQuestion(briefing.question);
  session.briefing.answers[briefing.question.id] = answer;
  logHistory(session, 'user', `${briefing.question.text} → ${answer}`);

  process.stdout.write('\n');

  // Synthesis
  const synthesis = await generateSynthesis(client, session);

  session.briefing.synthesis = synthesis;
  logHistory(session, 'ai', synthesis);

  process.stdout.write(`\n${synthesis}\n\n`);

  const ready = await reenterSelect({
    message: 'Ready to start?',
    choices: [
      { title: "Yes, let's go", value: 'yes' },
      { title: 'Not right now', value: 'no' },
    ],
  });

  return ready === 'yes';
}
