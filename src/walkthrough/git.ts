// walkthrough/git.ts — first thing that runs when a mode is chosen.
//
// Before Reenter touches anything, it saves where the user is.
// Three cases, one experience: "Saving your starting point"
//
//   no git     → git init + commit everything
//   loose ends → commit everything as-is
//   clean      → empty commit (still marks the restore point)

import { execSync } from 'node:child_process';
import { existsSync, realpathSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spin } from '../prompt.js';

const COMMIT_BASE = 'saving starting point before reenter';

export function nextCommitMessage(projectPath: string): string {
  try {
    const log = exec('git log --all --format=%s', projectPath);
    const count = (log.match(/saving starting point before reenter \[\d+\]/g) ?? []).length;
    return `${COMMIT_BASE} [${String(count).padStart(2, '0')}]`;
  } catch {
    return `${COMMIT_BASE} [00]`;
  }
}

function exec(command: string, cwd: string): string {
  return execSync(command, { cwd, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
}

export function checkGitState(projectPath: string): 'no-git' | 'loose-ends' | 'clean' {
  try {
    const repoRoot = exec('git rev-parse --show-toplevel', projectPath).trim();
    if (realpathSync.native(repoRoot) !== realpathSync.native(path.resolve(projectPath))) {
      // git exists but it belongs to a parent directory — treat as no-git for this project
      return 'no-git';
    }
  } catch {
    return 'no-git';
  }
  const status = exec('git status --porcelain', projectPath);
  return status.trim().length > 0 ? 'loose-ends' : 'clean';
}

function ensureGitignore(projectPath: string): void {
  const gitignorePath = path.join(projectPath, '.gitignore');
  if (!existsSync(gitignorePath)) {
    writeFileSync(gitignorePath, 'node_modules\ndist\n.env\n');
  }
}

export async function saveStartingPoint(projectPath: string): Promise<void> {
  let debugInfo = '';

  process.stdout.write('\n');
  await spin('Saving your starting point', 'Starting point saved', async () => {
    const state = checkGitState(projectPath);

    const message = nextCommitMessage(projectPath);

    if (state === 'no-git') {
      ensureGitignore(projectPath);
      exec('git init', projectPath);
      exec('git add .', projectPath);
      exec(`git commit -m "${message}"`, projectPath);
      debugInfo = `no git found — initialized repo, committed everything (${message})`;
    } else if (state === 'loose-ends') {
      exec('git add .', projectPath);
      exec(`git commit -m "${message}"`, projectPath);
      debugInfo = `git found — committed loose ends (${message})`;
    } else {
      exec(`git commit --allow-empty -m "${message}"`, projectPath);
      debugInfo = `git found, already clean — created empty restore point (${message})`;
    }
  });

  // TODO: remove before ship
  process.stdout.write(`  \x1b[90m[debug] ${debugInfo}\x1b[0m\n`);
}
