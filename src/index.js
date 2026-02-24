#!/usr/bin/env node
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

import { createSession, logHistory } from './session.js';
import { scanDirectory } from './scout/directory.js';
import { readKeyFiles } from './scout/files.js';
import { analyzeProject } from './scout/analyze.js';
import reenterSelect, { spin, green } from './prompt.js';
import { runInterview } from './briefing/interview.js';

// Always load .env from the Reenter project folder, regardless of where the user runs it from
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function main() {
  const projectPath = process.argv[2]
    ? path.resolve(process.argv[2])
    : process.cwd();

  // Initialize the session — the spine that holds everything
  const session = createSession({ projectPath, mode: 'run' });

  // Scout phase — understand the project
  const analysis = await spin('Reentering', 'Reentering', async () => {
    const structure = scanDirectory(projectPath).join('\n');

    if (!structure) {
      process.stdout.write('\r\x1b[2K\n');
      console.error('This folder looks empty. Point reenter at a project folder.');
      process.exit(1);
    }

    session.project.structure = structure;
    session.project.keyFiles = readKeyFiles(projectPath);

    return analyzeProject(session.project.structure, session.project.keyFiles);
  });

  session.project.summary = analysis.summary;
  session.plan.options = analysis.options;

  // Show summary
  process.stdout.write(`\n${session.project.summary}\n\n`);

  // Let user pick a path
  const selectedValue = await reenterSelect({
    message: "What's next:",
    choices: session.plan.options.map(opt => ({
      title: opt.title,
      value: opt.value,
      description: opt.description
    }))
  });

  // Lock in the chosen path
  session.plan.chosenOption = session.plan.options.find(o => o.value === selectedValue);
  session.plan.steps = session.plan.chosenOption.steps;
  logHistory(session, 'user', `Chose: ${session.plan.chosenOption.title}`);

  console.log();

  // Briefing phase — build the shared picture before step 1
  const confirmed = await runInterview(session);

  if (!confirmed) {
    console.log('\nNo problem. Come back when you\'re ready.\n');
    process.exit(0);
  }

  console.log();

  // Walkthrough phase — coming next
  console.log('\x1b[90mWalkthrough coming next.\x1b[0m\n');
}

main();
