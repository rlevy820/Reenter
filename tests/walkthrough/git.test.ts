import { execSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { checkGitState, nextCommitMessage } from '../../src/walkthrough/git.js';

function exec(command: string, cwd: string): string {
  return execSync(command, { cwd, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
}

function initGit(dir: string): void {
  exec('git init', dir);
  exec('git config user.email "test@test.com"', dir);
  exec('git config user.name "Test"', dir);
  exec('git commit --allow-empty -m "initial"', dir);
}

let tmpDir: string;

beforeEach(() => {
  tmpDir = path.join(tmpdir(), `reenter-test-${Date.now()}`);
  mkdirSync(tmpDir, { recursive: true });
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe('checkGitState', () => {
  it('returns no-git when there is no git repository', () => {
    expect(checkGitState(tmpDir)).toBe('no-git');
  });

  it('returns clean when git exists and nothing to commit', () => {
    initGit(tmpDir);
    expect(checkGitState(tmpDir)).toBe('clean');
  });

  it('returns loose-ends when there are uncommitted changes', () => {
    initGit(tmpDir);
    writeFileSync(path.join(tmpDir, 'file.txt'), 'hello');
    exec('git add .', tmpDir);
    expect(checkGitState(tmpDir)).toBe('loose-ends');
  });

  it('returns loose-ends when there are untracked files', () => {
    initGit(tmpDir);
    writeFileSync(path.join(tmpDir, 'untracked.txt'), 'content');
    expect(checkGitState(tmpDir)).toBe('loose-ends');
  });

  it('returns no-git when the project lives inside a parent git repo', () => {
    // init git at the parent level, not the project level
    initGit(tmpDir);
    const projectDir = path.join(tmpDir, 'my-project');
    mkdirSync(projectDir);
    expect(checkGitState(projectDir)).toBe('no-git');
  });
});

describe('nextCommitMessage', () => {
  it('returns [00] on first run', () => {
    initGit(tmpDir);
    expect(nextCommitMessage(tmpDir)).toBe('saving starting point before reenter [00]');
  });

  it('returns [01] after one previous reenter commit', () => {
    initGit(tmpDir);
    exec('git commit --allow-empty -m "saving starting point before reenter [00]"', tmpDir);
    expect(nextCommitMessage(tmpDir)).toBe('saving starting point before reenter [01]');
  });

  it('returns [02] after two previous reenter commits', () => {
    initGit(tmpDir);
    exec('git commit --allow-empty -m "saving starting point before reenter [00]"', tmpDir);
    exec('git commit --allow-empty -m "saving starting point before reenter [01]"', tmpDir);
    expect(nextCommitMessage(tmpDir)).toBe('saving starting point before reenter [02]');
  });

  it('ignores non-reenter commits when counting', () => {
    initGit(tmpDir);
    exec('git commit --allow-empty -m "some other commit"', tmpDir);
    expect(nextCommitMessage(tmpDir)).toBe('saving starting point before reenter [00]');
  });
});
