// briefing/interview.js — builds the shared picture before step 1.
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

import Anthropic from '@anthropic-ai/sdk';
import ora from 'ora';
import reenterSelect, { reenterInput } from '../prompt.js';
import { logHistory } from '../session.js';

const MODEL = 'claude-sonnet-4-6';

// Sonnet sometimes wraps JSON in markdown fences despite being told not to.
function parseJSON(text) {
  return JSON.parse(text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim());
}

// Voice framing — a standard the model holds itself to, not a rules list.
const VOICE = `You are talking to a self-taught developer who builds things to learn. They understand what their project does but may not know every technical term for how it works. Before finalizing any sentence, ask yourself: would this person have written these words themselves? If there's a technical term they wouldn't use naturally, find the plain english version. Speak like a senior dev who teaches well — warm, direct, specific.`;

// ─── Generate presentation + Q1 ──────────────────────────────────────────────

async function generateBriefing(client, session) {
  const { summary, structure, keyFiles } = session.project;
  const { chosenOption } = session.plan;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    system: 'You are a JSON API. You only respond with raw JSON. No markdown, no explanation, no prose. Just JSON.',
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
- Do NOT include "Other" in options — it is added automatically`
      }
    ]
  });

  return parseJSON(response.content[0].text);
}

// ─── Generate synthesis ───────────────────────────────────────────────────────

async function generateSynthesis(client, session) {
  const { chosenOption } = session.plan;
  const { questions, answers } = session.briefing;
  const q1 = questions[0];

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 128,
    system: 'You are a JSON API. You only respond with raw JSON. No markdown, no explanation, no prose. Just JSON.',
    messages: [
      {
        role: 'user',
        content: `${VOICE}

One sentence. Acknowledge what they told you, then frame what step 1 is about. Don't re-summarize the project — they know what it is. Forward-facing, specific, warm.

WHAT THEY SAID: "${answers[q1.id]}"
STEP 1: "${chosenOption.steps[0]}"

Return raw JSON only:
{ "synthesis": "..." }`
      }
    ]
  });

  return parseJSON(response.content[0].text).synthesis;
}

// ─── Ask a question ───────────────────────────────────────────────────────────

async function askQuestion(question) {
  console.log();
  const choices = [
    ...question.options.map(opt => ({ title: opt, value: opt })),
    { title: 'Other', value: '__other__' }
  ];

  const selected = await reenterSelect({ message: question.text, choices });

  if (selected === '__other__') {
    return reenterInput({ message: 'Describe it:' });
  }

  return selected;
}

// ─── Orchestrator ─────────────────────────────────────────────────────────────

export async function runInterview(session) {
  // Client created here so dotenv has already loaded the API key by the time this runs
  const client = new Anthropic();

  // Generate presentation + Q1
  const spinner = ora({ text: 'Reading between the lines', color: 'cyan', spinner: 'dots' }).start();
  let briefing;
  try {
    briefing = await generateBriefing(client, session);
  } finally {
    spinner.stop();
  }

  session.briefing.presentation = briefing.presentation;
  session.briefing.questions.push(briefing.question);

  // Show what the agent found, then ask Q1
  console.log();
  console.log(briefing.presentation);

  const answer = await askQuestion(briefing.question);
  session.briefing.answers[briefing.question.id] = answer;
  logHistory(session, 'user', `${briefing.question.text} → ${answer}`);

  // Synthesize
  const synthSpinner = ora({ text: 'Putting it together', color: 'cyan', spinner: 'dots' }).start();
  let synthesis;
  try {
    synthesis = await generateSynthesis(client, session);
  } finally {
    synthSpinner.stop();
  }

  session.briefing.synthesis = synthesis;
  logHistory(session, 'ai', synthesis);

  console.log();
  console.log(synthesis);
  console.log();

  const ready = await reenterSelect({
    message: 'Ready to start?',
    choices: [
      { title: 'Yes, let\'s go', value: 'yes' },
      { title: 'Not right now', value: 'no' }
    ]
  });

  return ready === 'yes';
}
