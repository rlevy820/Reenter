#!/usr/bin/env node
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import Anthropic from '@anthropic-ai/sdk';
import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';

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
        const content = fs.readFileSync(filePath, 'utf8').slice(0, 1000); // cap at 1000 chars
        contents.push(`--- ${file} ---\n${content}`);
      } catch {
        // skip unreadable files
      }
    }
  }
  return contents.join('\n\n');
}

// Sends the project structure and key file contents to Claude Haiku.
// Haiku is used here because this is a simple read task — fast and cheap.
// Returns a plain english summary and three specific run options.
async function analyzeProject(projectPath, structure) {
  const keyFiles = readKeyFiles(projectPath);

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: 'You are a JSON API. You only respond with raw JSON. No markdown, no explanation, no prose. Just JSON.',
    messages: [
      {
        role: 'user',
        content: `A self-taught developer wants to re-engage with an old project they built and forgot about. Your job is to figure out what this project actually is, and what realistic paths exist for running or exploring it right now.

FILE STRUCTURE:
${structure}

KEY FILE CONTENTS:
${keyFiles || 'No key files found.'}

Think through this carefully:
- What type of project is this? (web app, mobile app, data analysis, hardware, game, etc.)
- What does it actually require to run? (a browser, a database, special hardware, an API key, a server, etc.)
- What are the honest, realistic paths available to this person right now?
- Are any paths blocked without special setup, hardware, or credentials?

Return 1 to 3 options — only the ones that are genuinely available. Never pad with fake options. Be honest if something is blocked.

Return this exact JSON shape — no markdown, just raw JSON:
{
  "summary": "1-2 sentences in plain english. No jargon. No tech terms. What is this and what does it do?",
  "options": [
    { "name": "specific plain english description of this option and exactly what will happen", "value": "option_1" },
    { "name": "specific plain english description of this option and exactly what will happen", "value": "option_2" }
  ]
}

Options should have between 1 and 3 items. Each name should be specific to this project — never generic.`
      },
      {
        role: 'assistant',
        content: '{'
      }
    ]
  });

  // The assistant was pre-filled with '{' so we prepend it back before parsing
  const text = '{' + response.content[0].text;
  return JSON.parse(text);
}

async function main() {
  const projectPath = process.argv[2]
    ? path.resolve(process.argv[2])
    : process.cwd();

  console.log('\nScanning project...\n');

  const structure = scanDirectory(projectPath).join('\n');

  if (!structure) {
    console.log("This folder looks empty. Point reenter at a project folder.");
    process.exit(1);
  }

  const analysis = await analyzeProject(projectPath, structure);

  console.log(analysis.summary);
  console.log();

  const { action } = await inquirer.prompt([{
    type: 'list',
    name: 'action',
    message: 'What do you want to do with it?',
    choices: analysis.options
  }]);

  console.log('\n→ Got it. Working on that next.\n');
  // Next: branch based on action value and walk through steps
}

main();
