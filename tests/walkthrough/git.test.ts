import { execSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { checkGitState } from '../../src/walkthrough/git.js';

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
});
