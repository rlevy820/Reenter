import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { deepReadFiles, readKeyFiles } from '../../src/scout/files.js';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));

describe('readKeyFiles', () => {
  it('finds package.json in the Reenter project', () => {
    const result = readKeyFiles(ROOT);
    expect(result).toContain('--- package.json ---');
  });

  it('includes the file content after the header', () => {
    const result = readKeyFiles(ROOT);
    expect(result).toContain('"name": "reenter"');
  });

  it('returns empty string for a directory with no key files', () => {
    // /tmp exists but has no package.json, README.md, etc.
    const result = readKeyFiles('/tmp');
    expect(result).toBe('');
  });

  it('returns empty string for a nonexistent directory', () => {
    const result = readKeyFiles('/nonexistent/path/that/does/not/exist');
    expect(result).toBe('');
  });

  it('caps each file at 1000 chars', () => {
    const result = readKeyFiles(ROOT);
    // Split on file separators and check each section's content length
    const sections = result.split(/\n--- .+ ---\n/).slice(1);
    for (const section of sections) {
      const content = section.split('\n\n')[0];
      expect(content.length).toBeLessThanOrEqual(1000);
    }
  });

  it('separates multiple files with double newlines', () => {
    const result = readKeyFiles(ROOT);
    // If more than one key file was found, they're separated by \n\n
    const fileCount = (result.match(/^--- .+ ---$/gm) ?? []).length;
    if (fileCount > 1) {
      expect(result).toContain('\n\n');
    }
  });
});

// ─── deepReadFiles ────────────────────────────────────────────────────────────

let tmpDir: string;

beforeEach(() => {
  tmpDir = path.join(tmpdir(), `reenter-test-${Date.now()}`);
  mkdirSync(tmpDir, { recursive: true });
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

describe('deepReadFiles', () => {
  it('reads all text files in a project', () => {
    writeFileSync(path.join(tmpDir, 'index.js'), 'console.log("hello")');
    writeFileSync(path.join(tmpDir, 'README.md'), '# My Project');
    const result = deepReadFiles(tmpDir);
    expect(result).toContain('--- index.js ---');
    expect(result).toContain('--- README.md ---');
  });

  it('reads files in subdirectories', () => {
    mkdirSync(path.join(tmpDir, 'src'));
    writeFileSync(path.join(tmpDir, 'src', 'app.js'), 'export default {}');
    const result = deepReadFiles(tmpDir);
    expect(result).toContain('--- src/app.js ---');
  });

  it('skips node_modules', () => {
    mkdirSync(path.join(tmpDir, 'node_modules', 'lodash'), { recursive: true });
    writeFileSync(path.join(tmpDir, 'node_modules', 'lodash', 'index.js'), 'module.exports = {}');
    const result = deepReadFiles(tmpDir);
    expect(result).not.toContain('node_modules');
  });

  it('skips binary file extensions', () => {
    writeFileSync(path.join(tmpDir, 'logo.png'), 'fake binary');
    writeFileSync(path.join(tmpDir, 'app.js'), 'real code');
    const result = deepReadFiles(tmpDir);
    expect(result).not.toContain('logo.png');
    expect(result).toContain('app.js');
  });

  it('skips lock files', () => {
    writeFileSync(path.join(tmpDir, 'package-lock.json'), '{"lockfileVersion":3}');
    writeFileSync(path.join(tmpDir, 'package.json'), '{"name":"test"}');
    const result = deepReadFiles(tmpDir);
    expect(result).not.toContain('package-lock.json');
    expect(result).toContain('package.json');
  });

  it('includes .env.example but skips other hidden files', () => {
    writeFileSync(path.join(tmpDir, '.env.example'), 'API_KEY=');
    writeFileSync(path.join(tmpDir, '.DS_Store'), 'noise');
    const result = deepReadFiles(tmpDir);
    expect(result).toContain('.env.example');
    expect(result).not.toContain('.DS_Store');
  });

  it('caps each file at 3000 chars', () => {
    writeFileSync(path.join(tmpDir, 'big.js'), 'x'.repeat(5000));
    const result = deepReadFiles(tmpDir);
    const content = result.split('--- big.js ---\n')[1] ?? '';
    expect(content.length).toBeLessThanOrEqual(3000);
  });

  it('returns empty string for an empty directory', () => {
    expect(deepReadFiles(tmpDir)).toBe('');
  });
});
