import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { scanDirectory } from '../../src/scout/directory.js';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));

describe('scanDirectory', () => {
  it('returns files from a real directory', () => {
    const result = scanDirectory(path.join(ROOT, 'src'));
    expect(result.length).toBeGreaterThan(0);
  });

  it('includes known source files', () => {
    const result = scanDirectory(path.join(ROOT, 'src'));
    expect(result).toContain('index.ts');
    expect(result).toContain('session.ts');
    expect(result).toContain('prompt.ts');
    expect(result).toContain('types.ts');
  });

  it('skips node_modules', () => {
    const result = scanDirectory(ROOT);
    expect(result.every((f) => !f.includes('node_modules'))).toBe(true);
  });

  it('skips dist folder', () => {
    const result = scanDirectory(ROOT);
    expect(result.every((f) => !f.trimStart().startsWith('dist'))).toBe(true);
  });

  it('skips dotfiles and dotfolders', () => {
    const result = scanDirectory(ROOT);
    expect(result.every((f) => !f.trimStart().startsWith('.'))).toBe(true);
  });

  it('returns empty array when depth exceeds maxDepth', () => {
    const result = scanDirectory(ROOT, 3, 2);
    expect(result).toEqual([]);
  });

  it('returns empty array for a nonexistent path', () => {
    const result = scanDirectory('/nonexistent/path/that/does/not/exist');
    expect(result).toEqual([]);
  });

  it('indents subdirectory contents', () => {
    const result = scanDirectory(path.join(ROOT, 'src'));
    const scoutFiles = result.filter((f) => f.startsWith('  '));
    expect(scoutFiles.length).toBeGreaterThan(0);
  });
});
