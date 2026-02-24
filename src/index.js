#!/usr/bin/env node
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';
import reenterSelect from './prompt.js';
import ora from 'ora';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

// Always load .env from the Reenter project folder, regardless of where the user runs it from
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const client = new Anthropic();

// Reads the project folder structure up to 2 levels deep.
// Skips noise like node_modules, hidden files, and build folders.
function scanDirectory(dirPath, depth = 0, maxDepth = 2) {
  if (depth > maxDepth) return [];
  const items = [];
  const skip = new Set(['node_modules', '__pycache__', '.git', 'dist', 'build', '.next']);

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') || skip.has(entry.name)) continue;
      const indent = '  '.repeat(depth);
      if (entry.isDirectory()) {
        items.push(`${indent}${entry.name}/`);
        items.push(...scanDirectory(path.join(dirPath, entry.name), depth + 1, maxDepth));
      } else {
        items.push(`${indent}${entry.name}`);
      }
    }
  } catch {
    // skip folders we can't read
  }
  return items;
}

// Reads key files that give the most context about what a project is.
function readKeyFiles(dirPath) {
  const keyFiles = ['package.json', 'README.md', 'requirements.txt', 'Makefile', 'docker-compose.yml'];
  const contents = [];

  for (const file of keyFiles) {
    const filePath = path.join(dirPath, file);
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8').slice(0, 1000);
        contents.push(`--- ${file} ---\n${content}`);
      } catch {
        // skip unreadable files
      }
    }
  }
  return contents.join('\n\n');
}

// Phase 1 — Haiku reads the project and builds the full high level map.
// Returns summary, options, and the step list for each option.
// This is the GPS route before driving — all turns visible, no detail yet.
async function analyzeProject(projectPath, structure) {
  const keyFiles = readKeyFiles(projectPath);

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    system: 'You are a JSON API. You only respond with raw JSON. No markdown, no explanation, no prose. Just JSON.',
    messages: [
      {
        role: 'user',
        content: `A self-taught developer wants to re-engage with an old project they built and forgot about. Your job is to figure out what this project is, what realistic paths exist for running or exploring it, and map out the high level steps for each path end to end.

FILE STRUCTURE:
${structure}

KEY FILE CONTENTS:
${keyFiles || 'No key files found.'}

Think through:
- What type of project is this?
- What does it actually need to run?
- What are the honest, realistic paths available right now?
- For each path, what are the 2-5 high level steps to get there?

Return this exact JSON shape — raw JSON only:
{
  "summary": "1-2 sentences in plain english. No jargon. What is this and what does it do?",
  "options": [
    {
      "title": "1-2 word label",
      "description": "one short phrase, specific to this project",
      "value": "option_1",
      "steps": [
        "High level step 1 — plain english, no jargon",
        "High level step 2 — plain english, no jargon"
      ]
    }
  ]
}

Rules:
- Order options from least effort at top to most effort at bottom
- title: 1-2 words max (e.g. "Browse", "Run it", "Ship it")
- description: one short phrase, no tech names, say how long if setup needed
- steps: 2 to 5 steps per option, high level only, plain english, no commands yet
- Never use technology names anywhere (no PHP, MySQL, Node, Python, React, etc.)
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

// Phase 2 — Sonnet zooms into one step at a time.
// Gets the full project context + where we are + the current step.
// Returns exactly what to do right now in plain english.
async function executeStep(projectPath, structure, keyFiles, chosenOption, steps, currentStepIndex) {
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: 'You are a patient, plain-spoken senior developer helping a self-taught builder re-engage with an old project. You speak in plain english, never use jargon without explaining it, and give one clear instruction at a time.',
    messages: [
      {
        role: 'user',
        content: `The developer has chosen to: ${chosenOption.title}

The full plan has these steps:
${steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}

They are now on step ${currentStepIndex + 1}: "${steps[currentStepIndex]}"

PROJECT STRUCTURE:
${structure}

KEY FILES:
${keyFiles}

Give them the specific instructions for this step only. Be concrete — if a command needs to be run, give the exact command. If something needs to be checked, say exactly what to look for. Keep it short. End by asking them to let you know when it's done or if something went wrong.`
      }
    ]
  });

  return response.content[0].text;
}

// Simple prompt that waits for the user to type something and hit enter.
function waitForInput(prompt) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  const projectPath = process.argv[2]
    ? path.resolve(process.argv[2])
    : process.cwd();

  const spinner = ora({
    text: 'Reentering',
    color: 'cyan',
    spinner: 'dots'
  }).start();

  let analysis;
  let structure;
  let keyFiles;

  try {
    structure = scanDirectory(projectPath).join('\n');

    if (!structure) {
      spinner.fail('This folder looks empty. Point reenter at a project folder.');
      process.exit(1);
    }

    keyFiles = readKeyFiles(projectPath);
    analysis = await analyzeProject(projectPath, structure);
  } finally {
    spinner.stop();
  }

  console.log(analysis.summary);
  console.log();

  const selectedValue = await reenterSelect({
    message: "What's next:",
    choices: analysis.options.map(opt => ({
      title: opt.title,
      value: opt.value,
      description: opt.description
    }))
  });

  const chosenOption = analysis.options.find(o => o.value === selectedValue);
  const steps = chosenOption.steps;

  console.log();

  // Step-by-step execution loop — one step at a time, human in the loop
  for (let i = 0; i < steps.length; i++) {
    const stepSpinner = ora({
      text: `Step ${i + 1} of ${steps.length}`,
      color: 'cyan',
      spinner: 'dots'
    }).start();

    const instruction = await executeStep(
      projectPath, structure, keyFiles, chosenOption, steps, i
    );

    stepSpinner.stop();

    console.log(`\n\x1b[1mStep ${i + 1} of ${steps.length}\x1b[0m`);
    console.log(instruction);
    console.log();

    const response = await waitForInput('\x1b[90mDone, or did something go wrong? \x1b[0m');

    // If they say something went wrong, acknowledge and let them describe it
    // For now just continue — error handling comes next
    console.log();
  }

  console.log('\x1b[36m✓ Done.\x1b[0m\n');
}

main();
