// options.ts — the four fixed modes of Reenter.
// These never change based on the project. The AI figures out what each one
// means for this specific project after the user picks.

import type { AppMode } from './types.js';

export const MODES: AppMode[] = [
  {
    title: 'Browse',
    description: 'understand it like it was built yesterday',
    value: 'browse',
  },
  {
    title: 'Run',
    description: 'see it running live on your machine',
    value: 'run',
  },
  {
    title: 'MVP',
    description: 'find the fastest path to real users',
    value: 'mvp',
  },
  {
    title: 'Ship',
    description: 'clean it up and take it all the way',
    value: 'ship',
  },
];
