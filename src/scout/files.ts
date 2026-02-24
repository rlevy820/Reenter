// scout/files.ts — reads the key files that reveal what a project is.
// Looks for known entry points like package.json, README, requirements.txt etc.
// Caps each file at 1000 chars — enough context, not overwhelming.

import fs from 'node:fs';
import path from 'node:path';

const KEY_FILES = [
  'package.json',
  'README.md',
  'requirements.txt',
  'Makefile',
  'docker-compose.yml',
  'Cargo.toml',
  'go.mod',
  'pom.xml',
  '.env.example',
] as const;

export function readKeyFiles(dirPath: string): string {
  const contents: string[] = [];

  for (const file of KEY_FILES) {
    const filePath = path.join(dirPath, file);
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8').slice(0, 1000);
        contents.push(`--- ${file} ---\n${content}`);
      } catch {
        // skip unreadable files
      }
    }
  }

  return contents.join('\n\n');
}
