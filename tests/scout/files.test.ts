import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { readKeyFiles } from '../../src/scout/files.js';

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
