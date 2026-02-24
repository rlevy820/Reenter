// scout/analyze.js — sends project context to Claude Haiku and gets back the full map.
// Haiku is used here because this is a read and classify task — fast and cheap.
// Returns: plain english summary, derived options, and high level steps for each option.
// This is the GPS route — the whole journey visible before a single step is taken.

import Anthropic from '@anthropic-ai/sdk';

export async function analyzeProject(structure, keyFiles) {
  // Client created here so dotenv has already loaded the API key by the time this runs
  const client = new Anthropic();
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    system: 'You are a JSON API. You only respond with raw JSON. No markdown, no explanation, no prose. Just JSON.',
    messages: [
      {
        role: 'user',
        content: `A self-taught developer wants to re-engage with an old project they built and forgot about. Your job is to figure out what this project is, what realistic paths exist, and map out the high level steps for each path end to end.

FILE STRUCTURE:
${structure}

KEY FILE CONTENTS:
${keyFiles || 'No key files found.'}

Think through:
- What type of project is this?
- What does it actually need to run?
- What are the honest, realistic paths available right now?
- For each path, what are the 2-5 high level steps to complete it?

Return this exact JSON shape — raw JSON only:
{
  "summary": "1-2 sentences in plain english. No jargon. What is this and what does it do?",
  "options": [
    {
      "title": "1-2 word label",
      "description": "one short phrase, specific to this project",
      "value": "option_1",
      "steps": [
        "High level step — plain english, no jargon, no commands",
        "High level step — plain english, no jargon, no commands"
      ]
    }
  ]
}

Rules:
- Order options from least effort at top to most effort at bottom
- title: 1-2 words max (e.g. "Browse", "Run it", "Ship it")
- description: one short phrase, no tech names, say how long if setup needed
- steps: 2 to 5 per option, high level only — no commands, no file names yet
- Never use technology names (no PHP, MySQL, Node, Python, React, server, database)
- Instead of "server" say "something that hosts your pages locally"
- Instead of "database" say "a place that stores your data"
- 1 to 3 options only — never pad`
      },
      {
        role: 'assistant',
        content: '{'
      }
    ]
  });

  const text = '{' + response.content[0].text;
  return JSON.parse(text);
}
