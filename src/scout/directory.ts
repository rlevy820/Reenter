// scout/directory.ts — reads the project folder structure.
// Scans up to 2 levels deep, skips noise like node_modules and build folders.
// Returns a plain list of paths that represent the shape of the project.

import fs from 'node:fs';
import path from 'node:path';

const SKIP = new Set(['node_modules', '__pycache__', '.git', 'dist', 'build', '.next']);

export function scanDirectory(dirPath: string, depth = 0, maxDepth = 2): string[] {
  if (depth > maxDepth) return [];
  const items: string[] = [];

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') || SKIP.has(entry.name)) continue;
      const indent = '  '.repeat(depth);
      if (entry.isDirectory()) {
        items.push(`${indent}${entry.name}/`);
        items.push(...scanDirectory(path.join(dirPath, entry.name), depth + 1, maxDepth));
      } else {
        items.push(`${indent}${entry.name}`);
      }
    }
  } catch {
    // skip folders we can't read
  }

  return items;
}
