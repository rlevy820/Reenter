#!/usr/bin/env node
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import ora from 'ora';

import { createSession, logHistory } from './session.js';
import { scanDirectory } from './scout/directory.js';
import { readKeyFiles } from './scout/files.js';
import { analyzeProject } from './scout/analyze.js';
import reenterSelect from './prompt.js';

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
  const spinner = ora({ text: 'Reentering', color: 'cyan', spinner: 'dots' }).start();

  try {
    session.project.structure = scanDirectory(projectPath).join('\n');

    if (!session.project.structure) {
      spinner.fail('This folder looks empty. Point reenter at a project folder.');
      process.exit(1);
    }

    session.project.keyFiles = readKeyFiles(projectPath);

    const analysis = await analyzeProject(
      session.project.structure,
      session.project.keyFiles
    );

    session.project.summary = analysis.summary;
    session.plan.options = analysis.options;

  } finally {
    spinner.stop();
  }

  // Show summary
  console.log(session.project.summary);
  console.log();

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

  // Briefing phase — coming next
  // Walkthrough phase — coming next
  console.log('\x1b[90mBriefing and walkthrough coming next.\x1b[0m\n');
}

main();
