import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import { MODES } from './options.js';
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

  // Scout phase — read the project and get a plain english summary
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

  // Show summary
  process.stdout.write(formatTextBlock(session.project.summary));

  // Fixed menu — always the same four options
  const selectedValue = await reenterSelect({
    message: 'What do you want to do with it:',
    choices: MODES.map((m) => ({
      title: m.title,
      value: m.value,
      description: m.description,
    })),
  });

  const chosenMode = MODES.find((m) => m.value === selectedValue);
  if (!chosenMode) throw new Error(`Unknown mode: ${selectedValue}`);

  session.plan.chosenMode = chosenMode;
  logHistory(session, 'user', `Chose: ${chosenMode.title}`);

  // Coming soon — only Run it is built
  if (selectedValue !== 'run') {
    process.stdout.write(formatTextBlock(`${chosenMode.title} is coming soon.`));
    process.exit(0);
  }

  session.meta.mode = 'run';

  // Walkthrough phase — coming next
  process.stdout.write(formatTextBlock('\x1b[90mWalkthrough coming next.\x1b[0m'));
}

main();
