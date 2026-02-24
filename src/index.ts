import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import { runInterview } from './briefing/interview.js';
import reenterSelect, { formatTextBlock, spin, withMargin } from './prompt.js';
import { analyzeProject } from './scout/analyze.js';
import { scanDirectory } from './scout/directory.js';
import { readKeyFiles } from './scout/files.js';
import { createSession, logHistory } from './session.js';

// Always load .env from the Reenter project folder, regardless of where the user runs it from
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

async function main() {
  const projectPath = process.argv[2] ? path.resolve(process.argv[2]) : process.cwd();

  // Single client — created once, passed to everything that needs it
  const client = new Anthropic();

  // Initialize the session — the spine that holds everything
  const session = createSession({ projectPath, mode: 'run' });

  // Scout phase — understand the project
  const analysis = await spin('Reentering', 'Reentering', async () => {
    const structure = scanDirectory(projectPath).join('\n');

    if (!structure) {
      process.stdout.write('\r\x1b[2K\n');
      process.stdout.write(
        withMargin('This folder looks empty. Point reenter at a project folder.\n')
      );
      process.exit(1);
    }

    session.project.structure = structure;
    session.project.keyFiles = readKeyFiles(projectPath);

    return analyzeProject(client, structure, session.project.keyFiles);
  });

  session.project.summary = analysis.summary;
  session.plan.options = analysis.options;

  // Show summary
  process.stdout.write(formatTextBlock(session.project.summary));

  // Let user pick a path
  const selectedValue = await reenterSelect({
    message: "What's next:",
    choices: session.plan.options.map((opt) => ({
      title: opt.title,
      value: opt.value,
      description: opt.description,
    })),
  });

  // Lock in the chosen path
  const chosen = session.plan.options.find((o) => o.value === selectedValue);
  if (!chosen) throw new Error(`Unknown option: ${selectedValue}`);
  session.plan.chosenOption = chosen;
  session.plan.steps = chosen.steps;
  logHistory(session, 'user', `Chose: ${chosen.title}`);

  process.stdout.write('\n');

  // Briefing phase — build the shared picture before step 1
  const confirmed = await runInterview(client, session);

  if (!confirmed) {
    process.stdout.write(formatTextBlock("No problem. Come back when you're ready."));
    process.exit(0);
  }

  // Walkthrough phase — coming next
  process.stdout.write(formatTextBlock('\x1b[90mWalkthrough coming next.\x1b[0m'));
}

main();
