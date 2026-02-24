// scout/files.ts — two file reading strategies.
//
// readKeyFiles — quick scan, hardcoded list, used for the initial summary.
//   Looks for known entry points (package.json, README, etc.) at root only.
//
// deepReadFiles — full scan, used for the assessment loop.
//   Walks the entire project, reads every text file it can find.
//   Skips generated dirs, binaries, and lock files.
//   The AI gets everything and decides what matters.

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

// ─── Deep scan ────────────────────────────────────────────────────────────────

const SKIP_DIRS = new Set([
  'node_modules',
  '__pycache__',
  '.git',
  'dist',
  'build',
  '.next',
  '.nuxt',
  '.svelte-kit',
  'vendor',
  '.venv',
  'venv',
  'env',
  'coverage',
  '.cache',
  '.nyc_output',
  'tmp',
  'temp',
  '.turbo',
]);

const BINARY_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.ico',
  '.bmp',
  '.webp',
  '.svg',
  '.pdf',
  '.ttf',
  '.woff',
  '.woff2',
  '.eot',
  '.mp3',
  '.mp4',
  '.mov',
  '.avi',
  '.wav',
  '.zip',
  '.tar',
  '.gz',
  '.rar',
  '.7z',
  '.exe',
  '.bin',
  '.so',
  '.dylib',
  '.dll',
  '.map',
  '.pyc',
]);

const SKIP_FILES = new Set([
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'Pipfile.lock',
  'poetry.lock',
  'Gemfile.lock',
  'Cargo.lock',
]);

const INCLUDE_HIDDEN = new Set([
  '.env.example',
  '.nvmrc',
  '.python-version',
  '.ruby-version',
  '.node-version',
  '.tool-versions',
]);

const MAX_FILE_CHARS = 3000;
const MAX_TOTAL_CHARS = 100_000;

function collectFiles(dirPath: string, result: string[]): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
      collectFiles(path.join(dirPath, entry.name), result);
    } else {
      if (entry.name.startsWith('.') && !INCLUDE_HIDDEN.has(entry.name)) continue;
      if (SKIP_FILES.has(entry.name)) continue;
      if (BINARY_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) continue;
      result.push(path.join(dirPath, entry.name));
    }
  }
}

export function deepReadFiles(
  dirPath: string,
  onProgress?: (files: number, chars: number) => void
): string {
  const filePaths: string[] = [];
  collectFiles(dirPath, filePaths);

  const contents: string[] = [];
  let totalChars = 0;
  let fileCount = 0;

  for (const filePath of filePaths) {
    if (totalChars >= MAX_TOTAL_CHARS) break;
    try {
      const relative = path.relative(dirPath, filePath);
      const content = fs.readFileSync(filePath, 'utf8').slice(0, MAX_FILE_CHARS);
      const entry = `--- ${relative} ---\n${content}`;
      contents.push(entry);
      totalChars += entry.length;
      fileCount++;
      onProgress?.(fileCount, totalChars);
    } catch {
      // skip unreadable files
    }
  }

  return contents.join('\n\n');
}
